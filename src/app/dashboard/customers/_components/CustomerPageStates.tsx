'use client';

import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CustomerPageStatesProps {
  isLoading: boolean;
  error: Error | null;
  handleRefresh: () => Promise<void>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export function CustomerPageStates({
  isLoading,
  error,
  handleRefresh,
}: CustomerPageStatesProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-pink-500/10 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading customers...</span>
        </div>
      </div>
    );
  }

  // Error state with combined error handling
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Customer Data</h3>
            <p className="text-muted-foreground mb-4">
              {error.message || "Failed to load customer information. Please try again."}
            </p>
            <Button onClick={handleRefresh} className="gradient-primary">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
