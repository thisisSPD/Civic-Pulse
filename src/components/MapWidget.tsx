/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { CivicIssue } from "../types";
import { 
  Compass, Navigation, Layers, Search, Maximize2, Minimize2, 
  Filter, ShieldAlert, Activity, PenTool, Trash2, ZoomIn, ZoomOut
} from "lucide-react";
import { playClickSound } from "../utils/audio";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapWidgetProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: CivicIssue) => void;
  userCoords: { latitude: number; longitude: number } | null;
  onUpdateCoords?: (coords: { latitude: number; longitude: number }, address: string) => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function MapWidget({ 
  issues, 
  selectedIssueId, 
  onSelectIssue, 
  userCoords,
  onUpdateCoords,
  onShowToast
}: MapWidgetProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Drawing Tools
  const [drawingMode, setDrawingMode] = useState<"none" | "zone">("none");
  const [drawnCoords, setDrawnCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [gisZones, setGisZones] = useState<{ id: string; name: string; coords: { latitude: number; longitude: number }[]; color: string }[]>([
    {
      id: "z-1",
      name: "Water Pressure Critical Zone",
      coords: [
        { latitude: 37.785, longitude: -122.420 },
        { latitude: 37.790, longitude: -122.415 },
        { latitude: 37.788, longitude: -122.410 },
        { latitude: 37.780, longitude: -122.415 }
      ],
      color: "rgba(227, 6, 19, 0.05)"
    }
  ]);

  // IoT Sensors
  const [showIoTSensors, setShowIoTSensors] = useState<boolean>(false);
  const iotSensors = useMemo(() => [
    { name: "P-401 Main Leak Sensor", latOffset: 0.008, lonOffset: -0.012, type: "water", status: "Nominal", reading: "45 PSI" },
    { name: "L-102 Grid Photocell Node", latOffset: -0.014, lonOffset: 0.018, type: "electric", status: "Fault Detected", reading: "0 lm (Flicker)" },
    { name: "F-22 Stormwater Drainage", latOffset: 0.015, lonOffset: 0.005, type: "drainage", status: "Optimal", reading: "12% Flow" },
  ], []);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const activeDrawingLayerRef = useRef<L.Polygon | L.Polyline | null>(null);

  const drawingModeRef = useRef(drawingMode);
  useEffect(() => { drawingModeRef.current = drawingMode; }, [drawingMode]);

  const drawnCoordsRef = useRef(drawnCoords);
  useEffect(() => { drawnCoordsRef.current = drawnCoords; }, [drawnCoords]);

  // Initialize Leaflet Map with Positron (Minimal Light) Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = userCoords ? userCoords.latitude : 37.7749;
    const initialLon = userCoords ? userCoords.longitude : -122.4194;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([initialLat, initialLon], 13);

    // Esri World Imagery (Satellite) matches perfectly the Google Earth style requested!
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AeroGRID, IGN, and the GIS User Community"
    }).addTo(map);

    // Add CartoDB hybrid labels on top of the satellite layer for optimal city/road readability
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      pane: "shadowPane" // Ensure labels render on top of tiles but below markers
    }).addTo(map);

    // Track mounting state to prevent asynchronous race conditions if the map is unmounted before any fetch completes
    let isMounted = true;

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (drawingModeRef.current === "zone") {
        playClickSound();
        setDrawnCoords((prev) => [...prev, { latitude: lat, longitude: lng }]);
      } else {
        playClickSound();
        triggerReverseGeocode(lat, lng);
      }
    });

    setTimeout(() => {
      if (isMounted && mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn("Leaflet error during cleanup:", e);
        }
      }
      mapRef.current = null;
      markerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && userCoords) {
      mapRef.current.setView([userCoords.latitude, userCoords.longitude], mapRef.current.getZoom());
    }
  }, [userCoords]);

  const triggerReverseGeocode = async (lat: number, lon: number) => {
    if (onUpdateCoords) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const address = data.display_name || `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        onUpdateCoords({ latitude: lat, longitude: lon }, address);
      } catch {
        onUpdateCoords({ latitude: lat, longitude: lon }, `Zone at (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`);
      }
    }
  };

  const handleLocateMe = () => {
    playClickSound();
    if (!navigator.geolocation) {
      if (onShowToast) {
        onShowToast("Geolocation is not supported by your browser.", "error");
      } else {
        alert("Geolocation is not supported by your browser.");
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        triggerReverseGeocode(latitude, longitude);
      },
      (err) => {
        console.warn("GPS reading failed:", err);
      }
    );
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    playClickSound();
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const addressName = data[0].display_name;
        if (onUpdateCoords) {
          onUpdateCoords({ latitude: lat, longitude: lon }, addressName);
        }
      } else {
        setSearchError("No results found.");
      }
    } catch {
      setSearchError("Geocoding service offline.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveDrawnZone = () => {
    if (drawnCoords.length < 3) return;
    playClickSound();
    const newZone = {
      id: `z-${Date.now()}`,
      name: `User Digitized Zone #${gisZones.length + 1}`,
      coords: [...drawnCoords],
      color: "rgba(227, 6, 19, 0.08)",
    };
    setGisZones((prev) => [...prev, newZone]);
    setDrawnCoords([]);
    setDrawingMode("none");
  };

  const handleClearDrawing = () => {
    playClickSound();
    setDrawnCoords([]);
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterCategory !== "all" && issue.category !== filterCategory) return false;
      if (filterStatus !== "all" && issue.status !== filterStatus) return false;
      return true;
    });
  }, [issues, filterCategory, filterStatus]);

  const getSeverityMarkerColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#e30613"; // Swiss Red
      case "high": return "#000000"; // Pitch Black
      case "medium": return "#737373"; // Charcoal Gray
      case "low": return "#a3a3a3"; // Neutral Gray
      default: return "#10b981"; // Resolved Green
    }
  };

  // Synchronise leaflet map items
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    if (activeDrawingLayerRef.current) {
      activeDrawingLayerRef.current.remove();
      activeDrawingLayerRef.current = null;
    }

    markerGroup.clearLayers();

    // 1. Saved GIS Zones
    gisZones.forEach((zone) => {
      const latlngs = zone.coords.map((c) => [c.latitude, c.longitude] as [number, number]);
      L.polygon(latlngs, {
        color: "#e30613",
        fillColor: zone.color,
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: "2, 3"
      }).addTo(markerGroup)
        .bindPopup(`
          <div class="bg-white text-neutral-900 p-2.5 rounded-none border border-neutral-900 text-xs">
            <strong class="text-neutral-950 font-display uppercase tracking-wider font-black">${zone.name}</strong>
            <p class="text-[9px] text-neutral-400 font-mono mt-1">GIS PRECISE REGION BOUNDARY</p>
          </div>
        `);
    });

    // 2. Active Target Pin
    if (userCoords) {
      const userIcon = L.divIcon({
        className: "custom-user-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-neutral-950/10 rounded-full animate-ping"></div>
            <div class="absolute w-7 h-7 bg-neutral-950/20 rounded-full"></div>
            <div class="w-4.5 h-4.5 bg-neutral-950 border-2 border-white rounded-full shadow-md"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon })
        .addTo(markerGroup)
        .bindPopup(`
          <div class="bg-white text-neutral-900 p-3 rounded-none border border-neutral-900 text-xs min-w-[150px]">
            <strong class="text-neutral-950 font-display font-black uppercase tracking-wider text-[10px]">ACTIVE GIS PIN</strong>
            <p class="text-[9px] font-mono text-neutral-400 mt-1 uppercase">COORDS: ${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}</p>
          </div>
        `);
    }

    // 3. Heatmap
    if (showHeatmap) {
      filteredIssues.forEach((issue) => {
        let heatColor = "#e30613";
        let fillOpacity = 0.15;
        let radius = 150;
        
        if (issue.severity === "critical" || issue.severity === "high") {
          heatColor = "#e30613";
          fillOpacity = 0.3;
          radius = 200;
        } else if (issue.severity === "medium") {
          heatColor = "#737373";
          fillOpacity = 0.2;
          radius = 150;
        } else if (issue.severity === "low") {
          heatColor = "#a3a3a3";
          fillOpacity = 0.15;
          radius = 100;
        }

        L.circle([issue.location.latitude, issue.location.longitude], {
          color: heatColor,
          fillColor: heatColor,
          fillOpacity: fillOpacity,
          stroke: false,
          radius: radius,
        }).addTo(markerGroup);
      });
    } else {
      // 4. Issue Markers
      if (enableClustering) {
        const clusters: { [key: string]: CivicIssue[] } = {};
        const cellSize = 0.005;

        filteredIssues.forEach((issue) => {
          const latCell = Math.floor(issue.location.latitude / cellSize);
          const lonCell = Math.floor(issue.location.longitude / cellSize);
          const key = `${latCell}_${lonCell}`;
          if (!clusters[key]) clusters[key] = [];
          clusters[key].push(issue);
        });

        Object.entries(clusters).forEach(([key, list]) => {
          if (list.length > 1) {
            let sumLat = 0;
            let sumLon = 0;
            list.forEach((i) => {
              sumLat += i.location.latitude;
              sumLon += i.location.longitude;
            });
            const avgLat = sumLat / list.length;
            const avgLon = sumLon / list.length;
            const isSelected = list.some((i) => i.id === selectedIssueId);

            const clusterIcon = L.divIcon({
              className: "custom-cluster-pin",
              html: `
                <div class="relative flex items-center justify-center cursor-pointer">
                  <div class="absolute w-10 h-10 bg-neutral-900/10 rounded-full animate-pulse ${isSelected ? "border border-neutral-950" : ""}"></div>
                  <div class="w-8 h-8 bg-neutral-950 border-2 border-white rounded-none flex items-center justify-center shadow-md">
                    <span class="text-white text-[10px] font-bold font-mono">${list.length}</span>
                  </div>
                </div>
              `,
              iconSize: [48, 48],
              iconAnchor: [24, 24]
            });

            L.marker([avgLat, avgLon], { icon: clusterIcon })
              .addTo(markerGroup)
              .on("click", () => {
                playClickSound();
                onSelectIssue(list[0]);
              });
          } else {
            addSingleIssueMarker(list[0], markerGroup);
          }
        });
      } else {
        filteredIssues.forEach((issue) => {
          addSingleIssueMarker(issue, markerGroup);
        });
      }
    }

    // 5. IoT Sensors
    if (showIoTSensors) {
      const centerLat = userCoords ? userCoords.latitude : 37.7749;
      const centerLon = userCoords ? userCoords.longitude : -122.4194;

      iotSensors.forEach((sensor) => {
        const lat = centerLat + sensor.latOffset;
        const lon = centerLon + sensor.lonOffset;

        const iotIcon = L.divIcon({
          className: "custom-iot-pin",
          html: `
            <div class="relative flex items-center justify-center cursor-help">
              <div class="absolute w-6 h-6 bg-neutral-900/15 rounded-full"></div>
              <div class="w-4 h-4 bg-neutral-950 border-2 border-white rounded-none flex items-center justify-center">
                <span class="text-[7px] text-white font-mono">⚡</span>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([lat, lon], { icon: iotIcon })
          .addTo(markerGroup)
          .bindPopup(`
            <div class="bg-white text-neutral-900 p-2.5 rounded-none border border-neutral-900 text-xs min-w-[150px]">
              <strong class="text-neutral-950 font-display font-black uppercase tracking-wider text-[10px] block mb-1">${sensor.name}</strong>
              <p class="text-[9px] font-mono text-neutral-500 uppercase">STATUS: <span class="text-neutral-950 font-bold">${sensor.status}</span></p>
              <p class="text-[9px] font-mono text-neutral-500 uppercase">METRICS: <span class="font-bold text-neutral-950">${sensor.reading}</span></p>
            </div>
          `);
      });
    }

    // 6. Drawing Nodes
    if (drawnCoords.length > 0) {
      const coordsArr = drawnCoords.map((c) => [c.latitude, c.longitude] as [number, number]);
      if (drawnCoords.length >= 3) {
        const polygon = L.polygon(coordsArr, {
          color: "#e30613",
          fillColor: "#e30613",
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
        activeDrawingLayerRef.current = polygon;
      } else {
        const polyline = L.polyline(coordsArr, {
          color: "#e30613",
          weight: 1.5,
        }).addTo(map);
        activeDrawingLayerRef.current = polyline;
      }
    }

  }, [filteredIssues, selectedIssueId, showHeatmap, enableClustering, showIoTSensors, userCoords, gisZones, drawnCoords]);

  const addSingleIssueMarker = (issue: CivicIssue, group: L.LayerGroup) => {
    const isSelected = selectedIssueId === issue.id;
    const pinColor = getSeverityMarkerColor(issue.severity);

    const issueIcon = L.divIcon({
      className: `custom-issue-pin-${issue.id}`,
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-8 h-8 rounded-none border transition-all duration-200 ${
            isSelected ? "border-neutral-900 scale-125 bg-neutral-100" : "border-transparent"
          }"></div>
          <div class="w-4 h-4 bg-white border-2 rounded-none flex items-center justify-center shadow-sm" style="border-color: ${pinColor}">
            <div class="w-1.5 h-1.5 rounded-none" style="background-color: ${pinColor}"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([issue.location.latitude, issue.location.longitude], { icon: issueIcon })
      .addTo(group)
      .on("click", () => {
        playClickSound();
        onSelectIssue(issue);
      })
      .bindPopup(`
        <div class="bg-white text-neutral-900 p-3 rounded-none border border-neutral-900 text-xs min-w-[200px] shadow-md">
          <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-neutral-200 pb-1.5">
            <strong class="text-neutral-950 block text-xs truncate max-w-[125px] font-display font-black uppercase tracking-wider">${issue.title}</strong>
            <span class="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none" style="color: ${pinColor}; background-color: ${pinColor}15 border: 1px solid ${pinColor}">
              ${issue.severity}
            </span>
          </div>
          <p class="text-[10px] text-neutral-500 line-clamp-2 mb-2 leading-relaxed font-sans">${issue.description}</p>
          <div class="flex items-center justify-between text-[8px] text-neutral-400 font-mono uppercase">
            <span>Status: <strong class="text-neutral-950 font-bold">${issue.status.replace("_", " ")}</strong></span>
            <span class="font-bold text-neutral-800">${issue.category}</span>
          </div>
        </div>
      `);
  };

  const handleZoomIn = () => {
    playClickSound();
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    playClickSound();
    if (mapRef.current) mapRef.current.zoomOut();
  };

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isFullscreen]);

  return (
    <div 
      className={`flex flex-col bg-white border border-neutral-900 rounded-none overflow-hidden shadow-sm relative transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen" : "h-[400px] md:h-[500px] w-full"
      }`} 
      id="map-widget-container"
    >
      {/* Top Controller HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        
        {/* Filters */}
        <div className="flex gap-1.5 pointer-events-auto bg-white p-1.5 rounded-none border border-neutral-900 shadow-sm">
          <select
            value={filterCategory}
            onChange={(e) => { playClickSound(); setFilterCategory(e.target.value); }}
            className="text-[10px] font-mono uppercase tracking-wider text-neutral-950 bg-transparent border-0 focus:ring-0 cursor-pointer py-1 px-2 font-bold focus:outline-none"
            id="map-filter-category"
          >
            <option value="all" className="bg-white text-neutral-950">ALL CATEGORIES</option>
            <option value="pothole" className="bg-white text-neutral-950">POTHOLES</option>
            <option value="streetlight" className="bg-white text-neutral-950">STREETLIGHTS</option>
            <option value="trash" className="bg-white text-neutral-950">ILLEGAL TRASH</option>
            <option value="water_leak" className="bg-white text-neutral-950">WATER LEAKS</option>
            <option value="graffiti" className="bg-white text-neutral-950">GRAFFITI</option>
          </select>
          <div className="w-[1px] h-4 bg-neutral-200 self-center"></div>
          <select
            value={filterStatus}
            onChange={(e) => { playClickSound(); setFilterStatus(e.target.value); }}
            className="text-[10px] font-mono uppercase tracking-wider text-neutral-950 bg-transparent border-0 focus:ring-0 cursor-pointer py-1 px-2 font-bold focus:outline-none"
            id="map-filter-status"
          >
            <option value="all" className="bg-white text-neutral-950">ALL STATUSES</option>
            <option value="reported" className="bg-white text-neutral-950">REPORTED</option>
            <option value="investigating" className="bg-white text-neutral-950">INVESTIGATING</option>
            <option value="scheduled" className="bg-white text-neutral-950">SCHEDULED</option>
            <option value="in_progress" className="bg-white text-neutral-950">IN PROGRESS</option>
            <option value="resolved" className="bg-white text-neutral-950">RESOLVED</option>
          </select>
        </div>

        {/* Search & Location Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <form onSubmit={handleAddressSearch} className="hidden sm:flex bg-white p-1 rounded-none border border-neutral-900 shadow-sm">
            <input
              type="text"
              placeholder="Search target district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[10px] font-mono uppercase px-2 text-neutral-950 focus:outline-none focus:ring-0 w-36 md:w-48 placeholder-neutral-400"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="p-1 rounded-none bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer font-mono font-bold text-[9px]"
            >
              GO
            </button>
          </form>

          <button
            onClick={handleLocateMe}
            className="p-2.5 bg-white text-neutral-500 hover:text-neutral-950 rounded-none border border-neutral-900 shadow-sm transition-all cursor-pointer"
            title="Locate Current Position"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Righthand & Lefthand overlay options */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <button
          onClick={() => { playClickSound(); setShowHeatmap(!showHeatmap); }}
          className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-none border text-[9px] font-mono uppercase font-bold tracking-widest transition-all shadow-sm ${
            showHeatmap
              ? "bg-[#e30613] border-[#e30613] text-white font-extrabold"
              : "bg-white border-neutral-900 text-neutral-700 hover:text-neutral-950"
          }`}
        >
          <Layers className="w-3.5 h-3.5 animate-pulse" />
          HEATMAP OVERLAY
        </button>

        <button
          onClick={() => { playClickSound(); setEnableClustering(!enableClustering); }}
          className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-none border text-[9px] font-mono uppercase font-bold tracking-widest transition-all shadow-sm ${
            enableClustering
              ? "bg-neutral-950 border-neutral-950 text-white font-extrabold"
              : "bg-white border-neutral-900 text-neutral-700 hover:text-neutral-950"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          CLUSTERING
        </button>

        <button
          onClick={() => { playClickSound(); setShowIoTSensors(!showIoTSensors); }}
          className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-none border text-[9px] font-mono uppercase font-bold tracking-widest transition-all shadow-sm ${
            showIoTSensors
              ? "bg-neutral-950 border-neutral-950 text-white font-extrabold"
              : "bg-white border-neutral-900 text-neutral-700 hover:text-neutral-950"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          IoT GRID NODES
        </button>

        {/* Spatial Drawing Digitizer */}
        <div className="pointer-events-auto bg-white p-1 rounded-none border border-neutral-900 shadow-sm flex gap-1 items-center">
          <button
            onClick={() => {
              playClickSound();
              setDrawingMode(drawingMode === "zone" ? "none" : "zone");
            }}
            className={`p-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
              drawingMode === "zone" ? "bg-[#e30613]/10 text-[#e30613] border border-[#e30613]" : "text-neutral-500 hover:text-neutral-950 border border-transparent"
            }`}
            title="GIS Spatial Zone Digitizer"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>
          {drawnCoords.length > 0 && (
            <>
              <button
                onClick={handleSaveDrawnZone}
                className="px-2 py-1 bg-neutral-950 text-white rounded-none text-[8px] font-mono font-bold uppercase tracking-widest cursor-pointer"
              >
                SAVE ({drawnCoords.length})
              </button>
              <button
                onClick={handleClearDrawing}
                className="p-1 text-neutral-400 hover:text-[#e30613] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Righthand HUD: Zoom controllers */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => { playClickSound(); setIsFullscreen(!isFullscreen); }}
          className="p-2.5 bg-white text-neutral-600 hover:text-neutral-950 rounded-none border border-neutral-900 shadow-sm transition-all cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-white text-neutral-600 hover:text-neutral-950 rounded-none border border-neutral-900 shadow-sm transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-white text-neutral-600 hover:text-neutral-950 rounded-none border border-neutral-900 shadow-sm transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="flex-1 w-full bg-neutral-50 z-0" />

      {/* Government of India Official Map Disclaimer Footer */}
      <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-2.5 text-center shrink-0 z-10 font-mono text-[9px] text-neutral-500 uppercase tracking-wider" id="india-map-disclaimer">
        Boundaries shown are as per Survey of India. External boundaries of India are neither correct nor authenticated.
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white px-3.5 py-3 rounded-none border border-neutral-900 shadow-sm pointer-events-none flex flex-col gap-1.5 max-w-[190px] z-10 text-left">
        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-neutral-950" /> LAYER DIRECTORY
        </span>
        <div className="flex items-center gap-2 text-[10px] text-neutral-700 font-mono uppercase">
          <span className="w-2.5 h-2.5 rounded-none bg-[#e30613]"></span>
          <span>Critical Status</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-700 font-mono uppercase">
          <span className="w-2.5 h-2.5 rounded-none bg-neutral-950"></span>
          <span>High Severity</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-700 font-mono uppercase">
          <span className="w-2.5 h-2.5 rounded-none bg-neutral-500"></span>
          <span>Medium Level</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-700 font-mono uppercase">
          <span className="w-2.5 h-2.5 rounded-none bg-emerald-500"></span>
          <span>Resolved Grid</span>
        </div>
      </div>

      {/* Floating Compass */}
      <div className="absolute bottom-4 right-4 bg-white p-2.5 rounded-full border border-neutral-900 shadow-sm text-neutral-700 hover:text-neutral-950 cursor-pointer pointer-events-auto z-10">
        <Compass className="w-5 h-5" />
      </div>
    </div>
  );
}
