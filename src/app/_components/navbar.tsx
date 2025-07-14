"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, Settings, LogOut, User, Shield, Wrench, Calendar, FileText, Users, Bell } from "lucide-react";

const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    }
  },
};

const mobileMenuVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: -20,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.2,
    }
  }
};

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

// Role-based navigation items
const getNavItems = (userRole: string | undefined) => {
  const baseItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Calendar, roles: ['admin', 'technician', 'client'] },
  ];

  const adminItems = [
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: FileText, roles: ['admin', 'technician'] },
    { name: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['admin'] },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['admin'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
  ];

  const technicianItems = [
    { name: 'My Jobs', href: '/dashboard/work-orders', icon: Wrench, roles: ['technician'] },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar, roles: ['technician'] },
  ];

  const clientItems = [
    { name: 'My Requests', href: '/dashboard/requests', icon: FileText, roles: ['client'] },
    { name: 'Service History', href: '/dashboard/history', icon: Calendar, roles: ['client'] },
  ];

  // Default to admin role if not specified
  const role = userRole || 'admin';
  let allItems = [...baseItems];
  
  if (role === 'admin') {
    allItems.push(...adminItems);
  } else if (role === 'technician') {
    allItems.push(...technicianItems);
  } else if (role === 'client') {
    allItems.push(...clientItems);
  }

  return allItems.filter(item => item.roles.includes(role));
};

const getRoleIcon = (role: string | undefined) => {
  switch (role) {
    case 'admin': return Shield;
    case 'technician': return Wrench;
    case 'client': return User;
    default: return User;
  }
};

const getRoleLabel = (role: string | undefined) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'technician': return 'Technician';
    case 'client': return 'Client';
    default: return 'User';
  }
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user role from session
  const userRole = (session?.user as any)?.role || 'admin';
  const navItems = getNavItems(userRole);
  const RoleIcon = getRoleIcon(userRole);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  if (status === "loading") {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="w-32 h-8 bg-muted animate-pulse rounded" />
          <div className="w-24 h-8 bg-muted animate-pulse rounded" />
        </div>
      </nav>
    );
  }

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">FixFlow</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          {session?.user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item: any, index: number) => (
                <motion.div
                  key={item.name}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  variants={navItemVariants}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
                  >
                    <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <>
                {/* Notifications (Desktop) */}
                <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 hover:bg-primary/10">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2 py-1 h-auto hover:bg-muted/50 transition-all duration-200">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image ?? undefined} alt="User Avatar" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.user.name?.[0] ?? session.user.email?.[0] ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-medium truncate max-w-32">
                          {session.user.name ?? session.user.email}
                        </span>
                        <div className="flex items-center gap-1">
                          <RoleIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getRoleLabel(userRole)}
                          </span>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass backdrop-blur-xl">
                    <DropdownMenuLabel className="font-medium">
                      <div className="flex flex-col space-y-1">
                        <span>{session.user.name ?? session.user.email}</span>
                        <div className="flex items-center gap-1">
                          <RoleIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getRoleLabel(userRole)}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem className="text-muted-foreground">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-muted-foreground">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem 
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9"
                  onClick={toggleMobileMenu}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gradient-primary shadow-glow">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && session?.user && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden absolute top-full left-0 right-0 glass backdrop-blur-xl border-b border-border/50 shadow-lg"
            >
              <div className="px-4 py-6 space-y-2">
                {navItems.map((item: any, index: number) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-destructive w-full text-left hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}