/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Sparkles, Camera, BarChart3, Users, ChevronRight, CheckCircle, 
  Clock, ShieldAlert, MapPin, RefreshCw, AlertTriangle, Play, ThumbsUp, Activity,
  DollarSign, TrendingUp, Check, Sliders, Layers
} from "lucide-react";
import { motion } from "motion/react";
import { playClickSound } from "../utils/audio";
import MapWidget from "./MapWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import { CivicIssue } from "../types";

interface LandingPageProps {
  onStartReporting: () => void;
  onEnterCitizenHub: () => void;
  onEnterGovHub: () => void;
  activeReportsCount: number;
  userAddress: string | null;
  onResetLocation: () => void;
  issues: CivicIssue[];
  userCoords: { latitude: number; longitude: number } | null;
  onUpdateCoords: (coords: { latitude: number; longitude: number }, address: string) => void;
  onSelectIssue: (issue: CivicIssue) => void;
  selectedIssue: CivicIssue | null;
  onUpvote: (id: string) => void;
  onEnterCitizenHubWithSelected: (issue: CivicIssue) => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  userRole?: "citizen" | "officer" | null;
  onEnterCitizenHubWithStatusFilter?: (statusFilter: "all" | "working_or_resolved" | "working" | "resolved") => void;
}

export default function LandingPage({
  onStartReporting,
  onEnterCitizenHub,
  onEnterGovHub,
  activeReportsCount,
  userAddress,
  onResetLocation,
  issues,
  userCoords,
  onUpdateCoords,
  onSelectIssue,
  selectedIssue,
  onUpvote,
  onEnterCitizenHubWithSelected,
  onShowToast,
  userRole,
  onEnterCitizenHubWithStatusFilter,
}: LandingPageProps) {
  
  // Local active state filters for list in sidebar
  const [sidebarFilter, setSidebarFilter] = useState<string>("all");

  // SaaS and ROI State Variables
  const [residents, setResidents] = useState<number>(120000);
  const [dispatchTime, setDispatchTime] = useState<number>(8);
  const [iotVehicles, setIotVehicles] = useState<number>(12);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const stats = [
    { label: "Active Incidents Tracked", value: activeReportsCount, icon: ShieldAlert, color: "text-[#e30613]" },
    { label: "Hazards Resolved Today", value: "14", icon: CheckCircle, color: "text-neutral-900" },
    { label: "Avg Resolution Cycle", value: "1.8 Days", icon: Clock, color: "text-neutral-900" },
    { label: "Platform Trust Score", value: "98.4%", icon: Users, color: "text-[#e30613]" },
  ];

  // Filter list sidebar based on category
  const filteredSidebarIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (sidebarFilter !== "all" && issue.category !== sidebarFilter) return false;
      return true;
    }).slice(0, 5); // limit to 5 elegant items
  }, [issues, sidebarFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-neutral-900 selection:bg-neutral-950 selection:text-white font-sans" id="landing-page-root">
      
      {/* SaaS Command Center Infinite Scrolling Marquee Alert Ticker */}
      <div className="w-full bg-neutral-950 text-white py-2.5 border-b border-neutral-900 overflow-hidden select-none shrink-0 relative z-40">
        <div className="animate-marquee flex items-center gap-16 text-[9px] font-mono tracking-widest uppercase">
          {/* Ticker Set 1 */}
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[GIS NODES] L-102 PHOTOCELL INITIATED TRANSMITTER RECOVERY</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[DISPATCH] AUTO-ROUTING ENGINE DETECTED DUPLICATE POTHOLE AT CHERRY AVE</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>[ROI METRIC] $14,240 RECOUPED IN VALVE REPAIR VELOCITY DELTA</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[MUNICIPAL LEDGER] CITIZEN TRUST RATIO UP TO 98.4% IN ACTIVE SECTORS</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>[SYSTEM] ALL 6 DEPARTMENTS WORKING WITHIN INTENDED SLA LIMITS</span>
          </span>

          {/* Ticker Set 2 */}
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[GIS NODES] L-102 PHOTOCELL INITIATED TRANSMITTER RECOVERY</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[DISPATCH] AUTO-ROUTING ENGINE DETECTED DUPLICATE POTHOLE AT CHERRY AVE</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>[ROI METRIC] $14,240 RECOUPED IN VALVE REPAIR VELOCITY DELTA</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full animate-ping" />
            <span>[MUNICIPAL LEDGER] CITIZEN TRUST RATIO UP TO 98.4% IN ACTIVE SECTORS</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>[SYSTEM] ALL 6 DEPARTMENTS WORKING WITHIN INTENDED SLA LIMITS</span>
          </span>
        </div>
      </div>

      {/* Hero Content Section with spacious padding */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col justify-center relative z-10">
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          

          {/* Active Custom Location display with dynamic change link */}
          {userAddress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-none text-xs text-neutral-800 mb-8"
              id="landing-active-location-indicator"
            >
              <MapPin className="w-3.5 h-3.5 text-[#e30613] shrink-0" />
              <span className="truncate max-w-[240px] font-mono text-[10px] uppercase font-bold">ZONE: {userAddress}</span>
              <button
                onClick={() => {
                  playClickSound();
                  onResetLocation();
                }}
                className="p-1 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 transition-colors ml-2 cursor-pointer"
                title="Change active location"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Stark CTA Button Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-16"
            id="landing-cta-buttons"
          >
            <motion.button
              whileHover={{ scale: 1.01, backgroundColor: "#222" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                playClickSound();
                onStartReporting();
              }}
              className="px-8 py-4 bg-neutral-950 text-white font-mono font-bold rounded-none text-xs uppercase tracking-widest transition-all cursor-pointer border border-neutral-950"
              id="landing-btn-report"
            >
              Report a Hazard
            </motion.button>
            {userRole === "officer" ? (
              <motion.button
                whileHover={{ scale: 1.01, backgroundColor: "#fafafa" }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  playClickSound();
                  onEnterGovHub();
                }}
                className="px-8 py-4 bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-950 font-mono font-bold rounded-none text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="landing-btn-gov-dashboard"
              >
                Municipal Console <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01, backgroundColor: "#fafafa" }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  playClickSound();
                  if (onEnterCitizenHubWithStatusFilter) {
                    onEnterCitizenHubWithStatusFilter("all");
                  } else {
                    onEnterCitizenHub();
                  }
                }}
                className="px-8 py-4 bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-950 font-mono font-bold rounded-none text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="landing-btn-resolved-dashboard"
              >
                Working Problems <CheckCircle className="w-4 h-4 text-[#e30613]" />
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* ==================== IMMERSIVE LANDING GIS COMMAND CENTER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
          id="landing-gis-command-center"
        >
          <div className="flex flex-col gap-2 mb-6 border-l-4 border-neutral-950 pl-4">
            <h3 className="font-display font-black text-xl md:text-2xl text-neutral-950 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e30613]" /> Live GIS Command Center
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
              Digitize local hazards or find duplicates instantly. Click any marker to view its dispatch timeline, or click anywhere on the map to set your active reporting location.
            </p>
          </div>

          {/* Universal Performance Metrics Bar Above Map Frame */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-neutral-200 rounded-none shadow-sm mb-6" id="dashboard-metrics-bar">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col gap-1.5 p-5 text-left relative ${
                    idx > 0 ? "border-l border-neutral-100" : ""
                  }`}
                  id={`metric-item-${idx}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-xl md:text-2xl font-display font-black text-neutral-950 block leading-none">
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* GIS Interactive Map Canvas Column */}
            <div className="lg:col-span-2">
              <MapWidget
                issues={issues}
                selectedIssueId={selectedIssue?.id || null}
                onSelectIssue={onSelectIssue}
                userCoords={userCoords}
                onUpdateCoords={onUpdateCoords}
                onShowToast={onShowToast}
              />
            </div>

            {/* Live Incident Stream Queue Column */}
            <div className="bg-white border border-neutral-200 rounded-none p-5 flex flex-col h-[400px] md:h-[500px]">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                <div>
                  <h4 className="font-display font-bold text-xs text-neutral-950 uppercase tracking-wider">Local Queue</h4>
                  <p className="text-[9px] text-neutral-400 font-mono uppercase">Live feed near active target pin</p>
                </div>
                <select
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  className="text-[10px] text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-none px-2 py-1.5 font-mono focus:outline-none focus:border-neutral-950"
                >
                  <option value="all">ALL HAZARDS</option>
                  <option value="pothole">POTHOLES</option>
                  <option value="streetlight">STREETLIGHTS</option>
                  <option value="trash">WASTE / LITTER</option>
                  <option value="water_leak">WATER LEAKS</option>
                </select>
              </div>

              {/* Incidents Scroller */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="landing-incident-scroller">
                {filteredSidebarIssues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-neutral-50 border border-dashed border-neutral-200">
                    <CheckCircle className="w-8 h-8 text-neutral-300 mb-2" />
                    <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">No hazards detected</span>
                  </div>
                ) : (
                  filteredSidebarIssues.map((issue) => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => {
                          playClickSound();
                          onSelectIssue(issue);
                        }}
                        className={`p-4 rounded-none border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-none font-mono font-bold uppercase ${
                            issue.severity === "high" || issue.severity === "critical"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[9px] font-mono uppercase ${isSelected ? "text-neutral-400" : "text-neutral-500"}`}>
                            {issue.status.replace("_", " ")}
                          </span>
                        </div>
                        <h5 className="text-[11px] font-bold block truncate mb-1 uppercase font-display">{issue.title}</h5>
                        <p className={`text-[10px] line-clamp-2 mb-3 leading-relaxed ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>{issue.description}</p>
                        
                        {/* Interactive upvote & explore buttons */}
                        <div className={`flex items-center justify-between gap-2 border-t pt-2.5 mt-1 ${isSelected ? "border-neutral-800" : "border-neutral-100"}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpvote(issue.id);
                            }}
                            className={`flex items-center gap-1 text-[9px] font-mono font-bold uppercase ${isSelected ? "text-neutral-300 hover:text-white" : "text-neutral-500 hover:text-neutral-950"}`}
                          >
                            <ThumbsUp className="w-3 h-3 text-[#e30613]" />
                            <span>{issue.upvotes} UPVOTES</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              onEnterCitizenHubWithSelected(issue);
                            }}
                            className={`flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase ${isSelected ? "text-white hover:text-neutral-300" : "text-neutral-900 hover:text-[#e30613]"}`}
                          >
                            <span>EXPLORE</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action helper bar */}
              <div className="border-t border-neutral-100 pt-3 mt-4 text-center">
                <p className="text-[9px] text-neutral-400 font-mono uppercase mb-2 leading-relaxed">
                  Hazard not present in the database?
                </p>
                <button
                  onClick={onStartReporting}
                  className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-[10px] font-mono uppercase font-bold rounded-none transition-colors cursor-pointer"
                >
                  FILE REPORT DIRECTLY
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Community Leaderboard Highlight */}
        <div className="mb-16">
          <LeaderboardWidget issues={issues} onShowToast={onShowToast} />
        </div>

        {/* ==================== MUNICIPAL ROI ESTIMATOR & SaaS BUDGET PLATFORM ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 bg-white border border-neutral-900 p-8 rounded-none relative overflow-hidden"
          id="municipal-roi-estimator"
        >
          <div className="absolute top-0 right-0 bg-neutral-950 text-white text-[8px] font-mono font-bold px-3 py-1 uppercase tracking-widest">
            SAAS ROI ESTIMATOR CORE
          </div>

          <div className="flex flex-col gap-2 mb-8 border-l-4 border-neutral-950 pl-4">
            <h3 className="font-display font-black text-xl md:text-2xl text-neutral-950 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e30613]" /> MUNICIPAL BUDGET OPTIMIZATION MODEL
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
              Adjust your community population and response parameters to see how CivicPulse saves public taxpayer dollars and accelerates incident dispatch resolution.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Sliders Block */}
            <div className="md:col-span-3 space-y-6">
              {/* Residents Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <Users className="w-3.5 h-3.5 text-[#e30613]" /> Target Population Size
                  </span>
                  <span className="font-bold text-neutral-900">{residents.toLocaleString()} RESIDENTS</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={residents}
                  onChange={(e) => {
                    setResidents(parseInt(e.target.value));
                    playClickSound();
                  }}
                  className="w-full accent-neutral-950 h-1 bg-neutral-100 appearance-none cursor-pointer border border-neutral-200"
                />
              </div>

              {/* Resolution Delay Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <Clock className="w-3.5 h-3.5 text-[#e30613]" /> Current Avg Resolution Cycle
                  </span>
                  <span className="font-bold text-neutral-900">{dispatchTime} DAYS TARGET</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="1"
                  value={dispatchTime}
                  onChange={(e) => {
                    setDispatchTime(parseInt(e.target.value));
                    playClickSound();
                  }}
                  className="w-full accent-neutral-950 h-1 bg-neutral-100 appearance-none cursor-pointer border border-neutral-200"
                />
              </div>

              {/* Maintenance Vehicles Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <Activity className="w-3.5 h-3.5 text-[#e30613]" /> Active Emergency Fleet
                  </span>
                  <span className="font-bold text-neutral-900">{iotVehicles} RESPONSE TRUCKS</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={iotVehicles}
                  onChange={(e) => {
                    setIotVehicles(parseInt(e.target.value));
                    playClickSound();
                  }}
                  className="w-full accent-neutral-950 h-1 bg-neutral-100 appearance-none cursor-pointer border border-neutral-200"
                />
              </div>
            </div>

            {/* Calculations Result Block */}
            <div className="md:col-span-2 bg-neutral-50 border border-neutral-900 p-6 flex flex-col justify-between h-full relative">
              <div className="absolute top-0 left-0 bg-[#e30613] text-white text-[7px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                PREDICTIVE OUTPUTS
              </div>
              
              <div className="space-y-5 py-2">
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold tracking-wider">
                    ESTIMATED BUDGET RETAINED ANNUALLY
                  </span>
                  <span className="text-3xl md:text-4xl font-display font-black text-neutral-950 tracking-tight block mt-1">
                    ₹{Math.floor((residents * 0.45) + (dispatchTime * 12500) + (iotVehicles * 4100)).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 block uppercase font-bold tracking-wider">
                      DISPATCH VELOCITY
                    </span>
                    <span className="text-lg font-display font-black text-neutral-950 block mt-0.5">
                      +{Math.max(45, Math.floor(100 - (dispatchTime * 4.2)))}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 block uppercase font-bold tracking-wider">
                      CITIZEN TRUST RATE
                    </span>
                    <span className="text-lg font-display font-black text-neutral-950 block mt-0.5">
                      {Math.min(99, Math.floor(62 + (20 - dispatchTime) * 1.8))}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 mt-4">
                <p className="text-[9px] text-neutral-500 leading-relaxed font-mono uppercase">
                  *PROJECTIONS DERIVED FROM MUNICIPAL LOGISTIC EFFICIENCY REDUCTION MODELS CONFORMING TO EN 12697-36.
                </p>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ==================== SaaS MUNICIPAL SUBSCRIPTION CORE ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
          id="municipal-licensing-tiers"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-neutral-200 gap-4">
            <div className="flex flex-col gap-2 border-l-4 border-neutral-950 pl-4">
              <h3 className="font-display font-black text-xl md:text-2xl text-neutral-950 uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e30613]" /> MUNICIPAL LICENSING ARCHITECTURE
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Unlock automated routing and geozone analytics designed to align community initiatives with dispatch efficiency.
              </p>
            </div>

            {/* Annual vs Monthly Toggle Switch */}
            <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 p-1.5 self-start md:self-end">
              <button
                onClick={() => {
                  setBillingPeriod("monthly");
                  playClickSound();
                }}
                className={`text-[9px] font-mono font-bold uppercase px-3 py-1.5 transition-all cursor-pointer ${
                  billingPeriod === "monthly"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-950"
                }`}
              >
                MONTHLY BILLING
              </button>
              <button
                onClick={() => {
                  setBillingPeriod("annual");
                  playClickSound();
                }}
                className={`text-[9px] font-mono font-bold uppercase px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingPeriod === "annual"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-950"
                }`}
              >
                <span>ANNUAL BILLING</span>
                <span className="text-[7px] bg-[#e30613] text-white px-1 py-0.5 rounded-none font-extrabold uppercase scale-90">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Starter Grid */}
            <div className="bg-white border border-neutral-200 hover:border-neutral-900 transition-all p-6 flex flex-col justify-between relative group">
              <div>
                <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  PLAN TIERS
                </span>
                <h4 className="font-display font-black text-lg text-neutral-950 uppercase mb-3">STARTER NEIGHBORHOOD</h4>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Perfect for local community initiatives and small micro-communities tracking potholes and light repairs.
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-display font-black text-neutral-950">₹0</span>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase ml-1">/ PERPETUAL</span>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-2.5 mb-8">
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>5 active local geozones</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Camera-first reports</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Community upvote tracking</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  setActivePlan("starter");
                  if (onShowToast) onShowToast("Starter tier standard license authenticated locally.", "success");
                }}
                className={`w-full py-3 text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                  activePlan === "starter"
                    ? "bg-neutral-950 text-white border-neutral-950"
                    : "bg-white hover:bg-neutral-950 text-neutral-900 hover:text-white border-neutral-300 hover:border-neutral-950"
                }`}
              >
                {activePlan === "starter" ? "ACTIVE STARTER CORE" : "DEPLOY TIERS"}
              </button>
            </div>

            {/* Metropolitan Pulse */}
            <div className="bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between relative group">
              <div className="absolute top-0 right-0 bg-[#e30613] text-white text-[7px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                RECOMMENDED
              </div>
              
              <div>
                <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  PLAN TIERS
                </span>
                <h4 className="font-display font-black text-lg text-neutral-950 uppercase mb-3">METROPOLITAN PULSE</h4>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Ideal for growing towns and city districts requiring automated severity indexing and predictive dispatcher routing.
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-display font-black text-neutral-950">
                    ₹{billingPeriod === "monthly" ? "199" : "149"}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase ml-1">/ MONTH</span>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-2.5 mb-8">
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0 font-bold" />
                    <span className="font-semibold text-neutral-900">Unlimited active geozones</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0 font-bold" />
                    <span className="font-semibold text-neutral-900">Gemini automated dispatch router</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0 font-bold" />
                    <span>Predictive maintenance alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0 font-bold" />
                    <span>Integrated department workloads</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  setActivePlan("metro");
                  if (onShowToast) onShowToast("Metropolitan core pipeline initiated. Active GIS zones synchronized.", "success");
                }}
                className={`w-full py-3 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  activePlan === "metro"
                    ? "bg-neutral-950 text-white border border-neutral-950"
                    : "bg-neutral-950 hover:bg-[#e30613] text-white border border-neutral-950 hover:border-[#e30613]"
                }`}
              >
                {activePlan === "metro" ? "ACTIVE METROPOLITAN CORE" : "DEPLOY TIERS"}
              </button>
            </div>

            {/* Mega-City Neural Core */}
            <div className="bg-white border border-neutral-200 hover:border-neutral-900 transition-all p-6 flex flex-col justify-between relative group">
              <div>
                <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  PLAN TIERS
                </span>
                <h4 className="font-display font-black text-lg text-neutral-950 uppercase mb-3">MEGA-CITY NEURAL CORE</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  For massive municipalities requiring raw server connections, IoT sensor networks, and dedicated dispatcher priorities.
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-display font-black text-neutral-950">
                    ₹{billingPeriod === "monthly" ? "499" : "399"}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase ml-1">/ MONTH</span>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-2.5 mb-8">
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Live IoT network node grids</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Custom geozone digitization rails</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Priority 24/7 dispatcher SLA</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>REST API telemetry streams</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  setActivePlan("megacity");
                  if (onShowToast) onShowToast("Mega-City enterprise infrastructure scheduled for review.", "success");
                }}
                className={`w-full py-3 text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                  activePlan === "megacity"
                    ? "bg-neutral-950 text-white border-neutral-950"
                    : "bg-white hover:bg-neutral-950 text-neutral-900 hover:text-white border-neutral-300 hover:border-neutral-950"
                }`}
              >
                {activePlan === "megacity" ? "ACTIVE NEURAL CORE" : "DEPLOY TIERS"}
              </button>
            </div>

          </div>
        </motion.div>


        {/* Feature Grid Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12" id="landing-features-grid">
          <div className="bg-white border border-neutral-200 p-8 rounded-none transition-all duration-200 hover:border-neutral-900">
            <div className="bg-neutral-100 p-2.5 rounded-none border border-neutral-200 w-fit mb-4">
              <Camera className="w-5 h-5 text-neutral-900" />
            </div>
            <h4 className="font-display font-bold text-neutral-950 uppercase mb-2 text-xs tracking-wider">Camera-First Reporting</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Snap a picture, lock coordinates from high-precision GPS, and dispatch the ledger instantly. Zero friction.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 p-8 rounded-none transition-all duration-200 hover:border-neutral-900">
            <div className="bg-neutral-100 p-2.5 rounded-none border border-neutral-200 w-fit mb-4">
              <Sparkles className="w-5 h-5 text-[#e30613]" />
            </div>
            <h4 className="font-display font-bold text-neutral-950 uppercase mb-2 text-xs tracking-wider">Gemini Dispatch Router</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Our server-side AI automatically evaluates severity, identifies duplicate nearby filings, and routes to appropriate city maintenance teams.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 p-8 rounded-none transition-all duration-200 hover:border-neutral-900">
            <div className="bg-neutral-100 p-2.5 rounded-none border border-neutral-200 w-fit mb-4">
              <BarChart3 className="w-5 h-5 text-neutral-900" />
            </div>
            <h4 className="font-display font-bold text-neutral-950 uppercase mb-2 text-xs tracking-wider">Predictive Grid Maintenance</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Analyze historical report volumes using operational AI to patch municipal lines before systemic failures or leaks strike.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
