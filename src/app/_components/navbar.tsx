"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/providers/session-provider';
import { Button } from '@/components/ui/button';
import {
  Menu,
  LogIn,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { getSessionRoleLabel } from '@/lib/providers/session-provider';

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
    case UserRole.OWNER: return '👑';
    case UserRole.MANAGER: return '📋';
    case UserRole.EMPLOYEE: return '👷';
    case UserRole.ADMIN: return '🛠️';
    case UserRole.TECHNICIAN: return '🔧';
    case UserRole.CLIENT: return '👤';
    default: return '👤';
  }
};

const getRoleLabel = (role: string | undefined) => {
  return getSessionRoleLabel(role as UserRole);
};

const Navbar = () => {
  const { session, signOut } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(getNavItems(session?.role));

  // Update nav items when session changes
  useEffect(() => {
    setNavItems(getNavItems(session?.role));
  }, [session?.role]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-foreground">FixFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Authentication & User Actions */}
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center space-x-4">
              {/* User Role & Name */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-2xl">{getRoleIcon(session.role)}</span>
                <div>
                  <div className="text-sm font-medium">
                    {session.user?.name || session.user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getRoleLabel(session.role)}
                  </div>
                </div>
              </div>

              {/* Dashboard & Logout Actions */}
              <div className="flex items-center space-x-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;