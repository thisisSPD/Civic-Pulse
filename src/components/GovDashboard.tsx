/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CivicIssue, Comment, DepartmentWorkload, PredictiveMaintenanceAlert } from "../types";
import { ShieldAlert, BarChart3, Settings2, Users, HardHat, FileCheck, ArrowLeft, RefreshCw, AlertTriangle, PlayCircle, Layers, CheckCircle2, MoreVertical, Sparkles, Loader2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playClickSound } from "../utils/audio";

interface GovDashboardProps {
  issues: CivicIssue[];
  onBack: () => void;
  onUpdateIssueStatus: (id: string, updates: Partial<CivicIssue>) => void;
  onPostOfficialComment: (id: string, content: string) => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function GovDashboard({
  issues,
  onBack,
  onUpdateIssueStatus,
  onPostOfficialComment,
  onShowToast,
  isDarkMode = false,
  onToggleDarkMode,
}: GovDashboardProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "analytics" | "predictive">("queue");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [deptStats, setDeptStats] = useState<DepartmentWorkload[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveMaintenanceAlert[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // AI Playbook Generation state
  const [isGeneratingPlaybook, setIsGeneratingPlaybook] = useState(false);
  const [aiPlaybook, setAiPlaybook] = useState<any | null>(null);

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  // Fetch Department Workloads and Predictive Maintenance alerts
  const loadGovInsights = async () => {
    setIsLoadingStats(true);
    try {
      const [deptRes, alertRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/predictive-alerts"),
      ]);
      const depts = await deptRes.json();
      const alerts = await alertRes.json();
      setDeptStats(depts);
      setPredictiveAlerts(alerts);
    } catch (err) {
      console.error("Error loading operational analytics", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadGovInsights();
  }, [issues]);

  // Generate AI dispatch solution using server-side Gemini
  const handleGenerateAIPlaybook = async (issueId: string) => {
    setIsGeneratingPlaybook(true);
    setAiPlaybook(null);
    try {
      const response = await fetch("/api/ai/suggest-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      });
      const data = await response.json();
      setAiPlaybook(data);
    } catch (err) {
      console.error("Failed to fetch AI solution playbook", err);
    } finally {
      setIsGeneratingPlaybook(false);
    }
  };

  const handleAuthorizeWorkorder = (id: string) => {
    if (onShowToast) {
      onShowToast(`Workorder #${id} successfully signed and routed to Field Operations.`, "success");
    } else {
      alert(`Workorder #${id} successfully signed and routed to Field Operations.`);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "text-red-800 border-red-200 bg-red-100";
      case "high": return "text-amber-800 border-amber-200 bg-amber-100";
      case "medium": return "text-yellow-800 border-yellow-200 bg-yellow-100";
      default: return "text-blue-800 border-blue-200 bg-blue-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "text-neutral-950 border-neutral-300 bg-neutral-100";
      case "in_progress": return "text-blue-800 border-blue-200 bg-blue-50";
      case "scheduled": return "text-purple-800 border-purple-200 bg-purple-50";
      case "investigating": return "text-amber-800 border-amber-200 bg-amber-50";
      default: return "text-neutral-500 border-neutral-200 bg-neutral-50";
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-neutral-900 flex flex-col font-sans" id="gov-dashboard-root">
      
      {/* Top Banner Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="p-2 rounded-none bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              id="gov-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-display font-black text-sm uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                MUNICIPAL COMMAND CONSOLE 
                <span className="text-[9px] font-mono font-bold text-white bg-[#e30613] px-2 py-0.5">OPERATIONAL ENGINE</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-mono uppercase">Department Dispatch & Operations Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                id="gov-theme-switch"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-neutral-900" />}
              </motion.button>
            )}

            <button
              onClick={() => {
                playClickSound();
                loadGovInsights();
              }}
              className="p-2.5 rounded-none bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-600 hover:text-neutral-900 cursor-pointer"
              id="refresh-gov-data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Analytics Counter Banner */}
      <div className="bg-white border-b border-neutral-200 p-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0 border border-neutral-200 bg-white shadow-sm">
          <div className="p-4 border-r border-neutral-100 text-left">
            <span className="text-[9px] font-mono uppercase font-bold text-neutral-400 block mb-1">Unresolved Incidents</span>
            <span className="text-xl md:text-2xl font-black font-display text-neutral-950">
              {issues.filter((i) => i.status !== "resolved").length} ACTIVE
            </span>
          </div>
          <div className="p-4 border-r border-neutral-100 text-left">
            <span className="text-[9px] font-mono uppercase font-bold text-neutral-400 block mb-1">Pending Duplicates</span>
            <span className="text-xl md:text-2xl font-black font-display text-[#e30613]">
              {issues.filter((i) => i.duplicateOf !== null).length} FLAGGED
            </span>
          </div>
          <div className="p-4 border-r border-neutral-100 text-left">
            <span className="text-[9px] font-mono uppercase font-bold text-neutral-400 block mb-1">Resolved (Last 7d)</span>
            <span className="text-xl md:text-2xl font-black font-display text-neutral-900">
              {issues.filter((i) => i.status === "resolved").length} CLOSED
            </span>
          </div>
          <div className="p-4 text-left">
            <span className="text-[9px] font-mono uppercase font-bold text-neutral-400 block mb-1">Infrastructure Anomaly Risks</span>
            <span className="text-xl md:text-2xl font-black font-display text-[#e30613]">
              {predictiveAlerts.length} HOTZONES
            </span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-neutral-50 border-b border-neutral-200 py-3 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 flex-wrap">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab("queue");
            }}
            className={`px-4 py-2.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              activeTab === "queue" ? "bg-neutral-950 border-neutral-950 text-white" : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-950"
            }`}
            id="tab-btn-queue"
          >
            DISPATCH QUEUE
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab("analytics");
            }}
            className={`px-4 py-2.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              activeTab === "analytics" ? "bg-neutral-950 border-neutral-950 text-white" : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-950"
            }`}
            id="tab-btn-analytics"
          >
            BALANCING STATS
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab("predictive");
            }}
            className={`px-4 py-2.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              activeTab === "predictive" ? "bg-neutral-950 border-neutral-950 text-white" : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-950"
            }`}
            id="tab-btn-predictive"
          >
            PREDICTIVE HAZARDS
          </button>
        </div>
      </div>

