import { useMemo } from 'react';

import { UserRoles } from 'shared/constants';
import { useCheckAccess } from 'shared/hooks';

interface IProtectedProvider {
  /** Разрешения, по которым предоставляется доступ */
  allowedPermissions?: string[];
  /** Роли, по которым предоставляется доступ */
  allowedRoles: UserRoles[];
  children: JSX.Element;
  fallback?: JSX.Element;
}

export const ProtectedProvider = ({ allowedPermissions, allowedRoles, children, fallback }: IProtectedProvider) => {
  const rule = useMemo(
    () => ({ anyPerm: allowedPermissions, anyRole: allowedRoles }),
    [allowedPermissions, allowedRoles],
  );

  const hasRequiredRoles = useCheckAccess(rule);

  return hasRequiredRoles ? children : fallback ?? null;
};
