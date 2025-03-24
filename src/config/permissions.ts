import { UserRole } from '@/store/slices/authSlice';

export type Permission =
  | 'view_dashboard'
  | 'manage_inventory'
  | 'view_analytics'
  | 'manage_shipments'
  | 'view_compliance'
  | 'manage_compliance'
  | 'view_partners'
  | 'manage_partners'
  | 'view_reports'
  | 'manage_reports';

export const rolePermissions: Record<UserRole, Permission[]> = {
  farmer: [
    'view_dashboard',
    'manage_inventory',
    'view_analytics',
    'view_partners',
    'view_reports'
  ],
  retailer: [
    'view_dashboard',
    'manage_inventory',
    'view_analytics',
    'manage_shipments',
    'view_partners',
    'view_reports'
  ],
  transporter: [
    'view_dashboard',
    'manage_shipments',
    'view_analytics',
    'view_partners',
    'view_reports'
  ],
  manager: [
    'view_dashboard',
    'manage_inventory',
    'manage_shipments',
    'view_analytics',
    'view_compliance',
    'manage_partners',
    'manage_reports'
  ],
  regulator: [
    'view_dashboard',
    'view_analytics',
    'view_compliance',
    'manage_compliance',
    'view_partners',
    'manage_reports'
  ]
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return rolePermissions[userRole]?.includes(permission) || false;
};
