/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CivicIssue, Comment } from "../types";
import { Search, MapPin, Sparkles, Heart, MessageSquare, ThumbsUp, AlertCircle, Bell, User, Clock, ArrowLeft, Send, CheckCircle2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MapWidget from "./MapWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import { playClickSound } from "../utils/audio";

interface CitizenDashboardProps {
  issues: CivicIssue[];
  onBack: () => void;
  onSelectIssue: (issue: CivicIssue) => void;
  selectedIssue: CivicIssue | null;
  onUpvote: (id: string) => void;
  onAddComment: (id: string, author: string, content: string) => void;
  userCoords: { latitude: number; longitude: number } | null;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  initialStatusFilter?: "all" | "working_or_resolved" | "working" | "resolved";
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  notifications?: any[];
  onMarkNotificationsRead?: () => void;
}

export default function CitizenDashboard({
  issues,
  onBack,
  onSelectIssue,
  selectedIssue,
  onUpvote,
  onAddComment,
  userCoords,
  onShowToast,
  initialStatusFilter = "all",
  isDarkMode = false,
  onToggleDarkMode,
  notifications: propNotifications,
  onMarkNotificationsRead,
}: CitizenDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("Soumya Dandapat");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Sync initial filter from props if it changes
  useEffect(() => {
    setSelectedStatus(initialStatusFilter);
  }, [initialStatusFilter]);

  // Notifications simulation with fallback
  const [localNotifications, setLocalNotifications] = useState([
    { id: 1, text: "Your report 'Graffiti on Historic Fountain' was processed by Gemini AI and dispatched.", read: false, time: "10m ago" },
    { id: 2, text: "Road Maintenance updated status of 'Deep Pothole' to Investigating.", read: true, time: "1h ago" },
    { id: 3, text: "Public Works dispatcher left an official update on your nearby pothole report.", read: true, time: "2h ago" },
  ]);

  const notifications = propNotifications !== undefined ? propNotifications : localNotifications;

  const markAllRead = () => {
    if (onMarkNotificationsRead) {
      onMarkNotificationsRead();
    } else {
      setLocalNotifications(localNotifications.map((n) => ({ ...n, read: true })));
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);

  // Filter logic
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "all" || issue.severity === selectedSeverity;
    
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "working" && (issue.status === "investigating" || issue.status === "scheduled" || issue.status === "in_progress")) ||
      (selectedStatus === "resolved" && issue.status === "resolved") ||
      (selectedStatus === "reported" && issue.status === "reported") ||
      (selectedStatus === "working_or_resolved" && (issue.status === "investigating" || issue.status === "scheduled" || issue.status === "in_progress" || issue.status === "resolved"));

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-100 text-red-800 border border-red-200";
      case "high":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-slate-100 text-slate-850 border border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-neutral-900 text-white border border-neutral-950";
      case "in_progress":
        return "bg-blue-50 text-blue-800 border border-blue-200";
      case "scheduled":
        return "bg-purple-50 text-purple-800 border border-purple-200";
      case "investigating":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(selectedIssue!.id, authorName, commentText);
    setCommentText("");
  };

  return (
    <div className="min-h-screen bg-transparent text-neutral-900 flex flex-col font-sans" id="citizen-dashboard-root">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="p-2 rounded-none bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              id="citizen-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div>
              <h1 className="font-display font-black text-sm uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                CITIZEN CONTROL HUB 
                <span className="text-[9px] font-mono font-bold text-white bg-neutral-950 px-2 py-0.5">ACTIVE LEDGER</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-mono uppercase">Collaborative community safety registry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark/Light Mode Theme Toggle Switch */}
            {onToggleDarkMode && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClickSound();
                  onToggleDarkMode();
                }}
                className="p-2.5 rounded-none bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-600 hover:text-neutral-950 flex items-center justify-center cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                id="citizen-theme-switch"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> : <Moon className="w-4.5 h-4.5 text-neutral-900" />}
              </motion.button>
            )}

            {/* Notifications panel */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClickSound();
                  setShowNotifications(!showNotifications);
                }}
                className="p-2.5 rounded-none bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-600 hover:text-neutral-950 relative cursor-pointer"
                id="notifications-toggle"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#e30613] rounded-full" />
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2.5 w-80 bg-white border border-neutral-900 p-4 z-50 flex flex-col gap-3 shadow-lg rounded-none"
                    id="notifications-panel"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-900 uppercase">Live Notifications</span>
                      <button
                        onClick={markAllRead}
                        className="text-[9px] text-[#e30613] font-mono font-bold uppercase tracking-wider cursor-pointer"
                      >
                        [ MARK ALL READ ]
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-3 rounded-none border text-xs transition-colors ${notif.read ? "bg-neutral-50 border-neutral-200 text-neutral-500" : "bg-red-50/50 border-red-200 text-neutral-900"}`}>
                          <p className="mb-1 leading-relaxed">{notif.text}</p>
                          <span className="text-[9px] font-mono text-neutral-400 uppercase">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 p-1.5 rounded-none pr-3">
              <div className="w-8 h-8 rounded-none bg-neutral-950 flex items-center justify-center text-white font-bold font-mono text-xs">
                SD
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-neutral-950 uppercase">Soumya Dandapat</span>
                <span className="text-[9px] text-[#e30613] font-bold flex items-center gap-1 font-mono uppercase">
                  ★ KARMA SCORE: 98
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* Left Column: List with Filters */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto" id="citizen-list-column">
          
          {/* Filter Panels */}
          <div className="bg-white border border-neutral-200 rounded-none p-4 flex flex-col gap-3 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, ID, or landmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-none pl-9 pr-4 py-2.5 text-neutral-800 font-mono focus:outline-none focus:border-neutral-950"
                id="citizen-search-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-[10px] font-mono bg-white border border-neutral-200 rounded-none py-1.5 px-2 text-neutral-800 focus:outline-none focus:border-neutral-950"
                  id="citizen-category-filter"
                >
                  <option value="all">ALL HAZARDS</option>
                  <option value="pothole">POTHOLES</option>
                  <option value="streetlight">STREETLIGHTS</option>
                  <option value="trash">WASTE / LITTER</option>
                  <option value="water_leak">WATER LEAKS</option>
                  <option value="graffiti">GRAFFITI</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full text-[10px] font-mono bg-white border border-neutral-200 rounded-none py-1.5 px-2 text-neutral-800 focus:outline-none focus:border-neutral-950"
                  id="citizen-severity-filter"
                >
                  <option value="all">ALL</option>
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="critical">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-[10px] font-mono bg-white border border-neutral-200 rounded-none py-1.5 px-2 text-neutral-800 focus:outline-none focus:border-neutral-950"
                  id="citizen-status-filter"
                >
                  <option value="all">ALL</option>
                  <option value="reported">REPORTED</option>
                  <option value="working">WORKING</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="working_or_resolved">WORK. & RESOLVED</option>
                </select>
              </div>
            </div>

            {/* Mobile-friendly toggle for Map vs List */}
            <div className="flex sm:hidden border border-neutral-200 rounded-none overflow-hidden mt-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase ${viewMode === "list" ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-500"}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase ${viewMode === "map" ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-500"}`}
              >
                Map View
              </button>
            </div>
          </div>

          {/* Performer of the Month Leaderboard Widget */}
          <LeaderboardWidget issues={issues} onShowToast={onShowToast} />

          {/* List Queue */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1" id="citizen-issue-cards">
              {filteredIssues.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-200 rounded-none py-12 px-4 text-center">
                  <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400 font-mono uppercase">No matching ledger records.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      className={`p-4 rounded-none border transition-all duration-150 cursor-pointer text-left flex gap-4 relative ${
                        isSelected
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-md"
                          : "bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                      }`}
                      id={`citizen-card-${issue.id}`}
                    >
                      {/* Photo preview */}
                      {issue.imageUrl && (
                        <div className="w-16 h-16 rounded-none overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                          <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none ${getStatusBadge(issue.status)}`}>
                            {issue.status.replace("_", " ")}
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-xs uppercase truncate mb-1 leading-tight">
                          {issue.title}
                        </h3>

                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-2">
                          <MapPin className="w-3 h-3 text-[#e30613]" />
                          <span className="truncate font-mono text-[9px] uppercase">{issue.location.address}</span>
                        </div>

                        {/* Card bottom tray */}
                        <div className={`flex items-center gap-3 border-t pt-2.5 text-[9px] font-mono uppercase ${isSelected ? "border-neutral-800 text-neutral-300" : "border-neutral-100 text-neutral-500"}`}>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className={`w-3.5 h-3.5 text-[#e30613] ${issue.supportedByUser ? "fill-[#e30613]/10" : ""}`} />
                            <strong>{issue.upvotes}</strong> SUPPORTERS
                          </span>
                          <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <strong>{issue.comments.length}</strong> DISCUSSIONS
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Desktop/toggled map widget on mobile */}
          {viewMode === "map" && (
            <div className="lg:hidden h-[400px] rounded-none overflow-hidden border border-neutral-200">
              <MapWidget
                issues={filteredIssues}
                selectedIssueId={selectedIssue?.id || null}
                onSelectIssue={(issue) => {
                  playClickSound();
                  onSelectIssue(issue);
                  setViewMode("list");
                }}
                userCoords={userCoords}
                onShowToast={onShowToast}
              />
            </div>
          )}
        </div>

        {/* Right Column: Split Map / Selected Details Thread */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="citizen-details-column">
          {selectedIssue ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-none p-6 flex flex-col gap-5 flex-1 overflow-y-auto shadow-sm"
              id="citizen-issue-details-panel"
            >
              {/* Back navigation inside details */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <button
                  onClick={() => onSelectIssue(null as any)}
                  className="text-[10px] font-mono uppercase font-bold text-neutral-500 hover:text-neutral-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> [ CLEAR SELECTION ]
                </button>
                <span className="text-[10px] font-mono text-neutral-400">LEDGER ID: {selectedIssue.id}</span>
              </div>

              {/* Header block with photo */}
              <div className="flex flex-col md:flex-row gap-5">
                {selectedIssue.imageUrl && (
                  <div className="md:w-44 aspect-video md:aspect-square bg-neutral-50 rounded-none overflow-hidden border border-neutral-200 shrink-0">
                    <img src={selectedIssue.imageUrl} alt={selectedIssue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-none ${getSeverityBadge(selectedIssue.severity)}`}>
                      {selectedIssue.severity} SEVERITY
                    </span>
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-none ${getStatusBadge(selectedIssue.status)}`}>
                      {selectedIssue.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 ml-auto">
                      {new Date(selectedIssue.reportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="font-display font-black text-neutral-950 text-base md:text-xl uppercase leading-tight mb-3">
                    {selectedIssue.title}
                  </h2>

                  <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-4 border border-neutral-200 rounded-none mb-4 font-sans">
                    {selectedIssue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onUpvote(selectedIssue.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-none border text-xs font-mono font-bold uppercase transition-all ${
                        selectedIssue.supportedByUser
                          ? "bg-[#e30613] border-[#e30613] text-white"
                          : "bg-white border-neutral-300 text-neutral-950 hover:border-neutral-950"
                      }`}
                      id="support-incident-toggle"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {selectedIssue.supportedByUser ? "SUPPORT ENGAGED" : "SUPPORT INCIDENT"} ({selectedIssue.upvotes})
                    </button>
                  </div>
                </div>
              </div>

              {/* Gemini AI Summary Overlay */}
              {selectedIssue.aiSummary && (
                <div className="bg-neutral-950 text-white rounded-none p-5 flex gap-3.5 text-left">
                  <div className="bg-white/10 p-2 rounded-none text-white shrink-0 h-fit">
                    <Sparkles className="w-4.5 h-4.5 text-[#e30613]" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-[#e30613] uppercase tracking-wider mb-1">MUNICIPAL AI DISPATCH SUMMARY</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed font-mono">{selectedIssue.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Comments Thread Section */}
              <div className="border-t border-neutral-200 pt-4 flex-1 flex flex-col gap-4 text-left">
                <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">CITIZEN & DISPATCH THREAD ({selectedIssue.comments.length})</h3>

                <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-56 pr-1">
                  {selectedIssue.comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 font-mono uppercase text-center py-6">No discussions reported yet.</p>
                  ) : (
                    selectedIssue.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-none border text-xs flex flex-col gap-1.5 ${
                          comment.isOfficial
                            ? "bg-red-50/50 border-red-200 text-neutral-900 pl-4 border-l-4 border-l-[#e30613]"
                            : "bg-neutral-50 border-neutral-200 text-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs uppercase flex items-center gap-1.5 ${comment.isOfficial ? "text-neutral-950 font-black" : "text-neutral-700"}`}>
                            {comment.author}
                            {comment.isOfficial && (
                              <span className="text-[8px] font-mono bg-neutral-950 text-white px-1.5 py-0.5 font-bold uppercase tracking-wide">MUNICIPAL DEPT</span>
                            )}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono uppercase">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed font-sans text-xs">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Submission Form */}
                <form onSubmit={handlePostComment} className="flex gap-2 border-t border-neutral-200 pt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Contribute information to this dispatch ticket..."
                    className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-none px-3 py-3 text-neutral-800 font-mono focus:outline-none focus:border-neutral-950"
                    id="comment-input-text"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-none font-bold flex items-center justify-center transition-colors cursor-pointer"
                    id="submit-comment-button"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            // Default split view: display map side-by-side on desktop
            <div className="hidden lg:block flex-1 rounded-none overflow-hidden border border-neutral-200 relative shadow-sm h-full">
              <MapWidget
                issues={filteredIssues}
                selectedIssueId={null}
                onSelectIssue={(issue) => {
                  playClickSound();
                  onSelectIssue(issue);
                }}
                userCoords={userCoords}
                onShowToast={onShowToast}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
