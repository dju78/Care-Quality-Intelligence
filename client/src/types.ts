export interface User {
  UserID: number;
  Username: string;
  DisplayName: string;
  Role: "Director" | "Registered Manager" | "Team Leader";
  Team: string | null;
}

export interface Period {
  start: string;
  end: string;
  months: number;
  monthKeys: string[];
}

export interface Meta {
  teams: string[];
  range: { min: string; max: string };
  ragBands: { red: number; amber: number };
  targets: { reportedWithin24hPct: number; avgFeedback: number; resolvedWithin28dPct: number };
  smallSample: { minFeedback: number; minVisits: number };
}

export interface OverviewData {
  period: Period;
  targets: Meta["targets"];
  kpis: {
    incidents: number;
    highSeverity: number;
    notifiable: number;
    reported24hPct: number | null;
    complaints: number;
    upheldPct: number | null;
    avgFeedback: number | null;
    feedbackCount: number;
    recommendPct: number | null;
    missedPct: number | null;
    latePct: number | null;
    completedVisits: number;
  };
  monthly: { month: string; incidents: number; high: number; complaints: number; avgScore: number | null; missedPct: number }[];
  byCategory: { Category: string; Low: number; Moderate: number; High: number; total: number }[];
  bySource: { Source: string; count: number }[];
  lowThemes: { Theme: string; count: number }[];
  carePackageMix: { name: string; clients: number; sessions: number }[];
}

export interface StaffMetrics {
  StaffID: string;
  StaffName: string;
  Role: string;
  Team: string;
  Status: string;
  visits: { total: number; completed: number; late: number; missed: number; latePct: number; missedPct: number };
  incidents: { count: number; per100: number | null; high: number; moderate: number; low: number; within24hPct: number | null; notifiable: number };
  complaints: { count: number; per100: number | null; upheld: number; pending: number };
  feedback: { count: number; avg: number | null; low: number; recommendPct: number | null };
  openActions: number;
  qri: number | null;
  qriBreakdown: { label: string; value: number; detail: string }[] | null;
  band: "Red" | "Amber" | "Green" | null;
  strongReporter: boolean;
  smallSample: { visits: boolean; feedback: boolean };
}

export interface TimelineEvent {
  type: "Incident" | "Complaint" | "Low feedback";
  id: string;
  date: string;
  ClientRef: string;
  Category?: string;
  Severity?: string;
  Status?: string;
  CQCNotifiable?: number;
  ReportedWithin24h?: number;
  Source?: string;
  Outcome?: string;
  DateResolved?: string | null;
  Method?: string;
  Score?: number;
  Theme?: string;
}

export interface ActionRow {
  ActionID: string;
  StaffID: string;
  CreatedDate: string;
  Source: string;
  Description: string;
  Owner: string;
  DueDate: string;
  Status: string;
}

export interface StaffProfile {
  staff: { StaffID: string; StaffName: string; Role: string; Team: string; StartDate: string; Status: string; ContractedHours: number };
  period: Period;
  metrics: StaffMetrics;
  feedbackTrend: { month: string; avgScore: number; count: number }[];
  visitsMonthly: { month: string; total: number; late: number; missed: number }[];
  events: TimelineEvent[];
  feedbackThemes: { Theme: string; count: number; avgScore: number; hasLow: number }[];
  actions: ActionRow[];
  carePackageContext: { name: string; clients: number; sessions: number }[];
  generatedBy?: string;
  generatedAt?: string;
}

export interface CqcData {
  period: Period;
  notifiable: {
    IncidentID: string; IncidentDate: string; Category: string; Severity: string;
    ReportedWithin24h: number; Status: string; DateClosed: string | null; StaffName: string; Team: string; ClientRef: string;
  }[];
  complaintHandling: {
    total: number; resolved: number; within28: number; within28Pct: number | null; avgDays: number | null;
    complaints: { ComplaintID: string; DateReceived: string; DateResolved: string | null; Source: string; Category: string; Outcome: string; Team: string; ClientRef: string; daysToResolve: number | null }[];
  };
  learning: {
    totalActions: number; completed: number; completedPct: number | null; overdue: number;
    actions: (ActionRow & { StaffName: string; Team: string })[];
  };
  kpis: OverviewData["kpis"];
}

export interface ImportValidation {
  ok: boolean;
  uploadId?: string;
  errors?: { row: number; column: string; value: string; message: string }[];
  errorCount?: number;
  rowCount: number;
  preview: Record<string, string | number | null>[];
  columns?: string[];
}

export interface AuditRow {
  AuditID: number;
  Timestamp: string;
  User: string;
  Action: string;
  RecordRef: string | null;
  Details: string;
}

export interface ConfigData {
  qriWeights: { incidentsPer100Visits: number; highSeverityIncident: number; upheldComplaint: number; lowFeedbackScore: number };
  ragBands: { red: number; amber: number };
  smallSample: { minFeedback: number; minVisits: number };
  targets: { reportedWithin24hPct: number; avgFeedback: number; resolvedWithin28dPct: number };
  strongReporter: { minIncidents: number; maxHighSeverity: number; maxModerateShare: number; minAvgFeedback: number };
}
