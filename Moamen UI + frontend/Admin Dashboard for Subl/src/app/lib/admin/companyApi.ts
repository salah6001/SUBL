import { api } from "../apiClient";

export interface Company {
  id: string;
  name: string;
}

/** The organisation's company record (shown as a banner across the console). */
export function fetchCompany(): Promise<Company> {
  return api.get<Company>("admin/company");
}

/** Rename the company (super admin only). */
export function updateCompany(name: string): Promise<Company> {
  return api.put<Company>("admin/company", { name });
}
