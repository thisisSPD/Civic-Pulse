/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, ThumbsUp, Heart, Star, Sparkles, TrendingUp, CheckCircle, HelpCircle } from "lucide-react";
import { playClickSound } from "../utils/audio";
import { CivicIssue } from "../types";

interface LeaderboardWidgetProps {
  issues: CivicIssue[];
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
}

interface Performer {
  name: string;
  avatar: string;
  totalReports: number;
  resolvedReports: number;
  effectiveness: number; // 0-100%
  avgUpvotes: number;
  primaryCategory: string;
  badge: string;
  karma: number;
}

export default function LeaderboardWidget({ issues, onShowToast }: LeaderboardWidgetProps) {
  // Local state to keep track of added thank-yous/karma points dynamically
  const [localKarma, setLocalKarma] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);

  // Derive performer statistics from actual reports list combined with beautiful seeded members
  const performers = useMemo(() => {
    const statsByUser: Record<string, { total: number; resolved: number; upvotes: number; categories: Record<string, number> }> = {};

    const basePerformers = [
      { name: "Raghu Mishra", baseReports: 12, baseResolved: 10, baseUpvotes: 180, avatar: "RM", badge: "Hazard Hunter", category: "pothole" },
      { name: "Anushka Gupta", baseReports: 9, baseResolved: 8, baseUpvotes: 140, avatar: "AG", badge: "Light Bringer", category: "streetlight" },
      { name: "Krishna Kumar", baseReports: 7, baseResolved: 6, baseUpvotes: 210, avatar: "KK", badge: "Water Warden", category: "water_leak" },
      { name: "Preeti Sharma", baseReports: 6, baseResolved: 4, baseUpvotes: 85, avatar: "PS", badge: "Esthetic Guardian", category: "graffiti" },
      { name: "Siddharth Patel", baseReports: 5, baseResolved: 4, baseUpvotes: 75, avatar: "SP", badge: "Eco Warrior", category: "trash" },
    ];

    // Populate seed statistics
    basePerformers.forEach((p) => {
      statsByUser[p.name] = {
        total: p.baseReports,
        resolved: p.baseResolved,
        upvotes: p.baseUpvotes,
        categories: { [p.category]: p.baseReports },
      };
    });

    // Accumulate actual current list issues
    issues.forEach((issue) => {
      const author = issue.reportedBy || "Anonymous";
      if (author === "Anonymous") return; // Keep leaderboard verified

      if (!statsByUser[author]) {
        statsByUser[author] = { total: 0, resolved: 0, upvotes: 0, categories: {} };
      }

      statsByUser[author].total += 1;
      if (issue.status === "resolved") {
        statsByUser[author].resolved += 1;
      }
      statsByUser[author].upvotes += issue.upvotes;
      statsByUser[author].categories[issue.category] = (statsByUser[author].categories[issue.category] || 0) + 1;
    });

    // Compile final Performer objects
    const list: Performer[] = Object.keys(statsByUser).map((name) => {
      const stats = statsByUser[name];
      
      // Determine their primary category of impact
      let primaryCat = "general";
      let maxCount = 0;
      Object.entries(stats.categories).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count;
          primaryCat = cat;
        }
      });

      // Calculate effectiveness score based on resolution rates and community support
      const resolutionRatio = stats.total > 0 ? stats.resolved / stats.total : 0.8;
      const effectiveness = Math.min(
        100,
        Math.round(resolutionRatio * 75 + Math.min(25, (stats.upvotes / (stats.total || 1)) * 3.5))
      );

      // Average upvotes
      const avgUpvotes = Math.round((stats.upvotes / (stats.total || 1)) * 10) / 10;

      // Badges
      let badge = "Active Watcher";
      if (primaryCat === "pothole") badge = "Pavement Sentinel";
      else if (primaryCat === "streetlight") badge = "Grid Luminary";
      else if (primaryCat === "water_leak") badge = "Water Warden";
      else if (primaryCat === "trash") badge = "Sanitation Ally";
      else if (primaryCat === "graffiti") badge = "Mural Guardian";

      // Seed baseline karma point values based on total performance
      const baseKarma = stats.total * 30 + stats.resolved * 50 + stats.upvotes;

      return {
        name,
        avatar: name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2),
        totalReports: stats.total,
        resolvedReports: stats.resolved,
        effectiveness: effectiveness || 85,
        avgUpvotes,
        primaryCategory: primaryCat,
        badge,
        karma: baseKarma + (localKarma[name] || 0),
      };
    });

    // Sort by: Effectiveness Index & Total Reports
    return list.sort((a, b) => b.effectiveness * b.totalReports - a.effectiveness * a.totalReports);
  }, [issues, localKarma]);

  const leader = performers[0];
  const runnersUp = performers.slice(1, expanded ? 5 : 3);

  const handleThankUser = (name: string) => {
    playClickSound();
    setLocalKarma((prev) => ({
      ...prev,
      [name]: (prev[name] || 0) + 15,
    }));
    if (onShowToast) {
      onShowToast(`Sent thank-you badge to ${name}! +15 Community Karma awarded.`, "success");
    }
  };

  if (!leader) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm relative overflow-hidden flex flex-col gap-5" id="community-leaderboard-widget">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-neutral-950 p-1.5 rounded-none text-white">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-display font-black text-neutral-950 uppercase tracking-wider flex items-center gap-1.5">
              LEDGER LEADERBOARD 
              <span className="text-[9px] text-[#e30613] font-mono font-bold bg-red-50 border border-red-200/50 px-1.5 py-0.5">MONTHLY STAR</span>
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">Recognizing active and effective reports</p>
          </div>
        </div>

        <button
          onClick={() => {
            playClickSound();
            setExpanded(!expanded);
          }}
          className="text-[9px] text-neutral-500 hover:text-neutral-950 font-mono font-bold uppercase tracking-widest cursor-pointer"
        >
          {expanded ? "[ SEE LESS ]" : "[ VIEW ALL ]"}
        </button>
      </div>

      {/* Cash Prizes Announcement Banner */}
      <div className="bg-red-50 border border-red-200/60 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in" id="leaderboard-cash-rewards-banner">
        <div className="flex items-center gap-3">
          <div className="bg-[#e30613] text-white px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
            ₹ PRIZE POOL
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-950 uppercase">Active Municipal Cash Awards</h4>
            <p className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">
              Rank #1: <strong className="text-[#e30613] font-black">₹10,000 Cash</strong> | Rank #2: <strong className="text-neutral-900 font-bold">₹5,000 Cash</strong> | Rank #3: <strong className="text-neutral-900 font-bold">₹2,500 Cash</strong>
            </p>
          </div>
        </div>
        <div className="text-[9px] font-mono font-bold bg-white border border-neutral-300 text-neutral-800 px-2 py-1 uppercase tracking-wider shrink-0">
          SPONSORED BY COUNCIL
        </div>
      </div>

      {/* Showcase of the #1 Leader */}
      <div className="bg-neutral-50 rounded-none p-5 border border-neutral-200 flex flex-col md:flex-row gap-5 items-center relative overflow-hidden">
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-none bg-neutral-950 border border-neutral-950 flex items-center justify-center text-white font-mono font-bold text-sm relative">
            {leader.avatar}
            <div className="absolute -top-1.5 -right-1.5 bg-[#e30613] text-white p-0.5">
              <Star className="w-3 h-3 fill-current text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-neutral-950 uppercase block">{leader.name}</span>
            <span className="inline-flex self-center md:self-start items-center px-2 py-0.5 bg-neutral-950 text-white text-[8px] font-mono font-bold uppercase">
              RANK #1
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-neutral-500">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-900" />
              <span className="font-mono text-[10px] uppercase"><strong>{leader.totalReports}</strong> FILED ({leader.resolvedReports} RESOLVED)</span>
            </div>
            <span className="w-1 h-1 bg-neutral-300 rounded-full hidden sm:inline" />
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#e30613]" />
              <span className="font-mono text-[10px] uppercase">EFFECTIVENESS: <strong className="text-neutral-950 font-black">{leader.effectiveness}%</strong></span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-200 rounded-none h-1 mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${leader.effectiveness}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-neutral-950 h-full"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleThankUser(leader.name)}
          className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-950 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-950 rounded-none flex items-center gap-2 transition-all cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Heart className="w-3 h-3 text-[#e30613] fill-[#e30613]/10" />
          <span>AWARD BADGE</span>
        </button>
      </div>

      {/* Runner ups board */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block pl-1">
          TOP MUNICIPAL CONTRIBUTORS RUNNER-UP BOARD
        </span>
        
        <div className="flex flex-col gap-2">
          {runnersUp.map((runner, index) => (
            <div
              key={runner.name}
              className="p-3.5 rounded-none bg-neutral-50 border border-neutral-200 hover:border-neutral-300 flex items-center justify-between gap-3 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-[10px] font-mono font-bold text-neutral-400 w-3">
                  {index + 2}
                </span>
                <div className="w-8 h-8 rounded-none bg-white border border-neutral-200 flex items-center justify-center text-[10px] font-mono font-bold text-neutral-700 shrink-0">
                  {runner.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-950 uppercase truncate">{runner.name}</span>
                    <span className="text-[9px] text-[#e30613] font-mono font-semibold">({runner.badge})</span>
                  </div>
                  <p className="text-[9px] text-neutral-400 font-mono uppercase mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{runner.totalReports} FILINGS</span>
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                    <span>EFFECTIVENESS: <strong className="text-neutral-950">{runner.effectiveness}%</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono font-bold text-neutral-950 bg-white px-2 py-0.5 border border-neutral-200">
                  {runner.karma} PTS
                </span>
                <button
                  onClick={() => handleThankUser(runner.name)}
                  className="p-1.5 rounded-none bg-white hover:bg-red-50 border border-neutral-200 hover:border-[#e30613] text-[#e30613] transition-colors cursor-pointer"
                  title="Thank contributor"
                >
                  <Heart className="w-3.5 h-3.5 fill-red-500/5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
