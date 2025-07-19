/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/providers/session-provider';
import { Button } from '@/components/ui/button';
import {
  Menu,
  LogIn,
  UserPlus,
  ChevronDown,
  Crown,
  CheckCircle,
  LogOut,
  LayoutDashboard,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { type UserRole, USER_ROLES } from '@/lib/types';
import { getSessionRoleLabel } from '@/lib/providers/session-provider';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const getNavItems = (userRole: string | undefined) => {
  const baseItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
  ];

  if (userRole) {
    baseItems.push({ name: 'Dashboard', href: '/dashboard' });
  }

  return baseItems;
};

const getRoleIcon = (role: string | undefined) => {
  switch (role?.toUpperCase()) {
  case USER_ROLES.OWNER: return '👑';
  case USER_ROLES.MANAGER: return '📋';
  case USER_ROLES.EMPLOYEE: return '👷';
  case USER_ROLES.ADMIN: return '🛠️';
  case USER_ROLES.TECHNICIAN: return '🔧';
  case USER_ROLES.CLIENT: return '👤';
  default: return '👤';
  }
};

const getRoleLabel = (role: string | undefined) => {
  return getSessionRoleLabel(role as UserRole);
};

export function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();

      if (result.success) {
        toast({
          title: "Signed Out",
          description: "You have been successfully logged out.",
          type: "success",
        });
        router.push('/login');
      } else {
        toast({
          title: "Logout Failed",
          description: result.error || "Unable to sign out. Please try again.",
          type: "destructive",
          icon: <AlertTriangle className="w-4 h-4" />,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred during logout.",
        type: "destructive",
        icon: <AlertTriangle className="w-4 h-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Sign Out
    </Button>
  );
}

const Navbar = () => {
  const { session, signOut } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(getNavItems(session?.role));

  useEffect(() => {
    setNavItems(getNavItems(session?.role));
  }, [session?.role]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.1 } },
  };

  const linkVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, color: "#6366F1" }, // text-primary
    tap: { scale: 0.95 },
  };

  return (
    <motion.nav
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Beta Badge */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold text-gradient">FixFlow</span>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20">
              Beta
            </Badge>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <motion.div key={item.href} variants={linkVariants} whileHover="hover" whileTap="tap">
              <Link
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Authentication & User Actions */}
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center space-x-4">
              {/* User Role & Name */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden md:flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {session.user?.name?.[0] ?? session.user?.email?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {session.user?.name || session.user?.email}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {getRoleLabel(session.role)} 
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass backdrop-blur-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || session.user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="w-full cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async (event) => {
                      event.preventDefault(); // Prevent default link behavior
                      await signOut();
                      window.location.href = '/login'; // Force a full page reload to the login page
                    }}
                    className="cursor-pointer text-red-500 focus:text-red-500"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login" passHref>
                <Button variant="outline" size="sm" asChild>
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </motion.a>
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button size="sm" asChild>
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gradient-primary shadow-sm hover:shadow-md transition-shadow">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </motion.a>
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-md"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <motion.div key={item.href} variants={linkVariants} whileHover="hover" whileTap="tap">
                <Link
                  href={item.href}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}

            {/* Mobile Authentication Actions */}
            {!session && (
              <div className="space-y-2 pt-4 border-t border-border/50">
                <Link href="/login" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button size="sm" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;