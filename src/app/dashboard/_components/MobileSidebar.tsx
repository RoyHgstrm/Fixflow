"use client";

import { Menu, X, Clock } from 'lucide-react';
import { iconMap, NavLink, NavConfig, getRoleLabel } from '@/lib/navigation-utils';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { CustomSession } from '@/lib/providers/session-provider';

type MobileSidebarProps = {
  navConfig: NavConfig;
  session: CustomSession | null;
  userRole: UserRole;
  allNavLinks: NavLink[];
  isActive: (href: string) => boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
};

export default function MobileSidebar({
  navConfig,
  session,
  userRole,
  allNavLinks,
  isActive,
  searchQuery,
  setSearchQuery,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();

  const HeaderIcon = iconMap[navConfig.icon];

  return (
    <div className="flex flex-col h-full">
      {/* Header - Larger for mobile */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${navConfig.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
            <HeaderIcon className={`w-6 h-6 ${navConfig.color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-gradient">
              {session?.user?.company?.name || 'FixFlow'}
            </div>
            <div className="text-sm text-muted-foreground font-medium">{navConfig.title}</div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Clock In/Out for Field Workers */}
      {(userRole === UserRole.EMPLOYEE || userRole === UserRole.TECHNICIAN) && (
        <div className="p-4 border-b border-gray-700">
          <Button className="w-full gradient-primary shadow-glow text-lg py-6 rounded-xl">
            <Clock className="w-5 h-5 mr-2" />
            Clock In
          </Button>
        </div>
      )}

      {/* Navigation - Mobile First Big Buttons */}
      <nav className="flex-1 px-3 pb-4 space-y-3 overflow-y-auto">
        {allNavLinks.map((link) => {
          const IconComponent = iconMap[link.icon];

          return (
            <li key={link.href} className="px-4 py-2">
              <Link 
                href={link.href} 
                onClick={onClose}
                className={`flex items-center group 
                  ${isActive(link.href) ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                  rounded-md p-2 transition-colors duration-200`}
              >
                <IconComponent className={`w-5 h-5 mr-3 
                  ${isActive(link.href) ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            </li>
          );
        })}
      </nav>

      {session?.user && (
        <div className="p-4 border-t border-gray-700 text-sm">
          <p>Logged in as</p>
          <p className="font-semibold">{session.user.name || 'User'}</p>
        </div>
      )}
    </div>
  );
}
