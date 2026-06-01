// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = "Active" | "Inactive" | "Suspended";
export type DeviceStatus = "Active" | "Revoked";
export type AuditSeverity = "info" | "warning" | "critical";
export type StressLevel = "low" | "moderate" | "high" | "critical";

export interface StressPoint {
  date: string;
  score: number;
}

export interface UserDevice {
  id: string;
  name: string;
  os: string;
  version: string;
  ip: string;
  lastSeen: string;
  status: DeviceStatus;
}

export interface AssignedRole {
  id: string;
  name: string;
  assignedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  primaryRole: string;
  department: string;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  initials: string;
  color: string;
  activeSessions: number;
  stressHistory: StressPoint[];
  devices: UserDevice[];
  assignedRoles: AssignedRole[];
  phone: string;
  location: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  createdAt: string;
  isSystem: boolean;
  permissions: string[];
}

export interface Contact {
  name: string;
  email: string;
  role: string;
  phone: string;
}

export interface Account {
  id: string;
  name: string;
  plan: "Starter" | "Professional" | "Enterprise";
  status: "Active" | "Trial" | "Suspended";
  userCount: number;
  createdAt: string;
  renewalDate: string;
  contacts: Contact[];
  industry: string;
  mrr: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  severity: AuditSeverity;
  ip: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface Device {
  id: string;
  hostname: string;
  userId: string;
  userName: string;
  department: string;
  os: string;
  agentVersion: string;
  ip: string;
  status: "Active" | "Idle" | "Revoked" | "Offline";
  lastSeen: string;
  enrolledAt: string;
  stressSignal: StressLevel;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(daysAgo: number): string {
  const dt = new Date("2026-05-25");
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().split("T")[0];
}

function dt(daysAgo: number, hours = 10, mins = 0): string {
  const dt2 = new Date("2026-05-25");
  dt2.setDate(dt2.getDate() - daysAgo);
  dt2.setHours(hours, mins);
  return dt2.toISOString().replace("T", " ").substring(0, 16);
}

// Deterministic stress curve: base score + linear trend + sinusoidal noise
function genStress(base: number, trend: number, amp = 10): StressPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const noise = Math.sin(i * 1.2) * amp + Math.cos(i * 2.4) * (amp / 2);
    const score = Math.round(Math.max(3, Math.min(97, base + (trend * i) / 29 + noise)));
    return { date: d(daysAgo), score };
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "u1", name: "Alice Johnson", email: "alice.j@subl.io", primaryRole: "Senior Engineer",
    department: "Engineering", status: "Active", lastLogin: dt(0, 9, 12), createdAt: d(380),
    initials: "AJ", color: "from-blue-500 to-blue-700", activeSessions: 2, phone: "+1 (415) 555-0101",
    location: "San Francisco, CA",
    stressHistory: genStress(45, -10),
    devices: [
      { id: "d-a1", name: "MacBook Pro 16", os: "macOS 15.1", version: "2.4.1", ip: "192.168.1.12", lastSeen: dt(0, 9, 10), status: "Active" },
      { id: "d-a2", name: "iPhone 16 Pro", os: "iOS 18.4", version: "2.3.0", ip: "10.0.0.44", lastSeen: dt(1, 8, 0), status: "Active" },
    ],
    assignedRoles: [
      { id: "r1", name: "Admin", assignedAt: d(200) },
      { id: "r3", name: "Analyst", assignedAt: d(100) },
    ],
  },
  {
    id: "u2", name: "Brian Nguyen", email: "b.nguyen@subl.io", primaryRole: "Account Executive",
    department: "Sales", status: "Active", lastLogin: dt(0, 8, 45), createdAt: d(290),
    initials: "BN", color: "from-purple-500 to-purple-700", activeSessions: 1, phone: "+1 (212) 555-0182",
    location: "New York, NY",
    stressHistory: genStress(25, 5),
    devices: [
      { id: "d-b1", name: "Dell XPS 15", os: "Windows 11", version: "2.4.1", ip: "192.168.2.30", lastSeen: dt(0, 8, 44), status: "Active" },
    ],
    assignedRoles: [{ id: "r4", name: "Manager", assignedAt: d(150) }],
  },
  {
    id: "u3", name: "Carmen Ruiz", email: "c.ruiz@subl.io", primaryRole: "Support Lead",
    department: "Customer Support", status: "Active", lastLogin: dt(0, 7, 30), createdAt: d(420),
    initials: "CR", color: "from-emerald-500 to-teal-600", activeSessions: 3, phone: "+1 (305) 555-0234",
    location: "Miami, FL",
    stressHistory: genStress(72, 8),
    devices: [
      { id: "d-c1", name: "ThinkPad X1", os: "Windows 11", version: "2.4.0", ip: "192.168.3.15", lastSeen: dt(0, 7, 28), status: "Active" },
      { id: "d-c2", name: "iPad Pro 13", os: "iPadOS 18", version: "2.2.0", ip: "10.0.0.88", lastSeen: dt(2, 11, 0), status: "Revoked" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(300) }],
  },
  {
    id: "u4", name: "David Park", email: "d.park@subl.io", primaryRole: "Product Manager",
    department: "Product", status: "Active", lastLogin: dt(1, 14, 0), createdAt: d(180),
    initials: "DP", color: "from-cyan-500 to-blue-600", activeSessions: 1, phone: "+1 (650) 555-0314",
    location: "Palo Alto, CA",
    stressHistory: genStress(20, 0),
    devices: [
      { id: "d-d1", name: "MacBook Air M3", os: "macOS 15.1", version: "2.4.1", ip: "192.168.1.88", lastSeen: dt(1, 13, 55), status: "Active" },
    ],
    assignedRoles: [
      { id: "r4", name: "Manager", assignedAt: d(100) },
      { id: "r3", name: "Analyst", assignedAt: d(90) },
    ],
  },
  {
    id: "u5", name: "Elena Vasquez", email: "e.vasquez@subl.io", primaryRole: "HR Manager",
    department: "Human Resources", status: "Suspended", lastLogin: dt(14, 9, 0), createdAt: d(500),
    initials: "EV", color: "from-pink-500 to-rose-500", activeSessions: 0, phone: "+1 (312) 555-0455",
    location: "Chicago, IL",
    stressHistory: genStress(50, -5),
    devices: [
      { id: "d-e1", name: "MacBook Pro 14", os: "macOS 14.6", version: "2.3.0", ip: "192.168.4.22", lastSeen: dt(14, 9, 0), status: "Revoked" },
    ],
    assignedRoles: [{ id: "r6", name: "HR Manager", assignedAt: d(400) }],
  },
  {
    id: "u6", name: "Frank Liu", email: "f.liu@subl.io", primaryRole: "Financial Analyst",
    department: "Finance", status: "Active", lastLogin: dt(0, 10, 15), createdAt: d(260),
    initials: "FL", color: "from-amber-500 to-orange-600", activeSessions: 2, phone: "+1 (415) 555-0612",
    location: "San Francisco, CA",
    stressHistory: genStress(40, 15),
    devices: [
      { id: "d-f1", name: "Surface Pro 9", os: "Windows 11", version: "2.4.1", ip: "192.168.1.55", lastSeen: dt(0, 10, 10), status: "Active" },
    ],
    assignedRoles: [{ id: "r3", name: "Analyst", assignedAt: d(200) }],
  },
  {
    id: "u7", name: "Grace Kim", email: "g.kim@subl.io", primaryRole: "Marketing Strategist",
    department: "Marketing", status: "Active", lastLogin: dt(0, 11, 30), createdAt: d(150),
    initials: "GK", color: "from-indigo-500 to-violet-600", activeSessions: 1, phone: "+1 (503) 555-0721",
    location: "Portland, OR",
    stressHistory: genStress(18, 2),
    devices: [
      { id: "d-g1", name: "MacBook Air M2", os: "macOS 15.1", version: "2.4.1", ip: "192.168.5.10", lastSeen: dt(0, 11, 28), status: "Active" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(100) }],
  },
  {
    id: "u8", name: "Hiro Tanaka", email: "h.tanaka@subl.io", primaryRole: "Backend Engineer",
    department: "Engineering", status: "Active", lastLogin: dt(0, 8, 0), createdAt: d(340),
    initials: "HT", color: "from-red-500 to-rose-600", activeSessions: 4, phone: "+1 (206) 555-0848",
    location: "Seattle, WA",
    stressHistory: genStress(68, 12),
    devices: [
      { id: "d-h1", name: "Ubuntu Workstation", os: "Ubuntu 24.04", version: "2.4.1", ip: "192.168.1.20", lastSeen: dt(0, 7, 59), status: "Active" },
      { id: "d-h2", name: "MacBook Pro 14", os: "macOS 15.1", version: "2.4.0", ip: "192.168.1.21", lastSeen: dt(3, 9, 0), status: "Active" },
    ],
    assignedRoles: [
      { id: "r1", name: "Admin", assignedAt: d(300) },
      { id: "r7", name: "IT Admin", assignedAt: d(200) },
    ],
  },
  {
    id: "u9", name: "Isabella Rossi", email: "i.rossi@subl.io", primaryRole: "Legal Counsel",
    department: "Legal", status: "Inactive", lastLogin: dt(30, 14, 0), createdAt: d(600),
    initials: "IR", color: "from-slate-500 to-slate-600", activeSessions: 0, phone: "+1 (212) 555-0966",
    location: "New York, NY",
    stressHistory: genStress(35, 0),
    devices: [
      { id: "d-i1", name: "ThinkPad T490", os: "Windows 10", version: "2.1.0", ip: "192.168.6.7", lastSeen: dt(30, 14, 0), status: "Revoked" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(500) }],
  },
  {
    id: "u10", name: "Jake Morrison", email: "j.morrison@subl.io", primaryRole: "Product Designer",
    department: "Product", status: "Active", lastLogin: dt(0, 9, 45), createdAt: d(220),
    initials: "JM", color: "from-teal-500 to-cyan-600", activeSessions: 2, phone: "+1 (415) 555-1082",
    location: "San Francisco, CA",
    stressHistory: genStress(42, -8),
    devices: [
      { id: "d-j1", name: "MacBook Pro 16", os: "macOS 15.1", version: "2.4.1", ip: "192.168.1.90", lastSeen: dt(0, 9, 40), status: "Active" },
    ],
    assignedRoles: [{ id: "r3", name: "Analyst", assignedAt: d(180) }],
  },
  {
    id: "u11", name: "Karen Lee", email: "k.lee@subl.io", primaryRole: "Sales Director",
    department: "Sales", status: "Active", lastLogin: dt(0, 7, 15), createdAt: d(450),
    initials: "KL", color: "from-fuchsia-500 to-pink-600", activeSessions: 2, phone: "+1 (646) 555-1134",
    location: "New York, NY",
    stressHistory: genStress(48, 5),
    devices: [
      { id: "d-k1", name: "Surface Laptop 5", os: "Windows 11", version: "2.4.1", ip: "192.168.2.45", lastSeen: dt(0, 7, 12), status: "Active" },
    ],
    assignedRoles: [
      { id: "r4", name: "Manager", assignedAt: d(400) },
      { id: "r8", name: "Executive", assignedAt: d(200) },
    ],
  },
  {
    id: "u12", name: "Lucas Ferrari", email: "l.ferrari@subl.io", primaryRole: "DevOps Engineer",
    department: "Engineering", status: "Suspended", lastLogin: dt(7, 18, 30), createdAt: d(390),
    initials: "LF", color: "from-slate-400 to-slate-600", activeSessions: 0, phone: "+1 (408) 555-1244",
    location: "San Jose, CA",
    stressHistory: genStress(75, -20),
    devices: [
      { id: "d-l1", name: "Linux Server Node", os: "Debian 12", version: "2.3.5", ip: "10.0.0.5", lastSeen: dt(7, 18, 28), status: "Revoked" },
    ],
    assignedRoles: [
      { id: "r7", name: "IT Admin", assignedAt: d(350) },
    ],
  },
  {
    id: "u13", name: "Mia Chen", email: "m.chen@subl.io", primaryRole: "Data Scientist",
    department: "Engineering", status: "Active", lastLogin: dt(0, 10, 0), createdAt: d(200),
    initials: "MC", color: "from-blue-400 to-indigo-600", activeSessions: 1, phone: "+1 (650) 555-1321",
    location: "Palo Alto, CA",
    stressHistory: genStress(22, 0),
    devices: [
      { id: "d-m1", name: "MacBook Pro 14", os: "macOS 15.1", version: "2.4.1", ip: "192.168.1.35", lastSeen: dt(0, 9, 55), status: "Active" },
    ],
    assignedRoles: [{ id: "r3", name: "Analyst", assignedAt: d(150) }],
  },
  {
    id: "u14", name: "Nathan Brooks", email: "n.brooks@subl.io", primaryRole: "Support Engineer",
    department: "Customer Support", status: "Active", lastLogin: dt(0, 8, 20), createdAt: d(310),
    initials: "NB", color: "from-green-500 to-emerald-600", activeSessions: 3, phone: "+1 (713) 555-1411",
    location: "Houston, TX",
    stressHistory: genStress(70, 5),
    devices: [
      { id: "d-n1", name: "Dell Latitude 5440", os: "Windows 11", version: "2.4.1", ip: "192.168.3.60", lastSeen: dt(0, 8, 18), status: "Active" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(250) }],
  },
  {
    id: "u15", name: "Olivia Turner", email: "o.turner@subl.io", primaryRole: "Content Strategist",
    department: "Marketing", status: "Active", lastLogin: dt(0, 12, 0), createdAt: d(170),
    initials: "OT", color: "from-orange-400 to-amber-500", activeSessions: 1, phone: "+1 (503) 555-1556",
    location: "Portland, OR",
    stressHistory: genStress(30, -5),
    devices: [
      { id: "d-o1", name: "MacBook Air M3", os: "macOS 15.1", version: "2.4.1", ip: "192.168.5.20", lastSeen: dt(0, 11, 58), status: "Active" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(130) }],
  },
  {
    id: "u16", name: "Paul Martinez", email: "p.martinez@subl.io", primaryRole: "Senior Engineer",
    department: "Engineering", status: "Active", lastLogin: dt(0, 9, 30), createdAt: d(280),
    initials: "PM", color: "from-violet-500 to-purple-700", activeSessions: 2, phone: "+1 (512) 555-1612",
    location: "Austin, TX",
    stressHistory: genStress(55, 10),
    devices: [
      { id: "d-p1", name: "ThinkPad X1 Carbon", os: "Ubuntu 24.04", version: "2.4.1", ip: "192.168.1.77", lastSeen: dt(0, 9, 25), status: "Active" },
    ],
    assignedRoles: [{ id: "r1", name: "Admin", assignedAt: d(200) }],
  },
  {
    id: "u17", name: "Quinn Walsh", email: "q.walsh@subl.io", primaryRole: "HR Coordinator",
    department: "Human Resources", status: "Active", lastLogin: dt(1, 16, 0), createdAt: d(130),
    initials: "QW", color: "from-lime-500 to-green-600", activeSessions: 1, phone: "+1 (720) 555-1787",
    location: "Denver, CO",
    stressHistory: genStress(15, 3),
    devices: [
      { id: "d-q1", name: "MacBook Air M2", os: "macOS 15.1", version: "2.4.1", ip: "192.168.4.30", lastSeen: dt(1, 15, 55), status: "Active" },
    ],
    assignedRoles: [{ id: "r6", name: "HR Manager", assignedAt: d(100) }],
  },
  {
    id: "u18", name: "Rachel Kim", email: "r.kim@subl.io", primaryRole: "Account Manager",
    department: "Sales", status: "Active", lastLogin: dt(0, 10, 45), createdAt: d(240),
    initials: "RK", color: "from-rose-400 to-red-500", activeSessions: 2, phone: "+1 (617) 555-1868",
    location: "Boston, MA",
    stressHistory: genStress(45, 0),
    devices: [
      { id: "d-r1", name: "Surface Pro 10", os: "Windows 11", version: "2.4.1", ip: "192.168.2.15", lastSeen: dt(0, 10, 40), status: "Active" },
    ],
    assignedRoles: [{ id: "r4", name: "Manager", assignedAt: d(180) }],
  },
  {
    id: "u19", name: "Sam Torres", email: "s.torres@subl.io", primaryRole: "Support Specialist",
    department: "Customer Support", status: "Inactive", lastLogin: dt(45, 9, 0), createdAt: d(560),
    initials: "ST", color: "from-slate-400 to-gray-500", activeSessions: 0, phone: "+1 (305) 555-1945",
    location: "Miami, FL",
    stressHistory: genStress(65, 0),
    devices: [
      { id: "d-s1", name: "HP EliteBook 840", os: "Windows 11", version: "2.2.0", ip: "192.168.3.90", lastSeen: dt(45, 9, 0), status: "Revoked" },
    ],
    assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: d(500) }],
  },
  {
    id: "u20", name: "Tanya Black", email: "t.black@subl.io", primaryRole: "Engineering Manager",
    department: "Engineering", status: "Active", lastLogin: dt(0, 8, 30), createdAt: d(700),
    initials: "TB", color: "from-sky-500 to-blue-600", activeSessions: 3, phone: "+1 (415) 555-2034",
    location: "San Francisco, CA",
    stressHistory: genStress(52, -15),
    devices: [
      { id: "d-t1", name: "MacBook Pro 16", os: "macOS 15.1", version: "2.4.1", ip: "192.168.1.5", lastSeen: dt(0, 8, 28), status: "Active" },
      { id: "d-t2", name: "iPad Pro 11", os: "iPadOS 18", version: "2.4.0", ip: "10.0.0.12", lastSeen: dt(2, 8, 0), status: "Active" },
    ],
    assignedRoles: [
      { id: "r1", name: "Admin", assignedAt: d(600) },
      { id: "r4", name: "Manager", assignedAt: d(400) },
      { id: "r8", name: "Executive", assignedAt: d(300) },
    ],
  },
];

