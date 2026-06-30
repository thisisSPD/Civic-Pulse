/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { CivicIssue, Comment, DepartmentWorkload, PredictiveMaintenanceAlert } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Support base64 image payloads in reports
app.use(express.json({ limit: "15mb" }));

// Lazy initialize Gemini AI client to prevent startup crashes if API key is missing
let aiClient: any = null;
function getGemini(): any {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Memory database with rich realistic seed data for instant, immersive preview
let issues: CivicIssue[] = [
  {
    id: "civic-001",
    title: "Deep Pothole in Middle of Active Lane",
    description: "Extremely deep and hazardous pothole on the center lane of 14th St, right before the intersection. Multiple cars had to swerve suddenly to avoid it, which could cause a serious accident during rush hour. It is roughly 2 feet wide and 6 inches deep.",
    category: "pothole",
    severity: "high",
    status: "investigating",
    location: {
      latitude: 37.7858,
      longitude: -122.4008,
      address: "850 14th St, San Francisco, CA 94103",
    },
    reportedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(), // 2.5 days ago
    reportedBy: "Raghu Mishra",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    upvotes: 34,
    aiSummary: "Hazardous 2ft wide pothole located in the center lane of high-traffic transit route on 14th St. High risk of tire blowouts and swerving collisions. Assigned to Road Maintenance with critical priority.",
    department: "Public Works (Roads)",
    workloadTimeDays: 3,
    duplicateOf: null,
    comments: [
      {
        id: "c-1",
        author: "Anushka Gupta",
        content: "I hit this yesterday evening and thought my suspension was ruined. Highly dangerous!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficial: false,
      },
      {
        id: "c-2",
        author: "Public Works Dispatch",
        content: "We have dispatched a field assessor to measure the pothole and schedule emergency asphalt sealing.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficial: true,
      },
    ],
    supportedByUser: false,
  },
  {
    id: "civic-002",
    title: "Flickering and Dead Streetlights",
    description: "Three consecutive streetlights are completely out or flickering violently on Elm Street. The entire block is pitch black at night. This area is close to a primary school and feels very unsafe walking back after sunset.",
    category: "streetlight",
    severity: "medium",
    status: "scheduled",
    location: {
      latitude: 37.7915,
      longitude: -122.4152,
      address: "1240 Elm St, San Francisco, CA 94109",
    },
    reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    reportedBy: "Anushka Gupta",
    imageUrl: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800",
    upvotes: 19,
    aiSummary: "Three sequential luminaire failures on Elm St. Visual darkness index is high, creating pedestrian vulnerability near a school zone. Standard bulb and ballast replacement scheduled.",
    department: "Electrical Utilities",
    workloadTimeDays: 5,
    duplicateOf: null,
    comments: [
      {
        id: "c-3",
        author: "Devendra Kumar",
        content: "Agreed, it is completely dark here. Hope this gets fixed before the winter hours.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficial: false,
      },
    ],
    supportedByUser: false,
  },
  {
    id: "civic-003",
    title: "Industrial Construction Trash Dumping",
    description: "Several bags of concrete, broken drywall, and toxic solvents were dumped right next to the park walkway overnight. Chemical smell is coming from the heap, and it's leaking onto the grass where dogs play.",
    category: "trash",
    severity: "high",
    status: "in_progress",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: "Mission Dolores Park (North Border), San Francisco, CA",
    },
    reportedAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(), // 1.2 days ago
    reportedBy: "Anonymous",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    upvotes: 45,
    aiSummary: "Illegal industrial hazardous waste dumping at park boundary. Chemical runoffs pose active threat to community dogs and local ecology. Emergency hazardous dispatch is currently active for physical site sanitization.",
    department: "Environmental Services",
    workloadTimeDays: 1,
    duplicateOf: null,
    comments: [
      {
        id: "c-4",
        author: "Park Ranger Garcia",
        content: "Sanitation response vehicle is en-route. We are searching nearby building cameras for the dumping truck license plate.",
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        isOfficial: true,
      },
    ],
    supportedByUser: false,
  },
  {
    id: "civic-004",
    title: "Severe Underground Water Main Break",
    description: "Water is continuously gushing up through the sidewalk cracks on Grand Ave. It is creating a massive river running down the street and has flooded two local storefront basements.",
    category: "water_leak",
    severity: "critical",
    status: "resolved",
    location: {
      latitude: 37.7801,
      longitude: -122.4121,
      address: "412 Grand Ave, San Francisco, CA 94102",
    },
    reportedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Krishna Kumar",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
    upvotes: 82,
    aiSummary: "Sub-surface water main rupture causing extreme street-level flooding and retail asset inundation. GPM output exceeded safe local thresholds. Emergency isolation valve closed and main successfully replaced.",
    department: "Water & Power",
    workloadTimeDays: 1,
    duplicateOf: null,
    comments: [
      {
        id: "c-5",
        author: "Bakehouse Manager",
        content: "Thank you for the quick water cutoff response. It saved our dry ingredient stores from total loss!",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficial: false,
      },
    ],
    supportedByUser: false,
  },
  {
    id: "civic-005",
    title: "Graffiti Spray Paint on Historic Fountain",
    description: "Large offensive spray-painted graffiti tagging is covering the historic stone fountain in the square. This is a highly visited spot.",
    category: "graffiti",
    severity: "low",
    status: "reported",
    location: {
      latitude: 37.7951,
      longitude: -122.4028,
      address: "Portsmouth Square, San Francisco, CA 94108",
    },
    reportedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    reportedBy: "Preeti Sharma",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
    upvotes: 4,
    aiSummary: "Vandalism tagging on heritage stonework. Requires gentle chemical power-wash wash to preserve porous historic facade.",
    department: "Graffiti Abatement",
    workloadTimeDays: 2,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-006",
    title: "Severe Waterlogging after Monsoon Showers",
    description: "Massive water accumulation near Connaught Place Outer Circle. The drainage block has caused water levels to rise up to 1.5 feet, stalling multiple auto-rickshaws and causing heavy traffic congestion. Needs urgent pump deployment.",
    category: "water_leak",
    severity: "high",
    status: "reported",
    location: {
      latitude: 28.6304,
      longitude: 77.2177,
      address: "Outer Circle, Connaught Place, New Delhi, Delhi 110001",
    },
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hrs ago
    reportedBy: "Sunil Sharma",
    imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800",
    upvotes: 42,
    aiSummary: "Extreme drainage failure near Connaught Place. Heavy flooding affecting commercial movement. Recommended immediate vacuum-pump truck deployment to clear stormwater channels.",
    department: "Environmental Services",
    workloadTimeDays: 1,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-007",
    title: "Broken Streetlight on Karol Bagh Market Road",
    description: "The main streetlight near Karol Bagh metro station pillar 112 has been completely non-functional for the past week. This makes the busy shopping corridor pitch black after 8 PM, raising safety concerns for women shoppers.",
    category: "streetlight",
    severity: "medium",
    status: "scheduled",
    location: {
      latitude: 28.6441,
      longitude: 77.1895,
      address: "Pusa Road, Karol Bagh, New Delhi, Delhi 110005",
    },
    reportedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Priya Patel",
    imageUrl: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800",
    upvotes: 15,
    aiSummary: "Luminaire bulb failure identified at high-occupancy commercial transit zone in Karol Bagh. Electrical dispatch assigned for bulb replacement.",
    department: "Electrical Utilities",
    workloadTimeDays: 3,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-008",
    title: "Overflowing Garbage Dump near India Gate Park",
    description: "The community dustbins are completely overflowing onto the pavement at Rajpath crossing. Stray animals are scattering plastic waste everywhere, creating a terrible smell and public health hazard near the tourist walking track.",
    category: "trash",
    severity: "medium",
    status: "in_progress",
    location: {
      latitude: 28.6129,
      longitude: 77.2295,
      address: "Rajpath Area, Central Secretariat, New Delhi, Delhi 110001",
    },
    reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Rajesh Kumar",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    upvotes: 28,
    aiSummary: "Solid waste accumulation at central public parkway. Refuse truck dispatched for full structural bin clearance and sidewalk sanitization.",
    department: "Environmental Services",
    workloadTimeDays: 1,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-009",
    title: "Dangerous Potholes on Ring Road Flyover",
    description: "Three consecutive deep potholes have formed on the high-speed descent of the AIIMS flyover. Two-wheelers are swerving extremely dangerously at high speeds to avoid these. Needs urgent cold-mix asphalt filling.",
    category: "pothole",
    severity: "high",
    status: "investigating",
    location: {
      latitude: 28.5684,
      longitude: 77.2061,
      address: "Ring Road, Kidwai Nagar, New Delhi, Delhi 110029",
    },
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Amit Singh",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    upvotes: 64,
    aiSummary: "High-velocity flyover surface fracture. Multi-pothole zone poses extreme danger to light motorized vehicles. Emergency crew dispatched.",
    department: "Public Works (Roads)",
    workloadTimeDays: 2,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-010",
    title: "Defaced Heritage Wall near Red Fort",
    description: "Someone has spray-painted commercial advertisements and ugly graffiti all over the heritage outer boundary wall near the red sandstone fort. This is a protected monument zone.",
    category: "graffiti",
    severity: "low",
    status: "reported",
    location: {
      latitude: 28.6562,
      longitude: 77.2410,
      address: "Netaji Subhash Marg, Chandni Chowk, New Delhi, Delhi 110006",
    },
    reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Deepa Nair",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
    upvotes: 18,
    aiSummary: "Illegal commercial stencil graffiti on monument buffer wall. Cleanup scheduled utilizing low-pressure water mist and ecological solvents to avoid stone deterioration.",
    department: "Graffiti Abatement",
    workloadTimeDays: 3,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-011",
    title: "Drinking Water Pipeline Leakage in Saket",
    description: "A major drinking water distribution pipe has burst near the Saket Community Center entrance. Thousands of liters of clean water are flooding the local lanes and lowering water pressure in the residential colony block.",
    category: "water_leak",
    severity: "high",
    status: "in_progress",
    location: {
      latitude: 28.5224,
      longitude: 77.2114,
      address: "Saket District Centre, Sector 6, New Delhi, Delhi 110017",
    },
    reportedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Vikram Joshi",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
    upvotes: 39,
    aiSummary: "Drinking water distribution line failure. Local water utility is executing main line isolation to prevent clean supply drain.",
    department: "Water & Power",
    workloadTimeDays: 1,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-012",
    title: "Uncollected E-Waste and Plastic Heap in Nehru Place",
    description: "An enormous heap of computer parts, monitors, and discarded wiring has been dumped behind the commercial complexes in Nehru Place. This is highly toxic and dangerous in case of a short circuit or fire.",
    category: "trash",
    severity: "high",
    status: "reported",
    location: {
      latitude: 28.5494,
      longitude: 77.2519,
      address: "Nehru Place Market Road, New Delhi, Delhi 110019",
    },
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Rohan Sen",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    upvotes: 31,
    aiSummary: "Hazardous electronic scrap pile in busy business district. Specialized toxic disposal unit assigned to clear plastic housings and metallic components safely.",
    department: "Environmental Services",
    workloadTimeDays: 2,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
  {
    id: "civic-013",
    title: "Dangerous Pavement Cave-in near Hauz Khas",
    description: "A huge section of the pedestrian sidewalk has caved in near the Hauz Khas Metro station gate 3. It looks like a sinkhole is forming underneath. Highly dangerous for blind pedestrians and night walkers.",
    category: "pothole",
    severity: "critical",
    status: "investigating",
    location: {
      latitude: 28.5432,
      longitude: 77.2064,
      address: "Hauz Khas Market Road, New Delhi, Delhi 110016",
    },
    reportedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    reportedBy: "Meera Bai",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    upvotes: 11,
    aiSummary: "Sidewalk structural collapse/sinkhole near high-density metro boarding. Emergency safety barricades ordered and ground survey dispatch triggered.",
    department: "Public Works (Roads)",
    workloadTimeDays: 2,
    duplicateOf: null,
    comments: [],
    supportedByUser: false,
  },
];

// Predictive maintenance alerts simulation
let predictiveAlerts: PredictiveMaintenanceAlert[] = [
  {
    id: "pred-101",
    title: "Corrosion Anomaly: Golden Gate Water Pipeline",
    infrastructureId: "pipe-gg-40",
    type: "Corrosion Hazard",
    location: {
      latitude: 37.8080,
      longitude: -122.4480,
      address: "Marina Blvd, San Francisco, CA",
    },
    probability: 0.88,
    recommendedAction: "Perform cathodic protection check and pipe thickness scanning within 15 days.",
    estimatedCost: 12000,
    urgency: "high",
  },
  {
    id: "pred-102",
    title: "Structural Fatigue Alert: Oak Street Overpass",
    infrastructureId: "bridge-oak-12",
    type: "Concrete Shear Crack Expansion",
    location: {
      latitude: 37.7711,
      longitude: -122.4300,
      address: "Oak St & Octavia Blvd, San Francisco, CA",
    },
    probability: 0.76,
    recommendedAction: "Schedule concrete injection sealing and set up micro-strain sensors.",
    estimatedCost: 35000,
    urgency: "medium",
  },
  {
    id: "pred-103",
    title: "Thermal Stress Warning: substation-sf-south",
    infrastructureId: "sub-sf-9",
    type: "Transformer Overheating",
    location: {
      latitude: 37.7450,
      longitude: -122.4100,
      address: "Cesar Chavez St Substation, San Francisco, CA",
    },
    probability: 0.94,
    recommendedAction: "Deploy coolant flush and replace dynamic thermal relays immediately.",
    estimatedCost: 8500,
    urgency: "high",
  },
];

// Department configuration and metrics
const getDepartmentStats = (): DepartmentWorkload[] => {
  const departments = [
    "Public Works (Roads)",
    "Electrical Utilities",
    "Environmental Services",
    "Water & Power",
    "Graffiti Abatement",
  ];

  return departments.map((dept) => {
    const assigned = issues.filter((i) => i.department === dept && i.status !== "resolved");
    const resolved = issues.filter((i) => i.department === dept && i.status === "resolved");
    const avgDays = dept === "Water & Power" ? 1 : dept === "Environmental Services" ? 1.5 : 3.5;

    // Simulate standard workload
    let workloadPercent = Math.min(Math.round((assigned.length / 5) * 100), 100);
    if (workloadPercent === 0) workloadPercent = 12 + Math.floor(Math.random() * 20);

    return {
      department: dept,
      assignedCount: assigned.length,
      avgCompletionDays: avgDays,
      workloadPercent,
    };
  });
};

// API ENDPOINTS

// 1. Get all issues
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

// 2. Submit a new issue (AI-Assisted Processing)
app.post("/api/issues", async (req, res) => {
  const { title, description, category, latitude, longitude, address, reportedBy, imageBase64 } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  const issueId = `civic-${Date.now().toString().slice(-6)}`;
  const lat = latitude || 37.7749 + (Math.random() - 0.5) * 0.05;
  const lon = longitude || -122.4194 + (Math.random() - 0.5) * 0.05;
  const addr = address || "Generated Landmark, San Francisco, CA";

  let detectedCategory = category || "other";
  let detectedSeverity = "medium";
  let aiSummary = "Processing ticket...";
  let assignedDepartment = "Public Works (Roads)";
  let predictedDays = 4;
  let duplicateId: string | null = null;

  const gemini = getGemini();

  if (gemini) {
    try {
      // Build prompt for Gemini to do holistic categorization, severity, duplicate analysis, and department routing.
      const prompt = `
        You are an advanced AI Smart Civic Routing Agent for City Council.
        Analyze this new citizen civic report:
        - Title: "${title || "Not specified"}"
        - Description: "${description}"
        - Category provided: "${category || "Not specified"}"

        Here is a list of EXISTING reported issues in the system for comparison:
        ${JSON.stringify(issues.map(i => ({ id: i.id, title: i.title, description: i.description, status: i.status })))}

        Perform the following tasks:
        1. Classify the issue into one of these strict categories: "pothole", "graffiti", "streetlight", "trash", "water_leak", "other".
        2. Set the severity: "low", "medium", "high", "critical" (Critical is only for major flooding, active electrical hazards, or structural collapses).
        3. Determine if this new issue is a direct DUPLICATE of any open existing issues in the list (same issue reported by another user). If yes, identify the duplicate's ID.
        4. Synthesize an eloquent, human-readable AI executive summary (max 3 sentences).
        5. Assign it to the most relevant municipal department: "Public Works (Roads)", "Electrical Utilities", "Environmental Services", "Water & Power", "Graffiti Abatement".
        6. Predict repair duration in integer days (1 to 14 days).

        Return ONLY a raw JSON object with the following fields:
        {
          "title": "A highly descriptive, professional 5-10 word title summarizing the exact issue",
          "category": "pothole" | "graffiti" | "streetlight" | "trash" | "water_leak" | "other",
          "severity": "low" | "medium" | "high" | "critical",
          "duplicateOf": "id_of_duplicate" or null,
          "aiSummary": "Your synthesized executive summary",
          "department": "assigned_department",
          "workloadTimeDays": number
        }
      `;

      const contents: any[] = [];
      if (imageBase64) {
        // If an image is uploaded, we can leverage multimodal capability!
        const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
        const base64Data = imageBase64.split(",")[1] || imageBase64;
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }
      contents.push(prompt);

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: imageBase64 ? { parts: [{ inlineData: { data: imageBase64.split(",")[1] || imageBase64, mimeType: imageBase64.split(";")[0].split(":")[1] || "image/jpeg" } }, { text: prompt }] } : prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text.trim());
      detectedCategory = parsed.category || detectedCategory;
      detectedSeverity = parsed.severity || detectedSeverity;
      aiSummary = parsed.aiSummary || aiSummary;
      assignedDepartment = parsed.department || assignedDepartment;
      predictedDays = parsed.workloadTimeDays || predictedDays;
      duplicateId = parsed.duplicateOf || null;
    } catch (err) {
      console.error("Gemini analysis error, falling back to heuristics:", err);
      // Heuristic Fallback
      aiSummary = `Auto-processed report. Subject is ${detectedCategory}. Department dispatch triggered.`;
    }
  } else {
    // Local Heuristics Mock AI if no Gemini API Key is configured
    const descLower = description.toLowerCase();
    if (descLower.includes("pothole") || descLower.includes("road") || descLower.includes("asphalt")) {
      detectedCategory = "pothole";
      assignedDepartment = "Public Works (Roads)";
      detectedSeverity = descLower.includes("deep") || descLower.includes("accident") ? "high" : "medium";
      predictedDays = 3;
    } else if (descLower.includes("leak") || descLower.includes("water") || descLower.includes("flood")) {
      detectedCategory = "water_leak";
      assignedDepartment = "Water & Power";
      detectedSeverity = "critical";
      predictedDays = 1;
    } else if (descLower.includes("light") || descLower.includes("flicker") || descLower.includes("dark")) {
      detectedCategory = "streetlight";
      assignedDepartment = "Electrical Utilities";
      detectedSeverity = "medium";
      predictedDays = 5;
    } else if (descLower.includes("graffiti") || descLower.includes("paint") || descLower.includes("spray")) {
      detectedCategory = "graffiti";
      assignedDepartment = "Graffiti Abatement";
      detectedSeverity = "low";
      predictedDays = 2;
    } else if (descLower.includes("trash") || descLower.includes("dump") || descLower.includes("garbage")) {
      detectedCategory = "trash";
      assignedDepartment = "Environmental Services";
      detectedSeverity = "high";
      predictedDays = 1;
    }

    aiSummary = `[Rule-Based AI Engine]: Issue classified as '${detectedCategory}' with '${detectedSeverity}' severity. Automatically routed to municipal department '${assignedDepartment}'.`;
  }

  // Use a nice placeholder unsplash image if none was uploaded
  const defaultImages: Record<string, string> = {
    pothole: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    streetlight: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800",
    trash: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    water_leak: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=800",
    graffiti: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
    other: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
  };

  const finalTitle = title || `${detectedCategory.toUpperCase()} Report at ${addr.split(",")[0]}`;

  const newIssue: CivicIssue = {
    id: issueId,
    title: finalTitle,
    description,
    category: detectedCategory as any,
    severity: detectedSeverity as any,
    status: "reported",
    location: {
      latitude: lat,
      longitude: lon,
      address: addr,
    },
    reportedAt: new Date().toISOString(),
    reportedBy: reportedBy || "Anonymous",
    imageUrl: imageBase64 || defaultImages[detectedCategory] || defaultImages.other,
    upvotes: 1,
    aiSummary,
    department: assignedDepartment,
    workloadTimeDays: predictedDays,
    duplicateOf: duplicateId,
    comments: [],
    supportedByUser: true,
  };

  issues.unshift(newIssue);
  res.json({ success: true, issue: newIssue });
});

