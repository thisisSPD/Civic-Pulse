/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  CheckCircle2, 
  ShieldAlert, 
  PlusCircle, 
  LogOut, 
  LogIn, 
  User, 
  Menu, 
  X, 
  Award, 
  Activity,
  MapPin,
  ChevronRight,
  Music,
  Volume2,
  VolumeX
} from "lucide-react";
import { playClickSound, startAmbientDrone, stopAmbientDrone, isAmbientRunning } from "../utils/audio";
import { UserProfile, CivicIssue } from "../types";

interface SidebarProps {
  currentView: "landing" | "citizen" | "gov";
  onNavigate: (view: "landing" | "citizen" | "gov") => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onStartReporting: () => void;
  issues: CivicIssue[];
  userAddress: string | null;
  onResetLocation: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onOpenAuth,
  onStartReporting,
  issues,
  userAddress,
  onResetLocation,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(isAmbientRunning());

  const handleToggleMusic = () => {
    playClickSound();
    if (isAmbientRunning()) {
      stopAmbientDrone();
      setIsMusicPlaying(false);
    } else {
      startAmbientDrone();
      setIsMusicPlaying(true);
    }
  };

  // Statistics calculation
  const activeReportsCount = issues.filter((i) => i.status !== "resolved").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  const handleNavClick = (view: "landing" | "citizen" | "gov") => {
    playClickSound();
    onNavigate(view);
    setIsOpen(false);
  };

