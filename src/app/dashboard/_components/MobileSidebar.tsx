"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Clock, Search } from 'lucide-react';
import { iconMap, NavLink, NavConfig, getRoleLabel } from '@/lib/navigation-utils';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { type UserRole, USER_ROLES, CustomSession } from "@/lib/types";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { signOut } from '@/lib/supabase/client';

type MobileSidebarProps = {
  navConfig: NavConfig;
  session: CustomSession | null;
  userRole: UserRole;
  allNavLinks: NavLink[];
  isActive: (href: string) => boolean;
  onClose: () => void;
};

export default function MobileSidebar({
  navConfig,
  session,
  userRole,
  allNavLinks,
  isActive,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const HeaderIcon = iconMap[navConfig.icon];

  const filteredNavLinks = allNavLinks.filter(link => 
    link.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignOut = async () => {
    await signOut();
  };

  const sidebarVariants = {
    hidden: { 
      x: '100%', 
      transition: { 
        type: 'tween', 
        duration: 0.3 
      } 
    },
    visible: { 
      x: 0, 
      transition: { 
        type: 'tween', 
        duration: 0.3 
      } 
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={sidebarVariants}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
    >
      <motion.div 
        className="fixed right-0 top-0 h-full w-full bg-card shadow-2xl flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${navConfig.bgColor} rounded-xl flex items-center justify-center`}>
              <HeaderIcon className={`w-5 h-5 ${navConfig.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {session?.user?.company?.name || 'FixFlow'}
              </div>
              <div className="text-sm text-muted-foreground">{navConfig.title}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm glass border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Quick Clock In/Out for Field Workers */}
        {((userRole === USER_ROLES.EMPLOYEE) || (userRole === USER_ROLES.TECHNICIAN)) && (
          <div className="p-4">
            <Button className="w-full gradient-primary shadow-glow text-base py-5 rounded-xl">
              <Clock className="w-5 h-5 mr-2" />
              Clock In
            </Button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-2">
          <AnimatePresence>
            {filteredNavLinks.map((link, index) => {
              const IconComponent = iconMap[link.icon];
              return (
                <motion.div
                  key={link.href}
                  custom={index}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <Link 
                    href={link.href} 
                    onClick={onClose}
                    className={`flex items-center group rounded-md p-3 transition-all duration-200 
                      ${isActive(link.href) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted/50 text-muted-foreground'}`}
                  >
                    <IconComponent 
                      className={`w-5 h-5 mr-3 
                        ${isActive(link.href) 
                  ? 'text-primary' 
                  : 'text-muted-foreground group-hover:text-foreground'}`} 
                    />
                    <span className="text-sm font-medium">{link.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </nav>

        {/* User Profile & Actions */}
        {session?.user && (
          <div className="p-4 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 px-3 py-2 hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className={navConfig.bgColor}>
                      {session?.user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium truncate">
                      {session?.user?.name ?? session?.user?.email}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {getRoleLabel(userRole)}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass backdrop-blur-xl w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {session?.user?.name ?? session?.user?.email}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getRoleLabel(userRole)}
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
      </motion.div>
    </motion.div>
  );
}
