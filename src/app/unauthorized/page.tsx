"use client";

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 rounded-lg glass backdrop-blur-xl border border-border/50 max-w-md">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Unauthorized Access
        </h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access this page. 
          Please contact your system administrator if you believe this is an error.
        </p>
        <div className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/login">
              Log In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 