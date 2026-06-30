/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";

export default function AestheticBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#fbfbfc]" id="aesthetic-bg-container">
      {/* Swiss Clean Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px"
        }}
        id="bg-swiss-grid-large"
      />

      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #cbd5e1 1px, transparent 1px),
            linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px"
        }}
        id="bg-swiss-grid-fine"
      />

      {/* Exquisite delicate light visual orbs with high-end designer glow */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-slate-200/40 blur-[120px] mix-blend-multiply"
        id="bg-orb-1"
      />
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-100/30 blur-[140px] mix-blend-multiply"
        id="bg-orb-2"
      />

      {/* Decorative vertical lines on sides to represent structural Swiss architecture */}
      <div className="absolute left-[120px] top-0 bottom-0 w-[1px] bg-slate-200/50 hidden xl:block" />
      <div className="absolute right-[120px] top-0 bottom-0 w-[1px] bg-slate-200/50 hidden xl:block" />
    </div>
  );
}
