"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Removed: import { Session } from '@supabase/supabase-js';

// Supabase Authentication
import { signOut } from '@/lib/supabase/client';

// Shadcn UI imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Lucide Icons
import {
  Menu,
  Bell,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings
} from 'lucide-react';

import { TrialBanner } from '@/components/ui/trial-banner';
import { usePageTitle } from '@/lib/hooks/use-page-title';
import { getNavConfig, iconMap, NavLink, NavConfig } from '@/lib/navigation-utils';
import { CustomSession, UserRole, USER_ROLES } from '@/lib/types';
import MobileSidebar from './_components/MobileSidebar';
import DesktopSidebar from './_components/DesktopSidebar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SessionProvider } from '@/lib/providers/session-provider';
import { cn } from '@/lib/utils';

// Responsive layout variants
const layoutVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
  case USER_ROLES.OWNER: return 'Owner';
  case USER_ROLES.MANAGER: return 'Manager';
  case USER_ROLES.EMPLOYEE: return 'Employee';
  case USER_ROLES.ADMIN: return 'Administrator';
  case USER_ROLES.TECHNICIAN: return 'Technician';
  case USER_ROLES.CLIENT: return 'Client';
  default: return 'User';
  }
};

// Sidebar and content variants remain the same...
const sidebarVariants = {
  open: {
    width: '280px',
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  closed: {
    width: '80px',
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  }
};

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  },
};

function DashboardLayoutContent({
  children,
  session
}: {
  children: ReactNode;
  session: CustomSession;
}): React.ReactElement {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  // Responsive breakpoint tracking
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Tailwind's lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user role from session
  const userRole = session?.user?.role || USER_ROLES.CLIENT;
  const navConfig = getNavConfig(userRole, session?.user?.company);
  const RoleIcon = iconMap[navConfig.icon];

  // Use dynamic page title hook
  usePageTitle(userRole);

  // Prepare props for MobileSidebar and DesktopSidebar
  const allNavLinks = navConfig.links;
  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (!session) return <div>Loading...</div>;

  return (
    <motion.div
      variants={layoutVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex min-h-screen bg-background",
        isMobile ? "flex-col" : "flex-row"
      )}
    >
      {/* Responsive Mobile Header */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 lg:hidden h-16 glass backdrop-blur-xl border-b border-border/50",
          isMobile ? "block" : "hidden"
        )}
      >
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-80 glass backdrop-blur-xl p-0 border-border/50 lg:hidden"
              >
                <MobileSidebar 
                  navConfig={navConfig} 
                  session={session} 
                  userRole={userRole}
                  allNavLinks={allNavLinks}
                  isActive={isActive}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${navConfig.bgColor} rounded-lg flex items-center justify-center`}>
                <RoleIcon className={`w-4 h-4 ${navConfig.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {session?.user?.company?.name || 'FixFlow'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRoleLabel(userRole)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image ?? undefined} alt="User Avatar" />
                    <AvatarFallback className={navConfig.bgColor}>
                      {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass backdrop-blur-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">{session?.user?.name ?? session?.user?.email}</span>
                    <span className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</span>
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
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isDesktopSidebarCollapsed ? "closed" : "open"}
        className={cn(
          "hidden lg:flex flex-col glass backdrop-blur-xl border-r border-border/50 relative z-40",
          isMobile ? "hidden" : "block"
        )}
      >
        <DesktopSidebar
          navConfig={navConfig}
          session={session}
          allNavLinks={allNavLinks}
          isActive={isActive}
          searchQuery=""
          setSearchQuery={() => {}}
          isCollapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        />
      </motion.aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-screen mt-16"
        )}
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Trial Banner */}
      <TrialBanner />
    </motion.div>
  );
}

export default function DashboardClientLayout({
  children,
  session
}: {
  children: ReactNode;
  session: CustomSession;
}) {
  return (
    <ErrorBoundary>
      <SessionProvider> {/* Removed initialSession prop */}
        <DashboardLayoutContent session={session}>
          {children}
        </DashboardLayoutContent>
      </SessionProvider>
    </ErrorBoundary>
  );
} 