// ─── Roles ────────────────────────────────────────────────────────────────────

export const MOCK_ROLES: Role[] = [
  { id: "r1", name: "Admin", description: "Full system access — user and configuration management", userCount: 4, createdAt: d(700), isSystem: true, permissions: ["users.read","users.write","users.delete","roles.read","roles.write","accounts.read","accounts.write","audit.read","devices.read","devices.write","settings.read","settings.write","reports.read"] },
  { id: "r2", name: "Super Admin", description: "Unrestricted root access — all system permissions", userCount: 1, createdAt: d(700), isSystem: true, permissions: ["*"] },
  { id: "r3", name: "Analyst", description: "Read access to reports, dashboards, and stress analytics", userCount: 5, createdAt: d(500), isSystem: false, permissions: ["users.read","reports.read","audit.read","devices.read"] },
  { id: "r4", name: "Manager", description: "Team-level oversight — can view and act on team data", userCount: 6, createdAt: d(450), isSystem: false, permissions: ["users.read","reports.read","devices.read","interventions.write"] },
  { id: "r5", name: "Viewer", description: "Read-only access to own department data", userCount: 8, createdAt: d(400), isSystem: false, permissions: ["reports.read"] },
  { id: "r6", name: "HR Manager", description: "HR-specific access — employee wellness and HR reports", userCount: 2, createdAt: d(350), isSystem: false, permissions: ["users.read","reports.read","interventions.read","interventions.write"] },
  { id: "r7", name: "IT Admin", description: "Device and infrastructure management", userCount: 2, createdAt: d(300), isSystem: false, permissions: ["devices.read","devices.write","audit.read","settings.read"] },
  { id: "r8", name: "Executive", description: "Executive dashboard — high-level KPIs and reports", userCount: 3, createdAt: d(250), isSystem: false, permissions: ["reports.read","accounts.read"] },
];

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "acc1", name: "Acme Corp", plan: "Enterprise", status: "Active",
    userCount: 340, createdAt: d(450), renewalDate: d(-180), industry: "Technology", mrr: 12800,
    contacts: [
      { name: "Sarah Mitchell", email: "s.mitchell@acme.com", role: "Account Owner", phone: "+1 (415) 555-8001" },
      { name: "Tom Brennan", email: "t.brennan@acme.com", role: "Technical Contact", phone: "+1 (415) 555-8002" },
      { name: "Jess Park", email: "j.park@acme.com", role: "Billing Contact", phone: "+1 (415) 555-8003" },
    ],
  },
  {
    id: "acc2", name: "Nova Financial", plan: "Professional", status: "Active",
    userCount: 145, createdAt: d(280), renewalDate: d(-60), industry: "Finance", mrr: 5400,
    contacts: [
      { name: "Michael Chen", email: "m.chen@novafinancial.com", role: "Account Owner", phone: "+1 (212) 555-9001" },
      { name: "Linda Torres", email: "l.torres@novafinancial.com", role: "Technical Contact", phone: "+1 (212) 555-9002" },
    ],
  },
  {
    id: "acc3", name: "HealthFirst Solutions", plan: "Enterprise", status: "Active",
    userCount: 620, createdAt: d(520), renewalDate: d(-300), industry: "Healthcare", mrr: 24500,
    contacts: [
      { name: "Dr. Amanda Ross", email: "a.ross@healthfirst.com", role: "Account Owner", phone: "+1 (617) 555-7001" },
      { name: "Kevin Wright", email: "k.wright@healthfirst.com", role: "Technical Contact", phone: "+1 (617) 555-7002" },
    ],
  },
  {
    id: "acc4", name: "Pixel Labs Inc.", plan: "Starter", status: "Trial",
    userCount: 28, createdAt: d(15), renewalDate: d(-14), industry: "Technology", mrr: 0,
    contacts: [
      { name: "Ryan Stark", email: "r.stark@pixellabs.io", role: "Account Owner", phone: "+1 (650) 555-6001" },
    ],
  },
  {
    id: "acc5", name: "Zephyr Logistics", plan: "Professional", status: "Suspended",
    userCount: 88, createdAt: d(190), renewalDate: d(30), industry: "Logistics", mrr: 0,
    contacts: [
      { name: "Diane Nguyen", email: "d.nguyen@zephyr.com", role: "Account Owner", phone: "+1 (312) 555-5001" },
      { name: "Carlos Mendez", email: "c.mendez@zephyr.com", role: "Billing Contact", phone: "+1 (312) 555-5002" },
    ],
  },
  {
    id: "acc6", name: "BlueSky Retail Group", plan: "Professional", status: "Active",
    userCount: 210, createdAt: d(350), renewalDate: d(-120), industry: "Retail", mrr: 7900,
    contacts: [
      { name: "Patricia Hall", email: "p.hall@bluesky.com", role: "Account Owner", phone: "+1 (214) 555-4001" },
      { name: "James Wu", email: "j.wu@bluesky.com", role: "Technical Contact", phone: "+1 (214) 555-4002" },
      { name: "Sophia Levy", email: "s.levy@bluesky.com", role: "Billing Contact", phone: "+1 (214) 555-4003" },
    ],
  },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: "al1", timestamp: dt(0, 9, 12), actor: "Alice Johnson", actorRole: "Admin", action: "USER_LOGIN", resource: "User", resourceId: "u1", severity: "info", ip: "192.168.1.12", before: null, after: { event: "login_success", method: "SSO" } },
  { id: "al2", timestamp: dt(0, 9, 5), actor: "Tanya Black", actorRole: "Admin", action: "USER_STATUS_CHANGED", resource: "User", resourceId: "u5", severity: "warning", ip: "192.168.1.5", before: { status: "Active" }, after: { status: "Suspended", reason: "Policy violation under review" } },
  { id: "al3", timestamp: dt(0, 8, 55), actor: "Alice Johnson", actorRole: "Admin", action: "ROLE_ASSIGNED", resource: "User", resourceId: "u10", severity: "info", ip: "192.168.1.12", before: { roles: ["Viewer"] }, after: { roles: ["Viewer", "Analyst"] } },
  { id: "al4", timestamp: dt(0, 8, 44), actor: "Brian Nguyen", actorRole: "Manager", action: "USER_LOGIN", resource: "User", resourceId: "u2", severity: "info", ip: "192.168.2.30", before: null, after: { event: "login_success", method: "password" } },
  { id: "al5", timestamp: dt(0, 8, 30), actor: "Hiro Tanaka", actorRole: "Admin", action: "DEVICE_REVOKED", resource: "Device", resourceId: "d-c2", severity: "warning", ip: "192.168.1.20", before: { status: "Active", device: "iPad Pro 13 - c.ruiz" }, after: { status: "Revoked", revokedBy: "h.tanaka" } },
  { id: "al6", timestamp: dt(0, 8, 12), actor: "System", actorRole: "Automation", action: "STRESS_ALERT_TRIGGERED", resource: "User", resourceId: "u3", severity: "critical", ip: "127.0.0.1", before: { stressLevel: "moderate", score: 52 }, after: { stressLevel: "high", score: 78, alertsSent: ["admin", "hr"] } },
  { id: "al7", timestamp: dt(0, 7, 59), actor: "Hiro Tanaka", actorRole: "Admin", action: "USER_LOGIN", resource: "User", resourceId: "u8", severity: "info", ip: "192.168.1.20", before: null, after: { event: "login_success", method: "2FA" } },
  { id: "al8", timestamp: dt(0, 7, 30), actor: "Carmen Ruiz", actorRole: "Viewer", action: "USER_LOGIN", resource: "User", resourceId: "u3", severity: "info", ip: "192.168.3.15", before: null, after: { event: "login_success" } },
  { id: "al9", timestamp: dt(1, 18, 45), actor: "Alice Johnson", actorRole: "Admin", action: "PASSWORD_RESET", resource: "User", resourceId: "u12", severity: "warning", ip: "192.168.1.12", before: { passwordAge: "120 days" }, after: { passwordAge: "0 days", resetBy: "admin" } },
  { id: "al10", timestamp: dt(1, 17, 30), actor: "Tanya Black", actorRole: "Admin", action: "USER_SUSPENDED", resource: "User", resourceId: "u12", severity: "critical", ip: "192.168.1.5", before: { status: "Active" }, after: { status: "Suspended", reason: "Suspected unauthorized access" } },
  { id: "al11", timestamp: dt(1, 16, 15), actor: "System", actorRole: "Automation", action: "STRESS_ALERT_TRIGGERED", resource: "User", resourceId: "u8", severity: "critical", ip: "127.0.0.1", before: { stressLevel: "high", score: 74 }, after: { stressLevel: "critical", score: 91 } },
  { id: "al12", timestamp: dt(1, 15, 0), actor: "Quinn Walsh", actorRole: "HR Manager", action: "INTERVENTION_DEPLOYED", resource: "User", resourceId: "u14", severity: "info", ip: "192.168.4.30", before: { interventionCount: 2 }, after: { interventionCount: 3, type: "micro-break", message: "Sent wellness nudge" } },
  { id: "al13", timestamp: dt(1, 14, 0), actor: "David Park", actorRole: "Manager", action: "USER_LOGIN", resource: "User", resourceId: "u4", severity: "info", ip: "192.168.1.88", before: null, after: { event: "login_success", method: "SSO" } },
  { id: "al14", timestamp: dt(2, 11, 30), actor: "Alice Johnson", actorRole: "Admin", action: "ACCOUNT_PLAN_CHANGED", resource: "Account", resourceId: "acc3", severity: "info", ip: "192.168.1.12", before: { plan: "Professional", mrr: 5400 }, after: { plan: "Enterprise", mrr: 24500 } },
  { id: "al15", timestamp: dt(2, 10, 15), actor: "Hiro Tanaka", actorRole: "IT Admin", action: "SETTINGS_UPDATED", resource: "Settings", resourceId: "global", severity: "warning", ip: "192.168.1.20", before: { sessionTimeout: "60min" }, after: { sessionTimeout: "30min" } },
  { id: "al16", timestamp: dt(2, 9, 0), actor: "System", actorRole: "Automation", action: "ACCOUNT_SUSPENDED", resource: "Account", resourceId: "acc5", severity: "critical", ip: "127.0.0.1", before: { status: "Active", paymentStatus: "overdue_30d" }, after: { status: "Suspended", reason: "Payment failure" } },
  { id: "al17", timestamp: dt(3, 16, 45), actor: "Tanya Black", actorRole: "Admin", action: "USER_CREATED", resource: "User", resourceId: "u17", severity: "info", ip: "192.168.1.5", before: null, after: { name: "Quinn Walsh", email: "q.walsh@subl.io", role: "HR Coordinator" } },
  { id: "al18", timestamp: dt(3, 15, 20), actor: "Alice Johnson", actorRole: "Admin", action: "ROLE_CREATED", resource: "Role", resourceId: "r8", severity: "info", ip: "192.168.1.12", before: null, after: { name: "Executive", permissions: ["reports.read", "accounts.read"] } },
  { id: "al19", timestamp: dt(4, 11, 0), actor: "System", actorRole: "Automation", action: "BULK_STRESS_REPORT", resource: "Report", resourceId: "rpt-weekly-19", severity: "info", ip: "127.0.0.1", before: null, after: { type: "weekly_digest", recipientCount: 12, generatedAt: dt(4, 11, 0) } },
  { id: "al20", timestamp: dt(5, 9, 30), actor: "Hiro Tanaka", actorRole: "IT Admin", action: "DEVICE_ENROLLED", resource: "Device", resourceId: "d-h2", severity: "info", ip: "192.168.1.20", before: null, after: { hostname: "MacBook Pro 14", os: "macOS 15.1", assignedTo: "h.tanaka" } },
  { id: "al21", timestamp: dt(6, 14, 0), actor: "Alice Johnson", actorRole: "Admin", action: "EXPORT_DATA", resource: "Report", resourceId: "rpt-q1-2026", severity: "warning", ip: "192.168.1.12", before: null, after: { format: "CSV", rows: 4820, dataType: "stress_aggregated" } },
  { id: "al22", timestamp: dt(7, 10, 20), actor: "System", actorRole: "Automation", action: "SESSION_EXPIRED", resource: "User", resourceId: "u12", severity: "info", ip: "127.0.0.1", before: { sessionAge: "4hr" }, after: { event: "auto_logout", reason: "timeout" } },
  { id: "al23", timestamp: dt(7, 9, 0), actor: "Tanya Black", actorRole: "Admin", action: "2FA_ENFORCED", resource: "Settings", resourceId: "global", severity: "warning", ip: "192.168.1.5", before: { twoFactorRequired: false }, after: { twoFactorRequired: true, enforceBy: dt(-7) } },
  { id: "al24", timestamp: dt(8, 15, 45), actor: "Karen Lee", actorRole: "Executive", action: "REPORT_VIEWED", resource: "Report", resourceId: "rpt-exec-q1", severity: "info", ip: "192.168.2.45", before: null, after: { report: "Q1 Executive Summary", viewDuration: "8min" } },
  { id: "al25", timestamp: dt(10, 11, 0), actor: "Alice Johnson", actorRole: "Admin", action: "USER_DELETED", resource: "User", resourceId: "u-archived-04", severity: "critical", ip: "192.168.1.12", before: { name: "Former Employee", email: "f.emp@subl.io", status: "Inactive" }, after: null },
];

