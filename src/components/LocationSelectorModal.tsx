/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Navigation, Globe, Sparkles, Loader2, X } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface LocationSelectorModalProps {
  onLocationSelected: (coords: { latitude: number; longitude: number }, address: string) => void;
}

const WORLD_PRESETS = [
  { name: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090, code: "DEL" },
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, code: "BOM" },
  { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946, code: "BLR" },
  { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639, code: "CCU" },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, code: "MAA" },
  { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867, code: "HYD" },
  { name: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567, code: "PNQ" },
  { name: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714, code: "AMD" },
];

export default function LocationSelectorModal({ onLocationSelected }: LocationSelectorModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (name: string, lat: number, lon: number) => {
    playClickSound();
    onLocationSelected({ latitude: lat, longitude: lon }, name);
  };

  const handleDetectGPS = () => {
    playClickSound();
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addressName = data.display_name || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          
          onLocationSelected({ latitude, longitude }, addressName);
        } catch {
          onLocationSelected(
            { latitude, longitude },
            `Live Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          );
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error(err);
        setDetecting(false);
        setErrorMsg("Location access denied or timed out. Please select a preset city below.");
      },
      { timeout: 8000 }
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;

    playClickSound();
    setDetecting(true);
    setErrorMsg(null);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customAddress)}&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const formatted = data[0].display_name;
          onLocationSelected({ latitude: lat, longitude: lon }, formatted);
        } else {
          const lat = 40.7128 + (Math.random() - 0.5) * 5.0;
          const lon = -74.0060 + (Math.random() - 0.5) * 5.0;
          onLocationSelected({ latitude: lat, longitude: lon }, customAddress);
        }
      })
      .catch(() => {
        const lat = 40.7128 + (Math.random() - 0.5) * 5.0;
        const lon = -74.0060 + (Math.random() - 0.5) * 5.0;
        onLocationSelected({ latitude: lat, longitude: lon }, customAddress);
      })
      .finally(() => {
        setDetecting(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" id="location-modal-overlay">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white border border-neutral-900 rounded-none w-full max-w-lg p-6 md:p-8 shadow-xl relative text-left font-sans"
        id="location-modal-content"
      >
        {/* Header Block */}
        <div className="text-center mb-6 border-b border-neutral-150 pb-4">
          <div className="inline-flex bg-neutral-950 p-3 text-white mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="font-display font-black text-sm uppercase tracking-widest text-neutral-950 flex items-center justify-center gap-2">
            SET TARGET REGION ZONE <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full" />
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 uppercase max-w-sm mx-auto mt-2 leading-relaxed">
            Configure live municipal maps and AI dispatch registries dynamically to any global urban zone.
          </p>
        </div>

        {detecting ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3" id="detecting-loader">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-950" />
            <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-neutral-400">
              Locking satellite coordinate registers...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* Live GPS Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDetectGPS}
              className="w-full py-3.5 bg-neutral-950 text-white font-mono font-bold uppercase tracking-widest text-xs rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="detect-live-gps-btn"
            >
              <Navigation className="w-4 h-4" />
              DETECT LIVE COORDINATES
            </motion.button>

            {/* Custom Input Search */}
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-1.5" id="custom-city-form">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block pl-1">OR ENTER TARGET ADDRESS</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. London, UK or Toronto, Canada..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="flex-1 text-xs bg-white border border-neutral-200 rounded-none px-4 py-3 text-neutral-800 font-mono focus:outline-none focus:border-neutral-950"
                  id="custom-address-input"
                />
                <button
                  type="submit"
                  className="px-5 bg-neutral-950 text-white hover:bg-neutral-800 rounded-none font-mono font-bold text-xs uppercase cursor-pointer"
                >
                  GO
                </button>
              </div>
            </form>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#e30613] text-[10px] font-mono uppercase font-bold">
                {errorMsg}
              </div>
            )}

            {/* Preset Cities Grid */}
            <div>
              <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-2.5 pl-1">TELEPORT PRESETS</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WORLD_PRESETS.map((city) => (
                  <motion.button
                    key={city.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPreset(city.name, city.lat, city.lon)}
                    className="p-3 bg-neutral-50 hover:bg-neutral-950 hover:text-white border border-neutral-200 hover:border-neutral-950 text-neutral-800 rounded-none flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-tight font-display">{city.name.split(",")[0]}</span>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase">{city.code}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
