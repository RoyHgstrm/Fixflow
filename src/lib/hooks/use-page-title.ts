import { useEffect } from 'react';
import { UserRole } from '@/lib/types';

export function usePageTitle(userRole?: UserRole | string) {
  useEffect(() => {
    let pageTitle = 'FixFlow Dashboard';

    switch (userRole?.toUpperCase()) {
      case UserRole.OWNER:
        pageTitle = 'Owner Dashboard | FixFlow';
        break;
      case UserRole.MANAGER:
        pageTitle = 'Manager Dashboard | FixFlow';
        break;
      case UserRole.TECHNICIAN:
        pageTitle = 'Technician Dashboard | FixFlow';
        break;
      case UserRole.EMPLOYEE:
        pageTitle = 'Employee Dashboard | FixFlow';
        break;
      case UserRole.ADMIN:
        pageTitle = 'Admin Dashboard | FixFlow';
        break;
      case UserRole.CLIENT:
        pageTitle = 'Client Dashboard | FixFlow';
        break;
      default:
        pageTitle = 'Dashboard | FixFlow';
    }

    document.title = pageTitle;
  }, [userRole]);
} 