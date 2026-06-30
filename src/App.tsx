/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import LandingPage from "./components/LandingPage";
import CitizenDashboard from "./components/CitizenDashboard";
import GovDashboard from "./components/GovDashboard";
import CitizenReportFlow from "./components/CitizenReportFlow";
import AestheticBackground from "./components/AestheticBackground";
import LocationSelectorModal from "./components/LocationSelectorModal";
import RoleSelectorModal from "./components/RoleSelectorModal";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import PulseAICopilot from "./components/PulseAICopilot";
import { CivicIssue, UserProfile } from "./types";
import { Loader2, Sparkles, VolumeX, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playClickSound, startAmbientDrone, stopAmbientDrone, isAmbientRunning } from "./utils/audio";

// Helper to generate beautifully localized, custom issues anywhere in the world
function generateLocalizedIssues(coords: { latitude: number; longitude: number }, address: string): CivicIssue[] {
  const cityName = address.split(",")[0] || "Your Location";
  return [
    {
      id: "loc-001",
      title: `Hazardous Pothole near Central ${cityName}`,
      description: `A deep, high-impact pothole has formed in the active commuting lane of ${cityName}. Swerving vehicles present an immediate collision risk. Needs dynamic asphalt sealing.`,
      category: "pothole",
      severity: "high",
      status: "investigating",
      location: {
        latitude: coords.latitude + 0.012,
        longitude: coords.longitude - 0.015,
        address: `Arterial Road, ${cityName}`,
      },
      reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      reportedBy: "Anushka Gupta",
      imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
      upvotes: 18,
      aiSummary: `High-priority road surface fracture near center transit line. Automated dispatch has scheduled active repair response.`,
      department: "Public Works (Roads)",
      workloadTimeDays: 2,
      duplicateOf: null,
      comments: [
        {
          id: "lc-1",
          author: "City Council Dispatcher",
          content: "Assessor dispatched. Asphalt crew scheduled to patch tomorrow.",
          createdAt: new Date().toISOString(),
          isOfficial: true,
        }
      ],
      supportedByUser: false,
    },
    {
      id: "loc-002",
      title: `Flickering Lights near Pedestrian Crossing`,
      description: `Multiple high-intensity luminaires are blinking or completely dark. Highly dark visibility index near a school zone.`,
      category: "streetlight",
      severity: "medium",
      status: "scheduled",
      location: {
        latitude: coords.latitude - 0.018,
        longitude: coords.longitude + 0.010,
        address: `Park Crossing, ${cityName}`,
      },
      reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reportedBy: "Raghu Mishra",
      imageUrl: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800",
      upvotes: 9,
      aiSummary: `Luminaire node failures detected. Workload queued for electrical grid utilities.`,
      department: "Electrical Utilities",
      workloadTimeDays: 4,
      duplicateOf: null,
      comments: [],
      supportedByUser: false,
    },
    {
      id: "loc-003",
      title: `Sidewalk Water Line Fracture`,
      description: `Underground municipal water is bubbling up through sidewalk concrete cracks. Steady continuous runoff toward local storm water drains.`,
      category: "water_leak",
      severity: "high",
      status: "in_progress",
      location: {
        latitude: coords.latitude + 0.005,
        longitude: coords.longitude + 0.015,
        address: `Transit Plaza, ${cityName}`,
      },
      reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      reportedBy: "Krishna Kumar",
      imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=800",
      upvotes: 24,
      aiSummary: `Main water pipe fracture. Crew has isolated high pressure flows and is repairing core system assets.`,
      department: "Water & Power",
      workloadTimeDays: 1,
      duplicateOf: null,
      comments: [],
      supportedByUser: false,
    }
  ];
}

