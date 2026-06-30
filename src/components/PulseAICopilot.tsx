/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, Sparkles, User, RefreshCw, AlertCircle } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function PulseAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Hello! I am your **Pulse AI Copilot**, representing CivicPulse's core dispatch intelligence. How can I help you coordinate local municipal assets or explore our modern platform features today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    playClickSound();
    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    const updatedMessages = [...messages, userMessage];

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with our AI engine.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "model", content: data.content }]);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the smart server agent. Let's try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = (text: string) => {
    handleSend(text);
  };

  const suggestions = [
    "What are your municipal licensing tiers?",
    "How can I earn citizen karma trust points?",
    "What is the dispatch protocol for critical water leaks?",
    "How does CivicPulse save city maintenance budgets?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[360px] sm:w-[400px] h-[550px] bg-white border border-neutral-900 shadow-2xl flex flex-col mb-4 overflow-hidden rounded-none"
          >
            {/* Copilot Header */}
            <div className="bg-neutral-950 p-4 text-white flex items-center justify-between border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white flex items-center justify-center border border-white shrink-0">
                  <Bot className="w-4 h-4 text-neutral-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-display font-black tracking-widest uppercase">
                      PULSE COPILOT
                    </span>
                    <span className="text-[7px] font-mono px-1 py-0.5 bg-red-600 text-white rounded-none tracking-widest uppercase font-extrabold animate-pulse">
                      LIVE CORE
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-400 block tracking-wider mt-0.5 uppercase">
                    GEMINI-3.5-FLASH INFRASTRUCTURE
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize Agent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/50">
              {messages.map((m, idx) => {
                const isModel = m.role === "model";
                
                // Extremely simple manual markdown parsing for bold text highlights
                const renderMessageContent = (text: string) => {
                  const parts = text.split(/(\*\*.*?\*\*)/g);
                  return parts.map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={i} className="font-extrabold text-neutral-950">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                };

                return (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${isModel ? "justify-start text-left" : "justify-end text-right"}`}
                  >
                    {isModel && (
                      <div className="w-6.5 h-6.5 bg-neutral-950 text-white border border-neutral-950 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#e30613]" />
                      </div>
                    )}
                    <div className="max-w-[78%] flex flex-col">
                      <div
                        className={`text-xs p-3 leading-relaxed border font-sans ${
                          isModel
                            ? "bg-white text-neutral-800 border-neutral-200"
                            : "bg-neutral-950 text-white border-neutral-950"
                        }`}
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {renderMessageContent(m.content)}
                      </div>
                      <span className="text-[8px] font-mono text-neutral-400 mt-1 uppercase">
                        {isModel ? "PULSE ENGINE" : "ADMINISTRATOR"}
                      </span>
                    </div>
                    {!isModel && (
                      <div className="w-6.5 h-6.5 bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start text-left">
                  <div className="w-6.5 h-6.5 bg-neutral-950 text-white border border-neutral-950 flex items-center justify-center shrink-0 animate-spin">
                    <RefreshCw className="w-3 h-3 text-red-600" />
                  </div>
                  <div className="max-w-[78%]">
                    <div className="text-[10px] font-mono text-neutral-400 p-2 uppercase animate-pulse">
                      Synthesizing asset advisory routing ledger...
                    </div>
                  </div>
                </div>
              )}

              {/* Error block */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions panel */}
            <div className="px-4 py-2 border-t border-neutral-200 bg-white">
              <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">
                SUGGESTED DISPATCH QUERIES
              </span>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggest(s)}
                    className="text-[9px] text-neutral-700 hover:text-white bg-neutral-50 hover:bg-neutral-900 border border-neutral-200 hover:border-neutral-900 px-2 py-1 transition-colors font-mono cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-neutral-200 bg-neutral-50 flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about pricing, karma, or dispatch rules..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-white border border-neutral-300 text-xs text-neutral-900 px-3 py-2 focus:outline-none focus:border-neutral-950 placeholder-neutral-400 font-sans"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-950 hover:border-neutral-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        className="px-4.5 py-3.5 bg-neutral-950 hover:bg-[#e30613] text-white border border-neutral-950 hover:border-[#e30613] rounded-none shadow-2xl transition-all flex items-center gap-2.5 group cursor-pointer z-50"
      >
        <Bot className="w-4.5 h-4.5 text-white group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-mono font-bold tracking-widest uppercase">
          {isOpen ? "MINIMIZE COPILOT" : "PULSE COPILOT AI"}
        </span>
      </motion.button>
    </div>
  );
}
