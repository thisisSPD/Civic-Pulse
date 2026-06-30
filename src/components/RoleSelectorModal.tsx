/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, User, Lock, Building, Check, ArrowRight, Sparkles } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface RoleSelectorModalProps {
  onRoleSelected: (role: "citizen" | "officer", govId: string | null) => void;
  initialRole?: "citizen" | "officer" | null;
  onClose?: () => void;
  canClose?: boolean;
}

export default function RoleSelectorModal({
  onRoleSelected,
  initialRole = null,
  onClose,
  canClose = false,
}: RoleSelectorModalProps) {
  const [selected, setSelected] = useState<"citizen" | "officer">(initialRole || "citizen");
  const [govId, setGovId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (selected === "officer") {
      if (!govId.trim()) {
        setError("A valid Government ID Code is required for officer authentication.");
        return;
      }
      setError(null);
      setVerifying(true);

      // Simulate secure handshake loading
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      setVerifying(false);
      onRoleSelected("officer", govId.trim());
    } else {
      onRoleSelected("citizen", null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" id="role-selector-backdrop">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 15 }}
        className="relative w-full max-w-lg bg-white border border-neutral-900 rounded-none p-6 md:p-8 shadow-xl z-10 flex flex-col gap-6 text-left font-sans"
        id="role-selector-container"
      >
        {/* Modal Header */}
        <div className="text-center flex flex-col items-center border-b border-neutral-150 pb-4">
          <div className="w-12 h-12 bg-neutral-950 flex items-center justify-center text-white mb-3">
            <Shield className="w-6 h-6 text-[#e30613]" />
          </div>
          <h2 className="font-display font-black text-sm uppercase tracking-widest text-neutral-950">
            CLEARANCE SECURE CHECKPOINT
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 uppercase mt-2">
            Select your operational clearance tier to access live GIS logs and municipal dispatches.
          </p>
        </div>

        {/* Selection Cards */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Citizen Selection */}
            <div
              onClick={() => {
                playClickSound();
                setSelected("citizen");
                setError(null);
              }}
              className={`p-4 rounded-none border transition-all cursor-pointer flex flex-col gap-3 relative ${
                selected === "citizen"
                  ? "bg-neutral-50 border-neutral-950"
                  : "bg-white border-neutral-200 hover:border-neutral-500"
              }`}
              id="role-card-citizen"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-none flex items-center justify-center border ${
                  selected === "citizen" ? "bg-neutral-950 border-neutral-950 text-white" : "bg-white border-neutral-200 text-neutral-400"
                }`}>
                  <User className="w-4 h-4" />
                </div>
                {selected === "citizen" && (
                  <span className="w-4 h-4 bg-neutral-950 flex items-center justify-center text-white text-[9px] font-mono">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-950 uppercase font-display tracking-wide">Citizen Operator</h3>
                <p className="text-[10px] text-neutral-500 mt-1.5 leading-relaxed font-sans">
                  Register public hazards, track resolution cycles, and view civic duplicate records instantly.
                </p>
              </div>
            </div>

            {/* Officer Selection */}
            <div
              onClick={() => {
                playClickSound();
                setSelected("officer");
              }}
              className={`p-4 rounded-none border transition-all cursor-pointer flex flex-col gap-3 relative ${
                selected === "officer"
                  ? "bg-neutral-50 border-[#e30613]"
                  : "bg-white border-neutral-200 hover:border-neutral-500"
              }`}
              id="role-card-officer"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-none flex items-center justify-center border ${
                  selected === "officer" ? "bg-[#e30613] border-[#e30613] text-white" : "bg-white border-neutral-200 text-neutral-400"
                }`}>
                  <Building className="w-4 h-4" />
                </div>
                {selected === "officer" && (
                  <span className="w-4 h-4 bg-[#e30613] flex items-center justify-center text-white text-[9px] font-mono">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-950 uppercase font-display tracking-wide">Municipal Officer</h3>
                <p className="text-[10px] text-neutral-500 mt-1.5 leading-relaxed font-sans">
                  Audit registered tickets, authorize municipal workorders, and view predictive workloads.
                </p>
              </div>
            </div>

          </div>

          {/* Secure Handshake Input for Officers */}
          <AnimatePresence mode="wait">
            {selected === "officer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-neutral-800">
                    <Lock className="w-4.5 h-4.5 text-[#e30613]" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest">OFFICER BADGE ID CODE REQUIRED</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. GOV-SF-4491, COUNCIL-DEPT-99"
                      value={govId}
                      onChange={(e) => {
                        setGovId(e.target.value);
                        setError(null);
                      }}
                      className="w-full text-xs font-mono bg-white border border-neutral-200 rounded-none px-3 py-2.5 text-neutral-850 focus:outline-none focus:border-neutral-950"
                      disabled={verifying}
                      id="gov-id-input-field"
                    />
                    <p className="text-[9px] text-neutral-400 mt-1.5 leading-relaxed font-mono uppercase">
                      * Enter any credential sequence or numeric badge to authorize sandbox console.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Error Message */}
          {error && (
            <div className="text-[#e30613] text-[10px] font-mono font-bold bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-none text-center uppercase">
              {error}
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex items-center gap-2 mt-1 border-t border-neutral-100 pt-4">
            {canClose && onClose && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="flex-1 py-3 bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-500 hover:text-neutral-950 rounded-none font-mono font-bold text-xs uppercase cursor-pointer"
              >
                CANCEL
              </button>
            )}
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 py-3 bg-neutral-950 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer disabled:opacity-50"
              id="role-submit-btn"
            >
              {verifying ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin mr-1 text-white" />
                  AUTHENTICATING CLEARED PROTOCOL...
                </>
              ) : (
                <>
                  AUTHORIZE CONSOLE ACCESS
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
