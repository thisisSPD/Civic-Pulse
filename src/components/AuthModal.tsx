/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Lock, Shield, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react";
import { playClickSound } from "../utils/audio";
import { UserProfile } from "../types";

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AuthModal({ onClose, onAuthSuccess, onShowToast }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"citizen" | "officer">("citizen");
  const [govId, setGovId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (type: "citizen" | "officer") => {
    playClickSound();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser: UserProfile = {
        email: type === "citizen" ? "citizen@civicpulse.gov" : "chief.officer@sf.gov",
        name: type === "citizen" ? "Soumya Dandapat" : "Officer Delta-49",
        role: type,
        govId: type === "officer" ? "SF-PD-49" : undefined,
        karmaPoints: type === "citizen" ? 180 : 450,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${type === "citizen" ? "Soumya" : "Delta49"}&backgroundColor=0f172a`,
        reportedCount: type === "citizen" ? 4 : 28,
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      localStorage.setItem("currentUser", JSON.stringify(demoUser));
      localStorage.setItem("userRole", type);
      if (type === "officer") {
        localStorage.setItem("govId", "SF-PD-49");
      } else {
        localStorage.removeItem("govId");
      }
      
      onAuthSuccess(demoUser);
      onShowToast(`Logged in successfully as ${demoUser.name}!`, "success");
      onClose();
    }, 850);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onShowToast("Please fill in all required fields.", "error");
      return;
    }
    if (isSignUp && !name) {
      onShowToast("Please enter a display name.", "error");
      return;
    }
    if (role === "officer" && !govId) {
      onShowToast("Municipal officers must provide a Government Badge ID.", "error");
      return;
    }

    playClickSound();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        email,
        name: isSignUp ? name : (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)),
        role,
        govId: role === "officer" ? govId : undefined,
        karmaPoints: isSignUp ? 20 : 120,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name || email}&backgroundColor=0f172a`,
        reportedCount: isSignUp ? 0 : 3,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("userRole", role);
      if (role === "officer") {
        localStorage.setItem("govId", govId);
      } else {
        localStorage.removeItem("govId");
      }

      onAuthSuccess(user);
      onShowToast(
        isSignUp 
          ? `Account created! Welcome to CivicPulse, ${user.name}.` 
          : `Welcome back, ${user.name}!`, 
        "success"
      );
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 10 }}
        className="relative w-full max-w-md bg-white border border-neutral-900 rounded-none p-6 shadow-xl overflow-hidden z-10 text-left"
        id="auth-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-150 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-neutral-950 flex items-center justify-center text-white">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-neutral-950 uppercase">
                {isSignUp ? "CREATE LEDGER PROFILE" : "AUTHORIZE DISPATCH ACCESS"}
              </h3>
              <p className="text-[9px] text-neutral-400 font-mono uppercase">CivicPulse Identity Ledger Protocol</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-none border border-transparent hover:border-neutral-200 text-neutral-500 hover:text-neutral-950 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playground Access */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-none p-3.5 mb-6">
          <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase block mb-2.5">
            FAST PLAYGROUND DEMO PORTALS:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin("citizen")}
              disabled={isLoading}
              className="px-3 py-2.5 text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-950 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-950 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5" /> [ CITIZEN ]
            </button>
            <button
              onClick={() => handleDemoLogin("officer")}
              disabled={isLoading}
              className="px-3 py-2.5 text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-950 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-950 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5" /> [ OFFICER ]
            </button>
          </div>
        </div>

        {/* Sign In vs Sign Up Tab */}
        <div className="flex border-b border-neutral-200 mb-6">
          <button
            onClick={() => {
              playClickSound();
              setIsSignUp(false);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-widest uppercase border-b-2 transition-colors cursor-pointer ${
              !isSignUp
                ? "border-neutral-950 text-neutral-950"
                : "border-transparent text-neutral-400 hover:text-neutral-750"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              playClickSound();
              setIsSignUp(true);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-widest uppercase border-b-2 transition-colors cursor-pointer ${
              isSignUp
                ? "border-neutral-950 text-neutral-950"
                : "border-transparent text-neutral-400 hover:text-neutral-750"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="e.g. Soumya Dandapat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-none focus:outline-none focus:border-neutral-950 text-neutral-800 font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-none focus:outline-none focus:border-neutral-950 text-neutral-800 font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-neutral-200 rounded-none focus:outline-none focus:border-neutral-950 text-neutral-800 font-mono"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-950 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selector during signup */}
          {isSignUp && (
            <div>
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Community Access Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setRole("citizen");
                  }}
                  className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer ${
                    role === "citizen"
                      ? "bg-neutral-950 border-neutral-950 text-white"
                      : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-950"
                  }`}
                  disabled={isLoading}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setRole("officer");
                  }}
                  className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer ${
                    role === "officer"
                      ? "bg-[#e30613] border-[#e30613] text-white"
                      : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-950"
                  }`}
                  disabled={isLoading}
                >
                  Officer
                </button>
              </div>
            </div>
          )}

          {/* Gov Badge ID */}
          {role === "officer" && isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#e30613] mb-1">
                Government Badge ID <span className="text-[#e30613]">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 w-4 h-4 text-[#e30613]" />
                <input
                  type="text"
                  placeholder="e.g. SF-PD-99"
                  value={govId}
                  onChange={(e) => setGovId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#e30613] rounded-none focus:outline-none focus:border-[#e30613] text-neutral-900 font-mono"
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest text-white bg-neutral-950 hover:bg-neutral-850 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                VERIFYING LEDGER IDENTITY...
              </>
            ) : (
              <>
                {isSignUp ? "CREATE NEW SECURE LEDGER" : "AUTHENTICATE SECURE SESSION"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4.5 text-center border-t border-neutral-100 pt-3">
          <span className="text-[8px] font-mono text-neutral-400 uppercase">
            🛡️ Encrypted with TLS 1.3 • Google Cloud Key Ring Persistent Session
          </span>
        </div>
      </motion.div>
    </div>
  );
}
