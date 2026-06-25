import { api } from "../apiClient";
import type { PagedResult } from "../types";
import type { User, UserStatus } from "../../data/mockData";

/** Raw user list item as returned by the backend `GET users`. */
interface UserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  accountType: number;
  status: number; // 1 Active, 2 Inactive, 3 Suspended
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  department: number | null; // 1 Development, 2 DataScience, 3 Operations, 4 Management
  jobTitle: string | null;
  phoneNumber: string | null;
}

const STATUS_MAP: Record<number, UserStatus> = {
  1: "Active",
  2: "Inactive",
  3: "Suspended",
};

const DEPARTMENT_MAP: Record<number, string> = {
  0: "Unassigned",
  1: "Development",
  2: "Data Science",
  3: "Operations",
  4: "Management",
};

/** The canonical department labels (must mirror the backend Department enum). */
export const DEPARTMENT_LABELS = ["Development", "Data Science", "Operations", "Management"];

/** Maps a department label back to the backend enum integer. */
export function departmentToInt(label: string): number | null {
  const entry = Object.entries(DEPARTMENT_MAP).find(([, v]) => v === label);
  return entry ? Number(entry[0]) : null;
}

// Tailwind gradient classes — the UI renders these as `bg-gradient-to-br ${color}`.
const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-red-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-violet-600",
];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

/**
 * Maps a backend user to the shape the dashboard UI expects. Fields the list
 * endpoint doesn't provide (department, role, devices, stress history) are
 * filled with safe placeholders until their own endpoints are wired.
 */
function toUser(dto: UserListItemDto): User {
  const name = dto.fullName?.trim() || dto.email;
  return {
    id: dto.id,
    name,
    email: dto.email,
    primaryRole: dto.jobTitle?.trim() || "—",
    department: dto.department != null ? (DEPARTMENT_MAP[dto.department] ?? "—") : "—",
    status: STATUS_MAP[dto.status] ?? "Inactive",
    lastLogin: formatDate(dto.lastLoginAt),
    createdAt: formatDate(dto.createdAt),
    initials: initialsOf(name),
    color: colorFor(dto.id),
    activeSessions: 0,
    stressHistory: [],
    devices: [],
    assignedRoles: [],
    phone: dto.phoneNumber ?? "",
    location: "",
  };
}

/** Fetches users from the backend and maps them to the UI's User shape. */
export async function fetchUsers(): Promise<User[]> {
  // Pull a large page for now; server-side paging/filtering comes later.
  const result = await api.get<PagedResult<UserListItemDto>>("users", {
    params: { pageNumber: 1, pageSize: 200, sortBy: "CreatedAt", sortDirection: "desc" },
  });
  return result.items.map(toUser);
}

/** Splits a display name into first / last parts. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

/** Creates the account (returns the new user id). */
export function createUser(req: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}): Promise<string> {
  // users/register returns the new user's Guid as a bare JSON string.
  return api.post<string>("users/register", req);
}

/** Admin update of a user's profile (department, job title, phone, …). */
export function updateUserProfile(
  id: string,
  req: { department: number; displayJobTitle?: string | null; phoneNumber?: string | null },
): Promise<void> {
  return api.put<void>(`users/${id}/profile`, {
    department: req.department,
    displayJobTitle: req.displayJobTitle ?? null,
    internalJobTitle: null,
    hourlyCost: null,
    phoneNumber: req.phoneNumber ?? null,
    hireDate: null,
    avatarUrl: null,
    bio: null,
    skills: null,
  });
}

/** Creates a user and, when provided, sets their department/role/phone. */
export async function createUserWithProfile(req: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
}): Promise<string> {
  const id = await createUser({
    email: req.email,
    firstName: req.firstName,
    lastName: req.lastName,
    password: req.password,
    phoneNumber: req.phone,
  });
  const deptInt = req.department ? departmentToInt(req.department) : null;
  if (deptInt != null || req.jobTitle || req.phone) {
    await updateUserProfile(id, {
      department: deptInt ?? 0,
      displayJobTitle: req.jobTitle || null,
      phoneNumber: req.phone || null,
    });
  }
  return id;
}

export function updateUser(
  id: string,
  req: { firstName: string; lastName: string; email: string },
): Promise<void> {
  return api.put<void>(`users/${id}`, req);
}

export function suspendUser(id: string, reason?: string): Promise<void> {
  return api.post<void>(`users/${id}/suspend`, { reason });
}

export function activateUser(id: string): Promise<void> {
  return api.post<void>(`users/${id}/activate`);
}

export function deactivateUser(id: string): Promise<void> {
  return api.post<void>(`users/${id}/deactivate`);
}

export function deleteUser(id: string): Promise<void> {
  return api.del<void>(`users/${id}`);
}

interface SessionDto {
  id: string;
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
}

/** Number of currently-active sessions for a user. */
export async function fetchActiveSessionCount(id: string): Promise<number> {
  const sessions = await api.get<SessionDto[]>(`users/${id}/sessions`);
  return sessions.filter(s => s.isActive).length;
}

/** Revoke (terminate) all of a user's sessions — logs them out everywhere. */
export function revokeAllSessions(id: string): Promise<void> {
  return api.del<void>(`users/${id}/sessions`);
}

export interface AdminDeviceDto {
  id: string;
  deviceName: string;
  userId: string;
  claimedByUserId: string | null;
  platform: string;
  osVersion: string | null;
  lastIpAddress: string | null;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  revokedAt: string | null;
}

/** All devices belonging to (or claimed by) a given user, incl. revoked. */
export async function fetchUserDevices(userId: string): Promise<AdminDeviceDto[]> {
  const all = await api.get<AdminDeviceDto[]>("admin/devices", { params: { includeRevoked: true } });
  return all.filter(d => d.userId === userId || d.claimedByUserId === userId);
}

/** Permanently remove a device from the database (revoked devices only). */
export function deleteDevice(deviceId: string): Promise<void> {
  return api.del<void>(`admin/devices/${deviceId}`);
}

/** Revoke a device (soft — sets it inactive; an admin can then delete it). */
export function revokeDeviceApi(deviceId: string): Promise<void> {
  return api.del<void>(`devices/${deviceId}`);
}