      {/* Workspace Containers */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DISPATCH QUEUE */}
          {activeTab === "queue" && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="grid lg:grid-cols-12 gap-6 items-stretch h-full"
            >
               {/* Queue List Table */}
              <div className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto max-h-[650px] pr-1" id="gov-queue-container">
                {issues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setAiPlaybook(null);
                      }}
                      className={`p-4 rounded-none border transition-all cursor-pointer flex justify-between items-start gap-4 text-left ${
                        isSelected
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-md"
                          : "bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                      }`}
                      id={`gov-queue-row-${issue.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none border ${getStatusColor(issue.status)}`}>
                            {issue.status.replace("_", " ")}
                          </span>
                          {issue.duplicateOf && (
                            <span className="text-[8px] font-mono bg-red-100 text-[#e30613] border border-red-200 px-1.5 py-0.5 rounded-none font-bold uppercase">
                              DUPLICATE
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-bold text-xs uppercase mb-1 truncate">{issue.title}</h3>
                        <p className={`text-[10px] mb-2 truncate max-w-md ${isSelected ? "text-neutral-350" : "text-neutral-500"}`}>{issue.description}</p>

                        <div className={`flex items-center gap-3 text-[9px] font-mono uppercase ${isSelected ? "text-neutral-400" : "text-neutral-400"}`}>
                          <span>DEPT: {issue.department}</span>
                          <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                          <span>REP: {issue.reportedBy}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono text-neutral-400 block mb-2 uppercase">
                          {new Date(issue.reportedAt).toLocaleDateString()}
                        </span>
                        {/* Status Change Dropdown */}
                        <select
                          value={issue.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateIssueStatus(issue.id, { status: e.target.value as any })}
                          className="text-[9px] font-mono uppercase bg-neutral-50 border border-neutral-200 rounded-none py-1 px-2 text-neutral-850 font-bold focus:outline-none focus:border-neutral-950 cursor-pointer"
                        >
                          <option value="reported">REPORTED</option>
                          <option value="investigating">INVESTIGATING</option>
                          <option value="scheduled">SCHEDULED</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="resolved">RESOLVED</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Issue Inspector */}
              <div className="lg:col-span-5" id="gov-inspector-container">
                {selectedIssue ? (
                  <div className="bg-white border border-neutral-200 rounded-none p-5 flex flex-col gap-4 max-h-[650px] overflow-y-auto shadow-sm text-left">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">Incident Dispatch Inspector</span>
                      <span className="text-[10px] font-mono text-neutral-400">ID: {selectedIssue.id}</span>
                    </div>

                    <div className="flex gap-4">
                      {selectedIssue.imageUrl && (
                        <div className="w-20 h-20 bg-neutral-50 rounded-none overflow-hidden border border-neutral-200 shrink-0">
                          <img src={selectedIssue.imageUrl} alt={selectedIssue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-display font-black text-xs text-neutral-900 uppercase mb-1">{selectedIssue.title}</h4>
                        <p className="text-[10px] text-neutral-500 mb-2 leading-relaxed font-sans">{selectedIssue.description}</p>
                        <span className="text-[9px] text-neutral-400 font-mono block uppercase">ADDRESS: {selectedIssue.location.address}</span>
                      </div>
                    </div>

                    {/* Duplicate Merging controls */}
                    {selectedIssue.duplicateOf && (
                      <div className="bg-red-50 border border-red-200 rounded-none p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#e30613] shrink-0" />
                          <span className="text-[10px] font-mono font-bold text-[#e30613] uppercase">Duplicate Incident Flagged</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed font-sans">
                          This report duplicates active thread for ledger ID <strong>{selectedIssue.duplicateOf}</strong>. De-duplicating restores independent tracking.
                        </p>
                        <button
                          onClick={() => {
                            onUpdateIssueStatus(selectedIssue.id, { duplicateOf: null });
                            onPostOfficialComment(selectedIssue.id, "Emergency dispatch reviewed duplicate status; confirmed standalone hazard.");
                          }}
                          className="mt-1 px-3 py-1.5 bg-[#e30613] hover:bg-red-700 text-white font-mono font-bold rounded-none text-[9px] uppercase self-start cursor-pointer"
                        >
                          De-duplicate (Standalone)
                        </button>
                      </div>
                    )}

                    {/* Department re-routing */}
                    <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3.5 border border-neutral-200 rounded-none">
                      <div>
                        <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Assigned Department</label>
                        <select
                          value={selectedIssue.department}
                          onChange={(e) => onUpdateIssueStatus(selectedIssue.id, { department: e.target.value })}
                          className="w-full text-[10px] font-mono uppercase bg-white border border-neutral-200 rounded-none py-1.5 px-2 text-neutral-800"
                        >
                          <option value="Public Works (Roads)">Public Works (Roads)</option>
                          <option value="Electrical Utilities">Electrical Utilities</option>
                          <option value="Environmental Services">Environmental Services</option>
                          <option value="Water & Power">Water & Power</option>
                          <option value="Graffiti Abatement">Graffiti Abatement</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Set Severity</label>
                        <select
                          value={selectedIssue.severity}
                          onChange={(e) => onUpdateIssueStatus(selectedIssue.id, { severity: e.target.value as any })}
                          className="w-full text-[10px] font-mono uppercase bg-white border border-neutral-200 rounded-none py-1.5 px-2 text-neutral-800"
                        >
                          <option value="low">LOW</option>
                          <option value="medium">MEDIUM</option>
                          <option value="high">HIGH</option>
                          <option value="critical">CRITICAL</option>
                        </select>
                      </div>
                    </div>

                    {/* Gemini AI Playbook dispatch */}
                    <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#e30613]" /> OPERATIONS PLAYBOOK
                        </span>
                        <button
                          onClick={() => {
                            playClickSound();
                            handleGenerateAIPlaybook(selectedIssue.id);
                          }}
                          className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white font-mono font-bold rounded-none text-[9px] uppercase flex items-center gap-1 cursor-pointer"
                        >
                          Generate Playbook
                        </button>
                      </div>

                      {isGeneratingPlaybook ? (
                        <div className="flex flex-col items-center justify-center py-6 text-neutral-500 gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-950" />
                          <span className="text-[9px] font-mono uppercase">Drafting dispatch guidelines via Gemini...</span>
                        </div>
                      ) : aiPlaybook ? (
                        <div className="flex flex-col gap-3 bg-neutral-950 text-white rounded-none p-4">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-[#e30613] uppercase block mb-1">IMMEDIATE ACTIONS CHECKLIST</span>
                            <ul className="list-disc pl-4 text-xs text-neutral-300 flex flex-col gap-1 font-mono text-[10px]">
                              {aiPlaybook.immediateActions.map((act: string, idx: number) => (
                                <li key={idx}>{act}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[8px] font-mono font-bold text-[#e30613] uppercase block mb-1">REMEDIATION DIRECTIVE</span>
                            <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">{aiPlaybook.remediationPlan}</p>
                          </div>

                          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-none">
                            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase block mb-1">CITIZEN BROADCAST BROADCAST</span>
                            <p className="text-[10px] text-neutral-300 italic font-mono leading-relaxed">"{aiPlaybook.residentUpdate}"</p>
                            <button
                              onClick={() => {
                                onPostOfficialComment(selectedIssue.id, aiPlaybook.residentUpdate);
                                if (onShowToast) {
                                  onShowToast("Broadcast notice successfully published to public ticket thread!", "success");
                                } else {
                                  alert("Broadcast notice successfully published to public ticket thread!");
                                }
                              }}
                              className="mt-2.5 px-3 py-1 bg-white hover:bg-neutral-100 text-neutral-950 rounded-none text-[9px] font-mono font-bold uppercase cursor-pointer"
                            >
                              Publish to Thread
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-neutral-50 border border-neutral-200 border-dashed rounded-none text-center">
                          <p className="text-[10px] text-neutral-400 font-mono uppercase leading-relaxed">
                            Initialize Gemini agent to formulate checklist guidelines & remediation plans.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-none py-12 text-center h-full flex flex-col items-center justify-center">
                    <HardHat className="w-10 h-10 text-neutral-300 mb-2" />
                    <p className="text-[10px] text-neutral-400 font-mono uppercase">Select an active incident queue item.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: ANALYTICS & LOAD BALANCING */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex flex-col gap-6 text-left"
            >
              <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm">
                <div className="mb-4 border-b border-neutral-100 pb-3">
                  <h3 className="font-display font-black text-neutral-950 uppercase text-xs tracking-wider">MUNICIPAL WORKLOAD FACTOR DIAGRAM</h3>
                  <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">Real-time balancing metrics across response departments</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-4">
                    {deptStats.map((dept, idx) => (
                      <div key={idx} className="bg-neutral-50 border border-neutral-200 p-4 rounded-none" id={`dept-load-${idx}`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-neutral-900 uppercase">{dept.department}</span>
                          <span className={`text-[10px] font-mono font-bold uppercase ${dept.workloadPercent > 70 ? "text-red-700 font-black" : dept.workloadPercent > 40 ? "text-amber-700" : "text-neutral-900"}`}>
                            {dept.workloadPercent}% LOAD
                          </span>
                        </div>
                        {/* Custom progress bar */}
                        <div className="w-full bg-neutral-200 h-1.5 rounded-none overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              dept.workloadPercent > 70 ? "bg-[#e30613]" : dept.workloadPercent > 40 ? "bg-amber-500" : "bg-neutral-950"
                            }`}
                            style={{ width: `${dept.workloadPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-400 font-mono uppercase mt-2">
                          <span>{dept.assignedCount} ACTIVE TASKS</span>
                          <span>TARGET AVG {dept.avgCompletionDays} DAYS</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Operational recommendation */}
                  <div className="bg-neutral-950 text-white rounded-none p-6 flex flex-col gap-4 justify-center">
                    <div className="bg-white/10 p-2.5 rounded-none text-white w-fit">
                      <Sparkles className="w-5 h-5 text-[#e30613]" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-white text-xs mb-1.5 uppercase tracking-wider">DISPATCH RECOMMENDATION</h4>
                      <p className="text-[11px] text-neutral-300 leading-relaxed font-mono">
                        Primary utility backlogs are stabilized. Road maintenance workload indices currently show excess capacity. Reroute upcoming structural sidewalk dispatches to Roads to bypass water crews.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PREDICTIVE MAINTENANCE */}
          {activeTab === "predictive" && (
            <motion.div
              key="predictive"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex flex-col gap-6 text-left"
            >
              <div className="grid md:grid-cols-3 gap-4" id="predictive-alerts-grid">
                {predictiveAlerts.map((alert) => (
                  <div key={alert.id} className="bg-white border border-neutral-200 rounded-none p-5 flex flex-col justify-between gap-5 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[8px] font-mono bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-none font-bold uppercase">
                          {(alert.probability * 100).toFixed(0)}% Probability
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">#{alert.infrastructureId}</span>
                      </div>
                      <h4 className="font-display font-black text-xs text-neutral-950 uppercase mb-1">{alert.title}</h4>
                      <p className="text-[10px] text-[#e30613] font-mono uppercase mb-2">{alert.type}</p>
                      <p className="text-[11px] text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-none border border-neutral-200 font-sans">
                        {alert.recommendedAction}
                      </p>
                    </div>

                    <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-mono font-bold uppercase">EST: ₹{alert.estimatedCost.toLocaleString()}</span>
                      <button
                        onClick={() => {
                          playClickSound();
                          handleAuthorizeWorkorder(alert.infrastructureId);
                        }}
                        className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white font-mono font-bold rounded-none uppercase text-[9px] cursor-pointer"
                      >
                        Authorize Workorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