// 3. Upvote/Support an issue
app.post("/api/issues/:id/upvote", (req, res) => {
  const { id } = req.params;
  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.supportedByUser) {
    issue.upvotes = Math.max(0, issue.upvotes - 1);
    issue.supportedByUser = false;
  } else {
    issue.upvotes += 1;
    issue.supportedByUser = true;
  }

  res.json({ success: true, upvotes: issue.upvotes, supportedByUser: issue.supportedByUser });
});

// 4. Comment on an issue
app.post("/api/issues/:id/comment", (req, res) => {
  const { id } = req.params;
  const { author, content, isOfficial } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Comment content is required" });
  }

  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newComment: Comment = {
    id: `comm-${Date.now().toString().slice(-4)}`,
    author: author || "Anonymous Citizen",
    content,
    createdAt: new Date().toISOString(),
    isOfficial: !!isOfficial,
  };

  issue.comments.push(newComment);
  res.json({ success: true, comment: newComment });
});

// 5. Update issue metadata/status (Admin Workflow)
app.post("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, department, severity, duplicateOf } = req.body;

  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (status) issue.status = status;
  if (department) issue.department = department;
  if (severity) issue.severity = severity;
  if (duplicateOf !== undefined) issue.duplicateOf = duplicateOf;

  // Add official log comment
  issue.comments.push({
    id: `log-${Date.now().toString().slice(-4)}`,
    author: "Municipal Audit Trail",
    content: `Status updated to [${status || issue.status}] and routed to [${department || issue.department}]`,
    createdAt: new Date().toISOString(),
    isOfficial: true,
  });

  res.json({ success: true, issue });
});