  const navItems = [
    {
      id: "landing",
      label: "Overview Hub",
      icon: Home,
      description: "Live maps & community feed",
    },
    {
      id: "citizen",
      label: "Working Problems",
      icon: CheckCircle2,
      description: "Active community hazards",
    },
    {
      id: "gov",
      label: "Municipal Console",
      icon: ShieldAlert,
      description: "Dispatched tasks",
      isRestricted: true,
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 p-6 relative overflow-y-auto" id="sidebar-container">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-8 h-8 rounded-none bg-neutral-950 flex items-center justify-center border border-neutral-950 shadow-sm shrink-0">
          <span className="text-white font-mono font-bold text-xs">CP</span>
        </div>
        <div>
          <span className="text-sm font-display font-black tracking-widest text-neutral-950 uppercase block leading-none">
            CIVIC PULSE
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e30613]" />
            <span className="text-[9px] font-mono font-bold text-neutral-500 tracking-wider uppercase">
              HELVETICA-SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Trigger - Swiss Solid Black Button */}
      <motion.button
        whileHover={{ scale: 1.01, backgroundColor: "#222" }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          playClickSound();
          onStartReporting();
          setIsOpen(false);
        }}
        className="w-full py-3 px-4 mb-6 bg-neutral-950 text-white font-bold rounded-none text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-950"
        id="sidebar-btn-new-report"
      >
        <PlusCircle className="w-4 h-4" />
        File a New Report
      </motion.button>

      {/* Navigation Links */}
      <div className="space-y-1 flex-1">
        <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase block pl-2 mb-2">
          OPERATIONAL INDEX
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isGovDisallowed = item.isRestricted && (!currentUser || currentUser.role !== "officer");

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isGovDisallowed) {
                  playClickSound();
                  onOpenAuth();
                  onNavigate("landing");
                } else {
                  handleNavClick(item.id as "landing" | "citizen" | "gov");
                }
              }}
              className={`w-full text-left p-3 rounded-none transition-all duration-150 flex items-center gap-3 border group relative cursor-pointer ${
                isActive
                  ? "bg-neutral-100 border-neutral-200 text-neutral-950 font-semibold"
                  : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50/80"
              }`}
            >
              {/* Subtle Swiss Red Marker for active view */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#e30613]" />
              )}

              <div className={`w-7 h-7 rounded-none flex items-center justify-center shrink-0 border transition-all ${
                isActive 
                  ? "bg-neutral-950 border-neutral-950 text-white" 
                  : "bg-neutral-50 border-neutral-200 text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600"
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs block font-display tracking-tight">{item.label}</span>
                  {item.isRestricted && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-none font-mono uppercase font-bold tracking-wider ${
                      currentUser?.role === "officer"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                    }`}>
                      {currentUser?.role === "officer" ? "AUTH" : "SECURE"}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-neutral-400 font-mono block leading-tight mt-0.5">
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active City Location Info Widget */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 mb-4 relative" id="sidebar-district-widget">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#e30613] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
              SWISS TRACKED DISTRICT
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-800 block truncate mt-0.5">
              {userAddress || "GPS SIGNAL WAITING..."}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            playClickSound();
            onResetLocation();
          }}
          className="w-full mt-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 bg-white border border-neutral-200 rounded-none transition-colors cursor-pointer"
        >
          SELECT DISTRICT
        </button>
      </div>

      {/* Background Music Continuous Play Controller */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 mb-4 relative" id="sidebar-ambient-music-widget">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <Music className={`w-4 h-4 mt-0.5 shrink-0 ${isMusicPlaying ? "text-[#e30613] animate-pulse" : "text-neutral-400"}`} />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                Continuous Music
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-800 block mt-0.5 uppercase">
                {isMusicPlaying ? "Soft Ambient Playing" : "Music Muted"}
              </span>
            </div>
          </div>
          {isMusicPlaying ? (
            <div className="flex items-end gap-0.5 shrink-0 h-3 pb-0.5">
              <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }} className="w-0.5 bg-[#e30613]" />
              <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-0.5 bg-[#e30613]" />
              <motion.div animate={{ height: [5, 10, 5] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="w-0.5 bg-[#e30613]" />
            </div>
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </div>
        <button
          onClick={handleToggleMusic}
          className={`w-full mt-3 py-2 text-[9px] font-mono font-bold uppercase tracking-wider border rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isMusicPlaying 
              ? "bg-[#e30613] text-white border-[#e30613] hover:bg-[#c00510]" 
              : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50"
          }`}
        >
          {isMusicPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
          {isMusicPlaying ? "MUTE AMBIENT" : "PLAY CONTINUOUS MUSIC"}
        </button>
      </div>

      {/* Account Profile Box at bottom */}
      <div className="border-t border-neutral-200 pt-4 mt-auto">
        {currentUser ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}&backgroundColor=f1f5f9`}
                alt={currentUser.name}
                className="w-8 h-8 rounded-none border border-neutral-200 shrink-0 object-cover bg-white"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-neutral-950 block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block mt-1 ${
                  currentUser.role === "officer" ? "text-amber-600" : "text-[#e30613]"
                }`}>
                  {currentUser.role === "officer" ? `OFFICER BADGE: ${currentUser.govId}` : "COMMUNITY HERO"}
                </span>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  onLogout();
                }}
                className="p-1.5 rounded-none bg-white hover:bg-red-50 text-neutral-400 hover:text-[#e30613] border border-neutral-200 transition-colors cursor-pointer"
                title="Log Out"
                id="sidebar-logout-button"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Statistics bar */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-200">
              <div>
                <span className="text-[8px] text-neutral-400 font-mono block leading-none">KARMA TRUST</span>
                <span className="text-[11px] font-mono font-bold text-neutral-950 leading-none block mt-1">
                  {currentUser.karmaPoints} PTS
                </span>
              </div>
              <div className="pl-3 border-l border-neutral-200">
                <span className="text-[8px] text-neutral-400 font-mono block leading-none">MY ISSUES</span>
                <span className="text-[11px] font-mono font-bold text-neutral-950 leading-none block mt-1">
                  {issues.filter(i => i.reportedBy === currentUser.name || i.reportedBy === `Officer ${currentUser.govId}`).length} ACTIVE
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 text-center">
            <div className="w-8 h-8 rounded-none bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-2">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
            <span className="text-xs font-bold text-neutral-950 block">Join Community Ledger</span>
            <span className="text-[10px] text-neutral-400 font-mono block mb-3 mt-1 leading-tight">
              Earn Swiss-grade citizen trust karma points.
            </span>
            <button
              onClick={() => {
                playClickSound();
                onOpenAuth();
              }}
              className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-mono font-bold uppercase tracking-wider text-[9px] rounded-none border border-neutral-950 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              id="sidebar-auth-button"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In / Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Universal Floating Dashboard Button in the left corner under the marquee */}
      <button
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        className="fixed top-14 left-6 z-[120] px-4 py-3 bg-neutral-950 text-white font-mono font-bold text-[10px] tracking-widest uppercase rounded-none border border-neutral-950 shadow-md hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer"
        id="dashboard-trigger-btn"
      >
        {isOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
        DASHBOARD
      </button>

      {/* Sliding Drawer Panel (Universal for Desktop & Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[130]">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />

            {/* Sidebar content drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.25 }}
              className="absolute top-0 bottom-0 left-0 w-80 h-full max-w-[85vw] shadow-2xl"
            >
              <div className="relative h-full bg-white">
                {renderSidebarContent()}
                {/* Close button inside drawer */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 p-1 text-neutral-400 hover:text-neutral-950 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
