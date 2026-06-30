/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Camera, MapPin, Upload, AlertCircle, Sparkles, Loader2, CheckCircle2, RefreshCw, ChevronRight, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CivicIssue } from "../types";
import { playClickSound } from "../utils/audio";

interface CitizenReportFlowProps {
  onClose: () => void;
  onSuccess: (newIssue: CivicIssue) => void;
  existingIssues: CivicIssue[];
  userCoords: { latitude: number; longitude: number } | null;
  userAddress: string | null;
  userRole?: "citizen" | "officer" | null;
  govId?: string | null;
}

export default function CitizenReportFlow({
  onClose,
  onSuccess,
  existingIssues,
  userCoords,
  userAddress,
  userRole,
  govId,
}: CitizenReportFlowProps) {
  const [step, setStep] = useState<number>(1);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(userCoords);
  const [address, setAddress] = useState<string>(userAddress || "");
  const [isLoadingGPS, setIsLoadingGPS] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [reporterName, setReporterName] = useState<string>(() => {
    if (userRole === "officer" && govId) {
      return `Officer ${govId}`;
    }
    return "Soumya Dandapat";
  });

  // AI assessment stage state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [aiResult, setAiResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Loading messages for AI processing
  const loadingSteps = [
    "Analyzing image pixels and visual texture...",
    "Assessing structural hazard severity...",
    "Cross-referencing municipal duplicate databases...",
    "Predicting optimal city department routing...",
  ];

  // Geolocation trigger
  const handleGetGPS = () => {
    setIsLoadingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          setAddress("1050 Mission St, San Francisco, CA 94103");
          setIsLoadingGPS(false);
        },
        (error) => {
          console.warn("GPS Access Denied. Fallback to San Francisco center.", error);
          setCoords({ latitude: 37.7749 + (Math.random() - 0.5) * 0.02, longitude: -122.4194 + (Math.random() - 0.5) * 0.02 });
          setAddress("850 Market St, San Francisco, CA 94102");
          setIsLoadingGPS(false);
        }
      );
    } else {
      setCoords({ latitude: 37.7749, longitude: -122.4194 });
      setAddress("San Francisco Town Hall, CA");
      setIsLoadingGPS(false);
    }
  };

  // Simulate Webcam Access
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Webcam not accessible, using mock camera stream.", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg");
        setImageBase64(base64);
        stopCamera();
      }
    } else {
      const mockImages = [
        "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800", // pothole
        "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800", // trash
        "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800", // streetlight
      ];
      const randomMockImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      setImageBase64(randomMockImage);
      setIsCapturing(false);
    }
    setStep(2);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCapturing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Backend AI Analysis
  const runAIProcessing = async () => {
    if (!description) return;
    setIsAnalyzing(true);

    for (let i = 0; i < loadingSteps.length; i++) {
      setAnalysisStatus(loadingSteps[i]);
      await new Promise((resolve) => setTimeout(resolve, 850));
    }

    try {
      const payload = {
        title: title || undefined,
        description,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        address: address || "SF Urban Area",
        reportedBy: reporterName || "Soumya Dandapat",
        imageBase64: imageBase64?.startsWith("data:") ? imageBase64 : undefined,
      };

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setAiResult(data.issue);
        setStep(4);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      console.error("AI Dispatch error", err);
      setStep(4);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="report-flow-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 10 }}
        className="bg-white border border-neutral-900 rounded-none w-full max-w-lg overflow-hidden shadow-xl relative flex flex-col max-h-[90vh]"
        id="report-flow-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-950 p-2 text-white">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h2 className="font-display font-black text-sm uppercase tracking-wider text-neutral-950">AI INCIDENT DISPATCH</h2>
              <p className="text-[10px] font-mono uppercase text-neutral-400">Step {step} / 4</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-none border border-transparent hover:border-neutral-200 text-neutral-500 hover:text-neutral-950 transition-all cursor-pointer"
            id="close-report-flow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="flex-1 overflow-y-auto p-6" id="report-flow-content">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CAMERA WORKFLOW */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col items-center text-center gap-5"
              >
                <div className="w-full aspect-video bg-neutral-50 border border-neutral-200 rounded-none overflow-hidden relative flex flex-col items-center justify-center group">
                  {isCapturing ? (
                    <video ref={videoRef} className="w-full h-full object-cover" playInline muted />
                  ) : imageBase64 ? (
                    <img src={imageBase64} alt="Incident view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center gap-3.5 p-4">
                      <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500">
                        <Camera className="w-5 h-5 text-neutral-950" />
                      </div>
                      <p className="text-[10px] font-mono uppercase text-neutral-400 max-w-[240px] leading-relaxed">
                        Hold camera to register hazard or upload a clear incident image file
                      </p>
                    </div>
                  )}

                  {isCapturing && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                      <button
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-neutral-950 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer"
                        id="snap-photo-button"
                      >
                        SNAP PHOTO
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {!isCapturing && (
                    <button
                      onClick={() => {
                        playClickSound();
                        startCamera();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider rounded-none transition-all cursor-pointer"
                      id="use-camera-button"
                    >
                      <Camera className="w-4 h-4 text-[#e30613]" />
                      USE CAMERA
                    </button>
                  )}
                  <button
                    onClick={() => {
                      playClickSound();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-neutral-200 hover:border-neutral-950 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider rounded-none transition-all cursor-pointer"
                    id="upload-image-button"
                  >
                    <Upload className="w-4 h-4 text-neutral-900" />
                    UPLOAD FILE
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="w-full flex justify-end border-t border-neutral-100 pt-4 mt-2">
                  <button
                    onClick={() => {
                      playClickSound();
                      setStep(2);
                    }}
                    className="flex items-center gap-1.5 px-6 py-3 bg-neutral-950 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-none cursor-pointer"
                    id="step-1-next"
                  >
                    CONTINUE WITHOUT IMAGE <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GPS & LOCATION */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h3 className="text-xs font-display font-black text-neutral-950 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#e30613]" /> GEOTAG SYSTEM INTEGRATION
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                    Lock precision coordinates so dispatch responders pinpoint correct maintenance grids.
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 flex flex-col gap-3 relative">
                  {isLoadingGPS ? (
                    <div className="flex flex-col items-center justify-center py-6 text-neutral-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-950" />
                      <span className="text-[9px] font-mono uppercase font-bold text-neutral-500">Retrieving operational satellite telemetry...</span>
                    </div>
                  ) : coords ? (
                    <div className="flex items-start gap-3">
                      <div className="bg-neutral-950 p-2 text-white mt-0.5">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-mono font-bold text-neutral-900 uppercase block mb-0.5">Telemetry Coordinates Resolved</span>
                        <span className="text-[9px] font-mono text-neutral-400 block mb-3">
                          LAT: {coords.latitude.toFixed(6)}, LON: {coords.longitude.toFixed(6)}
                        </span>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Confirm street address..."
                          className="w-full text-xs bg-white border border-neutral-200 rounded-none px-3 py-2 text-neutral-800 font-mono focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetGPS}
                      className="w-full py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-all border border-dashed border-neutral-300 rounded-none cursor-pointer"
                      id="trigger-gps-button"
                    >
                      <MapPin className="w-6 h-6 text-[#e30613]" />
                      <span className="text-[10px] font-mono uppercase font-bold">CLICK TO ACQUIRE GPS TELEMETRY</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-neutral-100 pt-4">
                  <button
                    onClick={() => {
                      playClickSound();
                      setStep(1);
                    }}
                    className="text-[10px] font-mono uppercase font-bold text-neutral-400 hover:text-neutral-950 cursor-pointer"
                  >
                    [ Back to Photo ]
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      setStep(3);
                    }}
                    disabled={!coords}
                    className="flex items-center gap-1 px-6 py-3 bg-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-none cursor-pointer"
                    id="step-2-next"
                  >
                    CONFIRM LOCATION <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: LOG DESCRIPTION & DISPATCH */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col gap-4 text-left"
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-950" />
                    <div className="text-center">
                      <span className="text-[10px] font-mono font-bold text-neutral-900 block mb-1 uppercase">AI AGENT RECONNAISSANCE PROCESS</span>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase block">
                        {analysisStatus}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-xs font-display font-black text-neutral-950 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#e30613]" /> DETAIL ANALYSIS LOGS
                      </h3>
                      <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                        Input details so our server-side dispatcher evaluates classification duplicates instantly.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                        Incident Title <span className="text-neutral-400">(Optional - AI will synthesize)</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Broken Water Main on South Lane"
                        className="w-full text-xs bg-white border border-neutral-200 rounded-none px-3 py-2 text-neutral-800 font-mono focus:outline-none focus:border-neutral-950"
                        id="report-input-title"
                      />

                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                        Reporter Name
                      </label>
                      <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="Reporter name"
                        className="w-full text-xs bg-white border border-neutral-200 rounded-none px-3 py-2 text-neutral-850 font-mono focus:outline-none focus:border-neutral-950"
                        id="report-input-reporter-name"
                      />

                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                        Detailed Description <span className="text-[#e30613]">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="State structural hazard size, severity level, and immediate community risks..."
                        rows={4}
                        className="w-full text-xs bg-white border border-neutral-200 rounded-none px-3 py-2 text-neutral-850 font-sans focus:outline-none focus:border-neutral-950 resize-none"
                        id="report-input-description"
                      />
                    </div>

                    <div className="flex justify-between items-center mt-4 border-t border-neutral-100 pt-4">
                      <button
                        onClick={() => {
                          playClickSound();
                          setStep(2);
                        }}
                        className="text-[10px] font-mono uppercase font-bold text-neutral-400 hover:text-neutral-950 cursor-pointer"
                      >
                        [ Back to Coordinates ]
                      </button>
                      <button
                        onClick={runAIProcessing}
                        disabled={!description}
                        className="flex items-center gap-1.5 px-6 py-3 bg-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-none cursor-pointer"
                        id="trigger-ai-dispatch-button"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        ANALYZE & DISPATCH
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 4: AI SUMMARY & SUCCESS */}
            {step === 4 && aiResult && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="flex flex-col gap-4 text-left"
              >
                {/* Visual Header */}
                <div className="flex items-center gap-3 bg-neutral-950 text-white p-4 rounded-none">
                  <div className="bg-white/10 p-2.5 text-[#e30613]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-[#e30613] uppercase tracking-wider">Analysis Confirmed</h4>
                    <p className="text-xs text-neutral-200 font-mono">TICKET #{aiResult.id} RESOLVED & ACTIVE!</p>
                  </div>
                </div>

                {/* Gemini AI breakdown */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-none p-4 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#e30613]" /> MUNICIPAL DISPATCH CLOUD ANALYSIS
                    </span>
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-none font-bold ${
                      aiResult.severity === "critical" ? "bg-red-100 text-red-800" :
                      aiResult.severity === "high" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {aiResult.severity}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-0.5">Synthesized Ticket Name</span>
                    <p className="text-xs font-bold text-neutral-900 uppercase font-display">{aiResult.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-neutral-100 py-3">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-0.5">Assigned Department</span>
                      <p className="text-xs font-bold text-neutral-850 uppercase">{aiResult.department}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-0.5">Est. Resolution Cycle</span>
                      <p className="text-xs font-bold text-neutral-850 font-mono">{aiResult.workloadTimeDays} DAYS</p>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-none p-3 mt-1 text-left">
                    <span className="text-[9px] font-mono font-bold text-[#e30613] uppercase tracking-wider block mb-1">AI Executive Summary</span>
                    <p className="text-[10px] text-neutral-600 leading-relaxed font-mono">{aiResult.aiSummary}</p>
                  </div>

                  {/* Smart Feature: Duplicate Detection */}
                  {aiResult.duplicateOf ? (
                    <div className="bg-red-50 border border-red-200 rounded-none p-3.5 flex gap-2.5 mt-1">
                      <AlertCircle className="w-5 h-5 text-[#e30613] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-[10px] font-mono font-bold text-[#e30613] uppercase block mb-0.5">Overlapping Hazard Located</span>
                        <p className="text-[10px] text-neutral-600 leading-relaxed mb-3">
                          Similar hazard logs were resolved near these telemetry coordinates. We recommend merging report backlogs to speed resolution workflows.
                        </p>
                        <button
                          onClick={() => {
                            playClickSound();
                            onSuccess(aiResult);
                          }}
                          className="px-3 py-1.5 bg-[#e30613] text-white font-mono font-bold text-[9px] uppercase rounded-none cursor-pointer"
                        >
                          Merge & Support Active Ticket
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono uppercase mt-1">
                      <Info className="w-3.5 h-3.5 text-neutral-900" />
                      No conflicting grid records found at coordinates. Standalone registered.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-4 border-t border-neutral-100 pt-4">
                  <button
                    onClick={() => {
                      playClickSound();
                      onSuccess(aiResult);
                    }}
                    className="px-6 py-3 bg-neutral-950 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-none cursor-pointer"
                    id="finish-reporting-flow"
                  >
                    FINISH & DISPATCH
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
