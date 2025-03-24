import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Permission, hasPermission } from '@/config/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !hasPermission(user.role, permission)) {
    return fallback || null;
  }

  return <>{children}</>;
}
