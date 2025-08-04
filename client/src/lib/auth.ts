import { type User } from "@shared/schema";

export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export function getUserRole(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'מנהל מערכת';
    case 'agency_admin':
      return 'מנהל סוכנות';
    case 'team_member':
      return 'חבר צוות';
    case 'client':
      return 'לקוח';
    default:
      return 'משתמש';
  }
}

export function canManageClients(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'agency_admin' || user?.role === 'team_member';
}

export function canManageProjects(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'agency_admin' || user?.role === 'team_member';
}

export function canManageTasks(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'agency_admin' || user?.role === 'team_member';
}

export function canManageTeam(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'agency_admin';
}

export function canManageAssets(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'agency_admin' || user?.role === 'team_member';
}

export function isClientUser(user: User | null): boolean {
  return user?.role === 'client';
}
