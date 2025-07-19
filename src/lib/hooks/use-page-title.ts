/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { useEffect, useState } from 'react';
import { type UserRole, USER_ROLES } from '@/lib/types';
import { getNavConfig } from '@/lib/navigation-utils';

export function usePageTitle(userRole?: UserRole | string) {
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (userRole) {
      const navConfig = getNavConfig(userRole as UserRole);
      setPageTitle(navConfig.title);
    } else {
      setPageTitle('Loading...');
    }
  }, [userRole]);

  return pageTitle;
} 