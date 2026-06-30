/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'pothole' | 'graffiti' | 'streetlight' | 'trash' | 'water_leak' | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'investigating' | 'scheduled' | 'in_progress' | 'resolved';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isOfficial: boolean;
}

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: Location;
  reportedAt: string;
  reportedBy: string;
  imageUrl: string | null;
  upvotes: number;
  aiSummary: string;
  department: string;
  workloadTimeDays: number;
  duplicateOf: string | null;
  comments: Comment[];
  supportedByUser?: boolean;
}

export interface DepartmentLoad {
  name: string;
  activeIssues: number;
  capacity: number;
  loadFactor: number;
}

export interface PredictiveMaintenanceAlert {
  id: string;
  title: string;
  infrastructureId: string;
  type: string;
  location: Location;
  probability: number;
  recommendedAction: string;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface DepartmentWorkload {
  department: string;
  assignedCount: number;
  avgCompletionDays: number;
  workloadPercent: number;
}

export interface UserProfile {
  email: string;
  name: string;
  role: 'citizen' | 'officer';
  govId?: string;
  karmaPoints: number;
  avatarUrl?: string;
  reportedCount: number;
  joinedAt: string;
}

