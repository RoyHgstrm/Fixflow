"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from "react";
import { UserRole } from "@/lib/types";
import { ChevronLeft, ChevronRight, Search, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { iconMap, NavLink, NavConfig } from '@/lib/navigation-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getRoleLabel } from '@/lib/navigation-utils';
import { CustomSession } from '@/lib/providers/session-provider';
import { signOut } from '@/lib/supabase/client';

type DesktopSidebarProps = {
  navConfig: NavConfig;
  session: CustomSession | null;
  allNavLinks: NavLink[];
  isActive: (href: string) => boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export default function DesktopSidebar({
  navConfig,
  session,
  allNavLinks,
  isActive,
  searchQuery,
  setSearchQuery,
  isCollapsed,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div
      className={`
        fixed left-0 top-0 h-full shadow-lg transition-all duration-300 hidden md:block
        ${isCollapsed ? "w-16" : "w-64"} ${navConfig.bgColor}
      `}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white">{navConfig.title}</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 transition-colors hover:text-white"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass bg-muted/20 w-full rounded-lg border border-border/50 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {allNavLinks.map((link) => {
              const Icon = iconMap[link.icon];

              return (
                <li key={link.href} className="px-4 py-2">
                  <Link
                    href={link.href}
                    className={`group flex items-center rounded-md p-2 transition-colors duration-200 ${isActive(link.href) ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${isActive(link.href) ? "text-white" : "text-gray-500 group-hover:text-white"}`}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{link.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {session?.user && (
          <div className="border-gray-700 p-4 border-t text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`h-auto w-full justify-start gap-3 rounded-xl px-4 py-3 hover:bg-muted/50 ${isCollapsed ? "px-3" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className={navConfig.bgColor}>
                      {session?.user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">
                        {session?.user?.name ?? session?.user?.email}
                      </div>
                      <div className="capitalize text-muted-foreground text-xs">
                        {getRoleLabel(session.user.role as UserRole)}
                      </div>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass backdrop-blur-xl w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {session?.user?.name ?? session?.user?.email}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getRoleLabel(session.user.role as UserRole)}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="w-full cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="w-full cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}