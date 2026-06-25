/** Returns true if the JWT belongs to a user with admin/manager/staff permissions. */
export function isAdminToken(accessToken: string): boolean {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const permissions: string[] = payload.permissions ?? [];
    return permissions.length > 0 || payload.can_view_sensitive_data === 'TRUE';
  } catch {
    return false;
  }
}