export default function App() {
  const [view, setView] = useState<"landing" | "citizen" | "gov">("landing");
  const [rawIssues, setRawIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Swiss Minimalist Stark Theme State Management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (err) {
      console.error("Failed to synchronize theme mode class to document body", err);
    }
  }, [isDarkMode]);

  // Initial status filter for citizen hub
  const [initialCitizenStatusFilter, setInitialCitizenStatusFilter] = useState<"all" | "working_or_resolved" | "working" | "resolved">("all");

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // User Role and Authorization parameters
  const [userRole, setUserRole] = useState<"citizen" | "officer" | null>(() => {
    try {
      return (localStorage.getItem("userRole") as "citizen" | "officer") || null;
    } catch {
      return null;
    }
  });

  const [govId, setGovId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("govId") || null;
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      if (saved) return JSON.parse(saved);
      
      const savedRole = localStorage.getItem("userRole") as "citizen" | "officer";
      if (savedRole) {
        return {
          email: savedRole === "officer" ? "officer@civicpulse.gov" : "citizen@civicpulse.gov",
          name: savedRole === "officer" ? `Officer ${localStorage.getItem("govId") || "Delta-49"}` : "Soumya Dandapat",
          role: savedRole,
          govId: savedRole === "officer" ? (localStorage.getItem("govId") || "SF-PD-49") : undefined,
          karmaPoints: savedRole === "officer" ? 450 : 120,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${savedRole === "officer" ? "Delta" : "Soumya"}&backgroundColor=0f172a`,
          reportedCount: savedRole === "officer" ? 28 : 3,
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [showRoleModal, setShowRoleModal] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("userRole");
    } catch {
      return true;
    }
  });

  const handleRoleSelected = (role: "citizen" | "officer", id: string | null) => {
    try {
      localStorage.setItem("userRole", role);
      setUserRole(role);
      
      const defaultUser: UserProfile = {
        email: role === "officer" ? "officer@civicpulse.gov" : "citizen@civicpulse.gov",
        name: role === "officer" ? `Officer ${id || "Delta-49"}` : "Soumya Dandapat",
        role,
        govId: role === "officer" ? (id || "SF-PD-49") : undefined,
        karmaPoints: role === "officer" ? 450 : 120,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role === "officer" ? "Delta" : "Soumya"}&backgroundColor=0f172a`,
        reportedCount: role === "officer" ? 28 : 3,
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("currentUser", JSON.stringify(defaultUser));
      setCurrentUser(defaultUser);

      if (id) {
        localStorage.setItem("govId", id);
        setGovId(id);
        handleShowToast(`Welcome back, Officer. Access Granted for ID ${id}`, "success");
      } else {
        localStorage.removeItem("govId");
        setGovId(null);
        handleShowToast("Switched to Citizen Mode. Access authorized.", "success");
      }
    } catch (err) {
      console.error("Local storage sync failed", err);
    }
    setShowRoleModal(false);
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    setUserRole(profile.role);
    setGovId(profile.govId || null);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("govId");
    setCurrentUser(null);
    setUserRole(null);
    setGovId(null);
    handleShowToast("Logged out of session. Switched to secure Guest Mode.", "info");
    setView("landing");
  };

  // Redirect if a user loses or switches roles while in restricted consoles
  useEffect(() => {
    if (view === "gov" && userRole !== "officer") {
      setView("landing");
    }
  }, [view, userRole]);

  // Elegant global Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const handleShowToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  // Automatically clear toast after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Dynamic persistent notification center
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("pulse_notifications");
      return saved ? JSON.parse(saved) : [
        { id: 1, text: "Your report 'Graffiti Spray Paint on Historic Fountain' was processed by Gemini AI and dispatched.", read: false, time: "10m ago" },
        { id: 2, text: "Road Maintenance updated status of 'Severe Pavement Crack' to Investigating.", read: true, time: "1h ago" },
        { id: 3, text: "Public Works dispatcher left an official update on your nearby pothole report.", read: true, time: "2h ago" },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pulse_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (text: string) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        text,
        read: false,
        time: "Just now"
      },
      ...prev
    ]);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Global Location parameters
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(() => {
    try {
      const saved = localStorage.getItem("userCoords");
      return saved ? JSON.parse(saved) : { latitude: 28.6139, longitude: 77.2090 };
    } catch {
      return { latitude: 28.6139, longitude: 77.2090 };
    }
  });

  const [userAddress, setUserAddress] = useState<string | null>(() => {
    return localStorage.getItem("userAddress") || "New Delhi, India";
  });

  const [showLocationModal, setShowLocationModal] = useState<boolean>(() => {
    return false;
  });

  // Synchronize issues from server-side database
  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues");
      const data = await response.json();
      setRawIssues(data);
    } catch (err) {
      console.error("Failed to load active civic ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Dynamically augment issues list if user is outside San Francisco to make the experience 100% realistic!
  const issues = useMemo(() => {
    if (!userCoords || !userAddress) return rawIssues;
    
    // Check coordinate distance from San Francisco center
    const distance = Math.sqrt(
      Math.pow(userCoords.latitude - 37.7749, 2) +
      Math.pow(userCoords.longitude - (-122.4194), 2)
    );
    
    // If user's selected location is far from SF, prepend localized world-city mock cases!
    if (distance > 0.4) {
      const local = generateLocalizedIssues(userCoords, userAddress);
      return [...local, ...rawIssues];
    }
    
    return rawIssues;
  }, [rawIssues, userCoords, userAddress]);

  // Handle selectedIssue updates if synced issues list refreshes
  useEffect(() => {
    if (selectedIssue) {
      const fresh = issues.find((i) => i.id === selectedIssue.id);
      if (fresh) setSelectedIssue(fresh);
    }
  }, [issues]);

  // Location selector confirmation handler
  const handleLocationConfigured = (coords: { latitude: number; longitude: number }, address: string) => {
    localStorage.setItem("userCoords", JSON.stringify(coords));
    localStorage.setItem("userAddress", address);
    setUserCoords(coords);
    setUserAddress(address);
    setShowLocationModal(false);
  };

  // Upvote/Support Action proxy
  const handleUpvote = async (id: string) => {
    playClickSound();
    try {
      const response = await fetch(`/api/issues/${id}/upvote`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setRawIssues((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, upvotes: data.upvotes, supportedByUser: data.supportedByUser } : i
          )
        );
        const issue = issues.find((i) => i.id === id);
        const title = issue ? issue.title : "Your report";
        addNotification(`Your report '${title}' received a community upvote!`);
      }
    } catch (err) {
      console.error("Upvote synchronization failed", err);
    }
  };

  // Comment Posting proxy
  const handleAddComment = async (id: string, author: string, content: string, isOfficial: boolean = false) => {
    playClickSound();
    try {
      const response = await fetch(`/api/issues/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content, isOfficial }),
      });
      const data = await response.json();
      if (data.success) {
        // Refresh server data
        fetchIssues();
        const issue = issues.find((i) => i.id === id);
        const title = issue ? issue.title : "Your report";
        addNotification(`New comment posted on '${title}' by ${author}`);
      }
    } catch (err) {
      console.error("Comment delivery failed", err);
    }
  };

  // Status/Route updating (Government workspace)
  const handleUpdateIssueStatus = async (id: string, updates: Partial<CivicIssue>) => {
    playClickSound();
    try {
      const response = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        fetchIssues();
        const issue = issues.find((i) => i.id === id);
        const title = issue ? issue.title : "Your report";
        if (updates.status === "resolved") {
          addNotification(`🎉 Solved! Your reported issue '${title}' has been successfully resolved by the department!`);
        } else if (updates.status) {
          const statusLabels: Record<string, string> = {
            investigating: "Investigating",
            scheduled: "Scheduled",
            in_progress: "In Progress"
          };
          addNotification(`Status of '${title}' was updated to ${statusLabels[updates.status] || updates.status}.`);
        }
      }
    } catch (err) {
      console.error("Workflow status update failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-slate-300 gap-3" id="app-loading-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-xs font-mono tracking-wider text-slate-400 animate-pulse">Initializing CivicPulse Smart Core...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-neutral-900 flex flex-col overflow-x-hidden">
      {/* Animated Aesthetic Background canvas across entire site */}
      <AestheticBackground />

      {/* Persistent Left Sidebar Navigation & Controls Dashboard */}
      <Sidebar
        currentView={view}
        onNavigate={(v) => {
          if (v === "gov" && (!currentUser || currentUser.role !== "officer")) {
            handleShowToast("Authentication Required: Sign in as Municipal Officer to access console.", "error");
            setShowAuthModal(true);
          } else {
            setView(v);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => {
          playClickSound();
          setShowAuthModal(true);
        }}
        onStartReporting={() => {
          playClickSound();
          setShowReportModal(true);
        }}
        issues={issues}
        userAddress={userAddress}
        onResetLocation={() => {
          playClickSound();
          setShowLocationModal(true);
        }}
      />

      {/* Main Screen Content Area */}
      <main className="flex-1 min-w-0 pt-0 relative">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              <LandingPage
                onStartReporting={() => {
                  playClickSound();
                  setShowReportModal(true);
                }}
                onEnterCitizenHub={() => {
                  playClickSound();
                  setInitialCitizenStatusFilter("all");
                  setView("citizen");
                }}
                onEnterCitizenHubWithStatusFilter={(statusFilter) => {
                  setInitialCitizenStatusFilter(statusFilter);
                  setView("citizen");
                }}
                onEnterGovHub={() => {
                  playClickSound();
                  if (!currentUser || currentUser.role !== "officer") {
                    handleShowToast("Access Denied: Officer credentials required.", "error");
                    setShowAuthModal(true);
                  } else {
                    setView("gov");
                  }
                }}
                activeReportsCount={issues.filter((i) => i.status !== "resolved").length}
                userAddress={userAddress}
                onResetLocation={() => {
                  playClickSound();
                  setShowLocationModal(true);
                }}
                issues={issues}
                userCoords={userCoords}
                onUpdateCoords={(coords, address) => {
                  localStorage.setItem("userCoords", JSON.stringify(coords));
                  localStorage.setItem("userAddress", address);
                  setUserCoords(coords);
                  setUserAddress(address);
                }}
                onSelectIssue={setSelectedIssue}
                selectedIssue={selectedIssue}
                onUpvote={handleUpvote}
                onEnterCitizenHubWithSelected={(issue) => {
                  playClickSound();
                  setInitialCitizenStatusFilter("all");
                  setSelectedIssue(issue);
                  setView("citizen");
                }}
                onShowToast={handleShowToast}
                userRole={currentUser?.role}
              />
            </motion.div>
          )}

          {view === "citizen" && (
            <motion.div
              key="citizen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              <CitizenDashboard
                issues={issues}
                onBack={() => {
                  playClickSound();
                  setView("landing");
                }}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
                onUpvote={handleUpvote}
                onAddComment={(id, author, content) => {
                  const authorName = currentUser?.name || author || "Anonymous Citizen";
                  handleAddComment(id, authorName, content, currentUser?.role === "officer");
                }}
                userCoords={userCoords}
                onShowToast={handleShowToast}
                initialStatusFilter={initialCitizenStatusFilter}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                notifications={notifications}
                onMarkNotificationsRead={handleMarkNotificationsRead}
              />
            </motion.div>
          )}

          {view === "gov" && (
            <motion.div
              key="gov"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              <GovDashboard
                issues={issues}
                onBack={() => {
                  playClickSound();
                  setView("landing");
                }}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                onPostOfficialComment={(id, content) => {
                  const dispatcherName = currentUser ? `${currentUser.name} (Ops)` : "Operations Dispatch";
                  handleAddComment(id, dispatcherName, content, true);
                }}
                onShowToast={handleShowToast}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Onboarding Identity Role Selector Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <RoleSelectorModal
            onRoleSelected={handleRoleSelected}
            initialRole={userRole}
            onClose={() => setShowRoleModal(false)}
            canClose={!!userRole}
          />
        )}
      </AnimatePresence>

      {/* Onboarding World Location Selector Prompt */}
      <AnimatePresence>
        {showLocationModal && (
          <LocationSelectorModal
            onLocationSelected={handleLocationConfigured}
          />
        )}
      </AnimatePresence>

      {/* Interactive Cryptographic Sign In / Sign Up Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            onShowToast={handleShowToast}
          />
        )}
      </AnimatePresence>

      {/* Floating Global Reporting Button when inside dashboard portals */}
      {view !== "landing" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playClickSound();
            setShowReportModal(true);
          }}
          className="fixed bottom-6 right-6 px-4.5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center gap-2 z-30 group"
          id="global-floating-report"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs">Report Incident</span>
        </motion.button>
      )}

      {/* Camera-First Multi-Step Reporting Modal overlay */}
      <AnimatePresence>
        {showReportModal && (
          <CitizenReportFlow
            existingIssues={issues}
            userCoords={userCoords}
            userAddress={userAddress}
            userRole={userRole}
            govId={govId}
            onClose={() => {
              playClickSound();
              setShowReportModal(false);
            }}
            onSuccess={(newIssue) => {
              // Immediately update states & close
              setRawIssues((prev) => [newIssue, ...prev]);
              setSelectedIssue(newIssue);
              setShowReportModal(false);
              setView("citizen"); // Route straight to citizen hub to see the pinned ticket!
              addNotification(`Your report '${newIssue.title}' was successfully filed in the municipal ledger.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Global Custom Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-[200] max-w-sm glass-panel-heavy rounded-2xl p-4 shadow-2xl border flex items-center gap-3"
            style={{
              borderColor: toast.type === "success" ? "rgba(16, 185, 129, 0.3)" : toast.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)",
            }}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
              "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <p className="text-xs font-semibold text-slate-200">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Global Pulse AI Copilot */}
      <PulseAICopilot />
    </div>
  );
}
