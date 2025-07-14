'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Users, FileText, DollarSign, Settings, LogOut, Bell, Search, Shield, Wrench, User, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Role-based navigation configuration
const getNavConfig = (userRole: string) => {
  const baseConfig = {
    admin: {
      title: 'Admin Dashboard',
      description: 'Full system management and analytics',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      links: [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, description: 'System overview and metrics' },
        { name: 'Work Orders', href: '/dashboard/work-orders', icon: FileText, description: 'Manage all work orders' },
        { name: 'Customers', href: '/dashboard/customers', icon: Users, description: 'Customer management' },
        { name: 'Invoices', href: '/dashboard/invoices', icon: DollarSign, description: 'Billing and invoicing' },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'System configuration' },
      ]
    },
    technician: {
      title: 'Technician Dashboard',
      description: 'Job management and field operations',
      icon: Wrench,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      links: [
        { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Your daily overview' },
        { name: 'My Jobs', href: '/dashboard/work-orders', icon: FileText, description: 'Assigned work orders' },
        { name: 'Schedule', href: '/dashboard/schedule', icon: LayoutDashboard, description: 'Your work schedule' },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Personal settings' },
      ]
    },
    client: {
      title: 'Client Portal',
      description: 'Service requests and communication',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      links: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Your service overview' },
        { name: 'My Requests', href: '/dashboard/requests', icon: FileText, description: 'Service requests' },
        { name: 'History', href: '/dashboard/history', icon: LayoutDashboard, description: 'Service history' },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Account settings' },
      ]
    }
  };

  return baseConfig[userRole as keyof typeof baseConfig] || baseConfig.admin;
};

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Get user role from session
  const userRole = (session?.user as any)?.role || 'admin';
  const navConfig = getNavConfig(userRole);
  const RoleIcon = navConfig.icon;

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  // Auto-collapse sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Filter navigation items based on search
  const filteredNavLinks = navConfig.links.filter(link => 
    link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        <div className="hidden lg:flex w-72 glass border-r border-border/50">
          <div className="flex flex-col w-full p-6 space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden h-16 glass backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 glass backdrop-blur-xl p-0 border-border/50">
                <MobileSidebar 
                  navConfig={navConfig}
                  filteredNavLinks={filteredNavLinks}
                  isActive={isActive}
                  session={session}
                  userRole={userRole}
                  RoleIcon={RoleIcon}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${navConfig.bgColor} rounded-lg flex items-center justify-center`}>
                <RoleIcon className={`w-4 h-4 ${navConfig.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium">FixFlow</div>
                <div className="text-xs text-muted-foreground">{userRole}</div>
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
                    <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isDesktopSidebarCollapsed ? "closed" : "open"}
        className="hidden lg:flex flex-col glass backdrop-blur-xl border-r border-border/50 relative z-40"
      >
        <DesktopSidebar
          navConfig={navConfig}
          filteredNavLinks={filteredNavLinks}
          isActive={isActive}
          session={session}
          userRole={userRole}
          RoleIcon={RoleIcon}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isCollapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <motion.main
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6 overflow-hidden"
        >
          <div className="max-w-[1400px] mx-auto mt-16">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}

// Mobile Sidebar Component
function MobileSidebar({ 
  navConfig, 
  filteredNavLinks, 
  isActive, 
  session, 
  userRole, 
  RoleIcon, 
  searchQuery, 
  setSearchQuery,
  onClose 
}: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${navConfig.bgColor} rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 sm:w-12 sm:h-12`}>
            <RoleIcon className={`w-5 h-5 ${navConfig.color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-gradient">FixFlow</div>
            <div className="text-xs text-muted-foreground">{navConfig.title}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm glass rounded-lg border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
        {filteredNavLinks.map((link: any, index: number) => (
          <motion.div
            key={link.name}
            initial="hidden"
            animate="visible"
            custom={index}
            variants={navItemVariants}
            className="w-full"
          >
            <Link
              href={link.href}
              onClick={onClose}
              className={`flex items-center w-full gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group 
                ${isActive(link.href) 
                  ? `${navConfig.bgColor} ${navConfig.color} border border-primary/20 shadow-glow` 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left
              `}
            >
              <link.icon className="h-5 w-5 flex-shrink-0 mb-2 sm:mb-0 sm:mr-3" />
              <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="font-medium text-sm sm:text-base">{link.name}</div>
                <div className="text-xs text-muted-foreground truncate hidden sm:block">
                  {link.description}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl glass">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className={navConfig.bgColor}>
              {session?.user?.name?.[0] ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{session?.user?.name ?? session?.user?.email}</div>
            <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop Sidebar Component
function DesktopSidebar({ 
  navConfig, 
  filteredNavLinks, 
  isActive, 
  session, 
  userRole, 
  RoleIcon, 
  searchQuery, 
  setSearchQuery,
  isCollapsed,
  onToggleCollapse 
}: any) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 mt-16">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${navConfig.bgColor} rounded-xl flex items-center justify-center`}>
              <RoleIcon className={`w-5 h-5 ${navConfig.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-gradient">FixFlow</div>
              <div className="text-xs text-muted-foreground">{navConfig.title}</div>
            </div>
          </div>
        ) : (
          <div>
            <RoleIcon className={`w-5 h-5 ${navConfig.color}`} />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="h-8 w-8 hover:bg-muted/50"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm glass rounded-lg border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
        {filteredNavLinks.map((link: any, index: number) => (
          <motion.div
            key={link.name}
            initial="hidden"
            animate="visible"
            custom={index}
            variants={navItemVariants}
          >
            <Link
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative 
                w-full sm:max-w-full ${
                isActive(link.href) 
                  ? `${navConfig.bgColor} ${navConfig.color} border border-primary/20 shadow-glow` 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title={isCollapsed ? `${link.name} - ${link.description}` : undefined}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <div className={`flex-1 min-w-0 ${isCollapsed ? 'hidden' : 'block'}`}>
                <div className="font-medium">{link.name}</div>
                <div className="text-xs text-muted-foreground truncate">{link.description}</div>
              </div>
              {isActive(link.href) && (
                <motion.div
                  layoutId="activeIndicator"
                  className={`absolute ${isCollapsed ? 'right-7.5' : 'right-3'} w-2 h-2 bg-primary rounded-full`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 rounded-xl px-4 py-3 h-auto hover:bg-muted/50 ${isCollapsed ? 'px-3' : ''}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className={navConfig.bgColor}>
                  {session?.user?.name?.[0] ?? 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">{session?.user?.name ?? session?.user?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "start"} className="w-56 glass backdrop-blur-xl">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">{session?.user?.name ?? session?.user?.email}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
