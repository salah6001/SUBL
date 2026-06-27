import { api } from "../apiClient";

export type WorkspaceRequestStatus = "Pending" | "Approved" | "Rejected";

export interface WorkspaceRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  message: string | null;
  status: WorkspaceRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface ApproveResult {
  userId: string;
  email: string;
  temporaryPassword: string;
}

/** Lists workspace (new-admin) requests, optionally filtered by status. */
export function fetchWorkspaceRequests(status?: WorkspaceRequestStatus): Promise<WorkspaceRequest[]> {
  return api.get<WorkspaceRequest[]>("workspace-requests", status ? { params: { status } } : undefined);
}

/** Approves a request — provisions an admin account and returns the temp password. */
export function approveWorkspaceRequest(id: string): Promise<ApproveResult> {
  return api.post<ApproveResult>(`workspace-requests/${id}/approve`);
}

/** Rejects a request with an optional note. */
export function rejectWorkspaceRequest(id: string, note?: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`workspace-requests/${id}/reject`, { note: note ?? null });
}