// 6. Get department workloads
app.get("/api/departments", (req, res) => {
  res.json(getDepartmentStats());
});

// 7. Get predictive maintenance alerts
app.get("/api/predictive-alerts", (req, res) => {
  res.json(predictiveAlerts);
});

// 8. Gemini AI Chatbot / Solver Advisor
app.post("/api/ai/suggest-solution", async (req, res) => {
  const { issueId } = req.body;
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const gemini = getGemini();
  if (gemini) {
    try {
      const prompt = `
        You are the City Council Director of Operations.
        Analyze this active civic report and generate an optimal dispatch & remediation playbook:
        - Issue: "${issue.title}"
        - Description: "${issue.description}"
        - Location: "${issue.location.address}"
        - Severity: "${issue.severity}"
        - Department: "${issue.department}"

        Provide a structured playbook including:
        1. "immediateActions": High-urgency checklist for dispatched field workers.
        2. "remediationPlan": Full technical guide to repair or fix.
        3. "residentUpdate": A friendly, reassuring statement for the public dashboard.

        Return ONLY a JSON response structure matching:
        {
          "immediateActions": ["Action 1", "Action 2"],
          "remediationPlan": "Full detailed paragraph explaining technical process",
          "residentUpdate": "Reassuring message"
        }
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      res.json(JSON.parse(response.text.trim()));
    } catch (err) {
      console.error("Playbook generation error:", err);
      res.status(500).json({ error: "Failed to generate AI advice" });
    }
  } else {
    // Return standard fallback advice
    res.json({
      immediateActions: [
        "Dispatch emergency service crew within 24 hours.",
        "Set up orange safety pylons and high-visibility traffic markers.",
        "Check local water or electrical shutoff valves if nearby."
      ],
      remediationPlan: `Under standard protocol for ${issue.category}, a secondary crew will execute repairs utilizing standard asphalt patching, electrical ballast renewal, or high-pressure sewer clearance techniques depending on final site mapping.`,
      residentUpdate: `Thank you for your report! The ${issue.department} has logged this and scheduled field technicians to visit the site.`
    });
  }
});

// 8.5 India Official Boundary GeoJSON Service (Survey of India Compliant)
let indiaBoundaryCache: any = null;
app.get("/api/india-boundary", async (req, res) => {
  if (indiaBoundaryCache) {
    return res.json(indiaBoundaryCache);
  }

  try {
    const url = "https://raw.githubusercontent.com/Subhashis/India-Map-Geojson/master/India_States_UTs.geojson";
    const response = await fetch(url);
    if (response.ok) {
      indiaBoundaryCache = await response.json();
      return res.json(indiaBoundaryCache);
    } else {
      throw new Error(`Boundary URL returned status: ${response.status}`);
    }
  } catch (err) {
    console.error("Failed to fetch official India boundary GeoJSON", err);
    // In case of network failure, send a compliant, structured fallback GeoJSON with correct UT of Ladakh & J&K representation
    const fallbackGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Jammu & Kashmir (UT)" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [74.0, 32.5], [74.3, 34.5], [74.5, 35.5], [76.0, 36.0], [77.5, 35.5], [76.0, 34.0], [74.0, 32.5]
            ]]
          }
        },
        {
          type: "Feature",
          properties: { name: "Ladakh (UT)" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [76.0, 34.0], [77.5, 35.5], [80.0, 34.5], [79.0, 32.5], [76.0, 34.0]
            ]]
          }
        },
        {
          type: "Feature",
          properties: { name: "Arunachal Pradesh" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [91.5, 27.5], [94.0, 28.5], [96.0, 28.5], [97.3, 28.0], [97.0, 27.0], [91.5, 27.5]
            ]]
          }
        },
        {
          type: "Feature",
          properties: { name: "India Mainland" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [68.1, 23.8], [71.0, 24.5], [70.5, 27.0], [72.5, 29.5], [74.5, 31.0],
              [78.5, 31.5], [80.2, 30.2], [80.2, 29.0], [84.0, 27.5], [88.0, 26.5],
              [88.2, 27.0], [88.5, 28.0], [88.8, 27.0], [89.5, 26.8], [91.5, 26.8],
              [91.2, 23.0], [89.0, 22.0], [88.5, 21.5], [86.5, 20.5], [84.5, 19.0],
              [82.5, 17.0], [80.0, 15.5], [80.2, 13.5], [80.2, 12.5], [79.8, 10.5],
              [77.5, 8.1],
              [76.2, 9.5], [75.5, 11.5], [74.5, 13.0], [74.0, 15.0], [73.5, 16.0],
              [72.8, 19.0], [72.8, 20.5], [72.2, 21.0], [70.0, 20.8], [69.0, 22.5],
              [68.1, 23.8]
            ]]
          }
        }
      ]
    };
    return res.json(fallbackGeoJSON);
  }
});

// 9. Gemini AI Conversational Assistant (CivicPulse Copilot)
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const gemini = getGemini();
  if (gemini) {
    try {
      const lastMessage = messages[messages.length - 1]?.content;
      
      // Ensure the history sent to Gemini starts with a 'user' message to comply with Gemini's sequence contract
      let history = messages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
      
      const firstUserIndex = history.findIndex(h => h.role === "user");
      if (firstUserIndex !== -1) {
        history = history.slice(firstUserIndex);
      } else {
        history = [];
      }

      const systemInstruction = `You are "Pulse AI Copilot", a brilliant, deeply helpful, and sophisticated AI assistant for CivicPulse, a multi-million-dollar municipal intelligence platform.
You assist two primary users:
1. Citizens who want to understand community issues, safety practices, reporting guidelines, and how they can earn karma points.
2. City administrators/officers who manage public works, schedule emergency asphalt sealing, review water leaks, analyze budgets, and require dispatch advice.

Keep your answers structured, elegant, concise, and incredibly supportive. Use formatting (bullet points, bold text) beautifully. Answer questions with highly realistic municipal operational details. Avoid developer jargon unless requested. Always be welcoming and professional.`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ content: response.text });
    } catch (err) {
      console.error("AI Copilot conversation error:", err);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  } else {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let reply = "Hello! I am your CivicPulse AI Copilot. I am currently running on our local rule-based system. ";
    
    if (lastMessage.includes("pothole") || lastMessage.includes("road") || lastMessage.includes("asphalt")) {
      reply += "Potholes are processed with high urgency. When you report a pothole using our camera-first module, our system geotags the exact lane, detects duplicates, and assigns the work to the Public Works (Roads) team, scheduling asphalt sealing within 2 to 3 days.";
    } else if (lastMessage.includes("water") || lastMessage.includes("leak") || lastMessage.includes("flood")) {
      reply += "Water leaks or pipe breaks are treated as 'critical' priority. Our platform alerts the Water & Power division, isolates high-pressure valves automatically, and dispatches field assessors immediately. This helps cities save millions in daily structural water damages.";
    } else if (lastMessage.includes("price") || lastMessage.includes("pricing") || lastMessage.includes("cost") || lastMessage.includes("subscribe")) {
      reply += "CivicPulse offers three premium municipal licensing tiers: \n\n1. **Starter Grid** (Free): Core camera-first reporting and upvotes.\n2. **Metropolitan Pulse** (₹199/mo): Predictive maintenance alerts, department workloads, and automated Gemini dispatch.\n3. **Mega-City Neural Core** (₹499/mo): Live IoT sensor grid nodes, GIS custom zone digitization, and 24/7 priority support SLA.";
    } else if (lastMessage.includes("karma") || lastMessage.includes("points") || lastMessage.includes("reward")) {
      reply += "Citizens earn Karma Trust Points by submitting high-quality reports, validating other reported incidents (upvoting), and leaving constructive comments. Earning karma elevates your community profile status and displays your contributions in the local Hall of Fame.";
    } else {
      reply += "I am ready to help you coordinate city assets! You can ask me about our Pricing Tiers, how to earn Karma Points, or ask for dispatch playbooks for potholes, water leaks, streetlights, and trash dumping.";
    }
    
    res.json({ content: reply });
  }
});

// VITE AND STATIC ASSETS SERVING MIDDLEWARE

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CivicPulse Server] Running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Server startup error:", err);
});
