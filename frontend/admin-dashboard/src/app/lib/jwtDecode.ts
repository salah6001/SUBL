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

export function isSuperAdminToken(accessToken: string): boolean {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const roles: string[] = Array.isArray(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
      ? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      : [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? ''];
    return roles.some(r => r === 'Administrator' || r === 'Super Admin' || r === 'SuperAdmin');
  } catch {
    return false;
  }
}