// ─── Devices ──────────────────────────────────────────────────────────────────

export const MOCK_DEVICES: Device[] = [
  { id: "dev1", hostname: "SUBL-ENG-MAC-01", userId: "u1", userName: "Alice Johnson", department: "Engineering", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.1.12", status: "Active", lastSeen: dt(0, 9, 10), enrolledAt: d(380), stressSignal: "moderate" },
  { id: "dev2", hostname: "SUBL-SALES-WIN-01", userId: "u2", userName: "Brian Nguyen", department: "Sales", os: "Windows 11", agentVersion: "2.4.1", ip: "192.168.2.30", status: "Active", lastSeen: dt(0, 8, 44), enrolledAt: d(290), stressSignal: "low" },
  { id: "dev3", hostname: "SUBL-SUP-WIN-02", userId: "u3", userName: "Carmen Ruiz", department: "Customer Support", os: "Windows 11", agentVersion: "2.4.0", ip: "192.168.3.15", status: "Active", lastSeen: dt(0, 7, 28), enrolledAt: d(420), stressSignal: "high" },
  { id: "dev4", hostname: "SUBL-PROD-MAC-01", userId: "u4", userName: "David Park", department: "Product", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.1.88", status: "Idle", lastSeen: dt(1, 14, 0), enrolledAt: d(180), stressSignal: "low" },
  { id: "dev5", hostname: "SUBL-FIN-WIN-01", userId: "u6", userName: "Frank Liu", department: "Finance", os: "Windows 11", agentVersion: "2.4.1", ip: "192.168.1.55", status: "Active", lastSeen: dt(0, 10, 10), enrolledAt: d(260), stressSignal: "moderate" },
  { id: "dev6", hostname: "SUBL-MKT-MAC-01", userId: "u7", userName: "Grace Kim", department: "Marketing", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.5.10", status: "Active", lastSeen: dt(0, 11, 28), enrolledAt: d(150), stressSignal: "low" },
  { id: "dev7", hostname: "SUBL-ENG-LNX-01", userId: "u8", userName: "Hiro Tanaka", department: "Engineering", os: "Ubuntu 24.04", agentVersion: "2.4.1", ip: "192.168.1.20", status: "Active", lastSeen: dt(0, 7, 59), enrolledAt: d(340), stressSignal: "critical" },
  { id: "dev8", hostname: "SUBL-PROD-MAC-02", userId: "u10", userName: "Jake Morrison", department: "Product", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.1.90", status: "Active", lastSeen: dt(0, 9, 40), enrolledAt: d(220), stressSignal: "moderate" },
  { id: "dev9", hostname: "SUBL-SALES-WIN-02", userId: "u11", userName: "Karen Lee", department: "Sales", os: "Windows 11", agentVersion: "2.4.1", ip: "192.168.2.45", status: "Active", lastSeen: dt(0, 7, 12), enrolledAt: d(450), stressSignal: "moderate" },
  { id: "dev10", hostname: "SUBL-ENG-LNX-02", userId: "u12", userName: "Lucas Ferrari", department: "Engineering", os: "Debian 12", agentVersion: "2.3.5", ip: "10.0.0.5", status: "Revoked", lastSeen: dt(7, 18, 28), enrolledAt: d(390), stressSignal: "high" },
  { id: "dev11", hostname: "SUBL-ENG-MAC-02", userId: "u13", userName: "Mia Chen", department: "Engineering", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.1.35", status: "Active", lastSeen: dt(0, 9, 55), enrolledAt: d(200), stressSignal: "low" },
  { id: "dev12", hostname: "SUBL-SUP-WIN-03", userId: "u14", userName: "Nathan Brooks", department: "Customer Support", os: "Windows 11", agentVersion: "2.4.1", ip: "192.168.3.60", status: "Active", lastSeen: dt(0, 8, 18), enrolledAt: d(310), stressSignal: "high" },
  { id: "dev13", hostname: "SUBL-MKT-MAC-02", userId: "u15", userName: "Olivia Turner", department: "Marketing", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.5.20", status: "Active", lastSeen: dt(0, 11, 58), enrolledAt: d(170), stressSignal: "low" },
  { id: "dev14", hostname: "SUBL-ENG-WIN-01", userId: "u16", userName: "Paul Martinez", department: "Engineering", os: "Ubuntu 24.04", agentVersion: "2.4.1", ip: "192.168.1.77", status: "Active", lastSeen: dt(0, 9, 25), enrolledAt: d(280), stressSignal: "high" },
  { id: "dev15", hostname: "SUBL-ENG-MAC-03", userId: "u20", userName: "Tanya Black", department: "Engineering", os: "macOS 15.1", agentVersion: "2.4.1", ip: "192.168.1.5", status: "Active", lastSeen: dt(0, 8, 28), enrolledAt: d(700), stressSignal: "moderate" },
];

// ─── Permission matrix ────────────────────────────────────────────────────────

export const ALL_PERMISSIONS = [
  "users.read", "users.write", "users.delete",
  "roles.read", "roles.write",
  "accounts.read", "accounts.write",
  "audit.read",
  "devices.read", "devices.write",
  "settings.read", "settings.write",
  "reports.read",
  "interventions.read", "interventions.write",
];

// ─── Alert ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "Active" | "Resolved" | "Acknowledged";
export type AlertCategory = "Stress" | "Burnout" | "Anomaly" | "System" | "Security";

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  department: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  category: AlertCategory;
  resolvedAt?: string;
}

export const MOCK_ALERTS: Alert[] = [
  { id: "a1", title: "Critical Stress Level Detected", message: "Hiro Tanaka's stress score reached 91 — immediate intervention recommended.", severity: "critical", status: "Active", department: "Engineering", userId: "u8", userName: "Hiro Tanaka", timestamp: dt(1, 16, 15), category: "Stress" },
  { id: "a2", title: "Burnout Risk — Customer Support", message: "3 of 4 agents in Customer Support have sustained stress scores above 70 for 7+ days.", severity: "critical", status: "Active", department: "Customer Support", timestamp: dt(0, 8, 12), category: "Burnout" },
  { id: "a3", title: "High Stress — Carmen Ruiz", message: "Carmen Ruiz stress score escalated to 78. Wellness nudge dispatched automatically.", severity: "high", status: "Acknowledged", department: "Customer Support", userId: "u3", userName: "Carmen Ruiz", timestamp: dt(0, 8, 12), category: "Stress" },
  { id: "a4", title: "Elevated Stress — Nathan Brooks", message: "Nathan Brooks has shown elevated stress patterns for 5 consecutive days (avg 71).", severity: "high", status: "Active", department: "Customer Support", userId: "u14", userName: "Nathan Brooks", timestamp: dt(0, 9, 30), category: "Stress" },
  { id: "a5", title: "Anomalous Session Activity", message: "Lucas Ferrari's account logged 6 simultaneous sessions before suspension. Possible credential sharing.", severity: "high", status: "Resolved", department: "Engineering", userId: "u12", userName: "Lucas Ferrari", timestamp: dt(7, 18, 30), resolvedAt: dt(7, 22, 0), category: "Security" },
  { id: "a6", title: "Stress Trend — Engineering Department", message: "Engineering dept average stress score rose from 52 to 68 over the past 14 days.", severity: "high", status: "Active", department: "Engineering", timestamp: dt(0, 7, 0), category: "Burnout" },
  { id: "a7", title: "Agent Offline — SUBL-ENG-LNX-02", message: "Device SUBL-ENG-LNX-02 (Lucas Ferrari) has been offline for 7 days. Agent revoked.", severity: "medium", status: "Resolved", department: "Engineering", userId: "u12", userName: "Lucas Ferrari", timestamp: dt(7, 19, 0), resolvedAt: dt(7, 20, 30), category: "System" },
  { id: "a8", title: "Weekend Overwork Detected", message: "5 Engineering team members worked 8+ hours on Saturday. Rest pattern anomaly flagged.", severity: "medium", status: "Acknowledged", department: "Engineering", timestamp: dt(3, 10, 0), category: "Anomaly" },
  { id: "a9", title: "Stress Spike — Frank Liu", message: "Frank Liu stress score increased by 18 points in a single day (40 → 58).", severity: "medium", status: "Active", department: "Finance", userId: "u6", userName: "Frank Liu", timestamp: dt(2, 11, 0), category: "Stress" },
  { id: "a10", title: "Inactive Account — Isabella Rossi", message: "Isabella Rossi has not logged in for 30 days. Account flagged for review.", severity: "medium", status: "Acknowledged", department: "Legal", userId: "u9", userName: "Isabella Rossi", timestamp: dt(30, 14, 0), category: "Anomaly" },
  { id: "a11", title: "Intervention Effectiveness Low", message: "3 wellness nudges sent to Nathan Brooks in 7 days — no measurable stress reduction.", severity: "medium", status: "Active", department: "Customer Support", userId: "u14", userName: "Nathan Brooks", timestamp: dt(1, 15, 30), category: "Burnout" },
  { id: "a12", title: "Device Agent Outdated", message: "Carmen Ruiz's iPad Pro is running agent v2.2.0. Upgrade required for accurate signals.", severity: "low", status: "Resolved", department: "Customer Support", userId: "u3", userName: "Carmen Ruiz", timestamp: dt(5, 9, 0), resolvedAt: dt(4, 14, 0), category: "System" },
  { id: "a13", title: "Login from Unusual IP", message: "Isabella Rossi attempted login from IP 45.88.112.34 — outside known network ranges.", severity: "medium", status: "Resolved", department: "Legal", userId: "u9", userName: "Isabella Rossi", timestamp: dt(30, 13, 45), resolvedAt: dt(30, 15, 0), category: "Security" },
  { id: "a14", title: "High Stress — Paul Martinez", message: "Paul Martinez stress score reached 65, trending upward for 10 days.", severity: "high", status: "Active", department: "Engineering", userId: "u16", userName: "Paul Martinez", timestamp: dt(0, 9, 30), category: "Stress" },
  { id: "a15", title: "Stress Pattern — Sales Team", message: "Sales team end-of-quarter stress spike detected. Average score: 51 (up from 34).", severity: "medium", status: "Acknowledged", department: "Sales", timestamp: dt(4, 8, 0), category: "Stress" },
  { id: "a16", title: "Account Suspended — Zephyr Logistics", message: "Account acc5 auto-suspended due to 30-day payment failure. 88 users affected.", severity: "critical", status: "Resolved", department: "System", timestamp: dt(2, 9, 0), resolvedAt: dt(1, 11, 0), category: "System" },
  { id: "a17", title: "Role Escalation Attempt", message: "Brian Nguyen attempted to access Admin-restricted settings page. Access denied.", severity: "low", status: "Resolved", department: "Sales", userId: "u2", userName: "Brian Nguyen", timestamp: dt(8, 14, 22), resolvedAt: dt(8, 14, 23), category: "Security" },
  { id: "a18", title: "Low HR Engagement Score", message: "HR intervention response rate dropped to 34% this week — below the 60% threshold.", severity: "medium", status: "Active", department: "Human Resources", timestamp: dt(1, 10, 0), category: "Anomaly" },
  { id: "a19", title: "Stress Recovery Confirmed", message: "Alice Johnson's stress trend improved 10 points over 30 days. No action required.", severity: "low", status: "Resolved", department: "Engineering", userId: "u1", userName: "Alice Johnson", timestamp: dt(0, 9, 0), resolvedAt: dt(0, 9, 5), category: "Stress" },
  { id: "a20", title: "New Agent Enrollment Spike", message: "4 new devices enrolled in the past 24 hours — above normal rate. Verify legitimacy.", severity: "low", status: "Acknowledged", department: "System", timestamp: dt(5, 9, 30), category: "System" },
  { id: "a21", title: "Consecutive High-Stress Days", message: "Hiro Tanaka has scored above 65 for 12 consecutive days. Manager notified.", severity: "critical", status: "Active", department: "Engineering", userId: "u8", userName: "Hiro Tanaka", timestamp: dt(0, 8, 0), category: "Burnout" },
  { id: "a22", title: "Data Export from Admin Account", message: "Alice Johnson exported 4,820 rows of aggregated stress data to CSV. Review if expected.", severity: "medium", status: "Acknowledged", department: "Engineering", userId: "u1", userName: "Alice Johnson", timestamp: dt(6, 14, 0), category: "Security" },
  { id: "a23", title: "Session Timeout Policy Updated", message: "Session timeout reduced from 60 to 30 minutes. Affects all active users.", severity: "low", status: "Resolved", department: "System", timestamp: dt(2, 10, 15), resolvedAt: dt(2, 10, 20), category: "System" },
  { id: "a24", title: "Stress Improvement — Marketing", message: "Marketing team average stress dropped to 18 — lowest in 90 days. Positive trend.", severity: "low", status: "Resolved", department: "Marketing", timestamp: dt(3, 9, 0), resolvedAt: dt(3, 9, 5), category: "Stress" },
  { id: "a25", title: "Product Team Anomaly Detected", message: "Jake Morrison's focus patterns changed significantly. Investigate for wellbeing.", severity: "medium", status: "Active", department: "Product", userId: "u10", userName: "Jake Morrison", timestamp: dt(1, 11, 0), category: "Anomaly" },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = "alert" | "system" | "info" | "warning";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Critical: Hiro Tanaka", message: "Stress score reached 91 — burnout risk.", time: dt(1, 16, 15), read: false, type: "alert" },
  { id: "n2", title: "Burnout Risk — Customer Support", message: "3 agents at sustained high stress for 7+ days.", time: dt(0, 8, 12), read: false, type: "alert" },
  { id: "n3", title: "Paul Martinez — High Stress", message: "Stress score at 65 and trending upward.", time: dt(0, 9, 30), read: false, type: "warning" },
  { id: "n4", title: "Device SUBL-ENG-LNX-02 Offline", message: "Lucas Ferrari's device has been offline for 7 days.", time: dt(7, 19, 0), read: false, type: "system" },
  { id: "n5", title: "Weekly Digest Ready", message: "Stress analytics report for week 21 is available.", time: dt(4, 11, 0), read: true, type: "info" },
  { id: "n6", title: "Account Suspended: Zephyr Logistics", message: "Auto-suspended due to payment failure. 88 users affected.", time: dt(2, 9, 0), read: true, type: "warning" },
  { id: "n7", title: "2FA Enforcement Active", message: "Two-factor authentication is now required for all Admin roles.", time: dt(7, 9, 0), read: true, type: "system" },
  { id: "n8", title: "Carmen Ruiz — Acknowledged", message: "Wellness nudge delivered. Stress alert acknowledged.", time: dt(0, 8, 30), read: true, type: "info" },
];
