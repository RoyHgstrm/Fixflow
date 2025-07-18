'use client';

import { motion } from "framer-motion";
import { PlusCircle, Users, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryActionButton } from "@/components/ui/action-button";
import { type Session } from "next-auth";

const cardVariants = {
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

interface CustomerHeaderProps {
  headerTitle: string;
  headerDescription: string;
  headerBgColor: string;
  headerColor: string;
  HeaderIcon: any; // TODO: Replace with specific LucideIcon type
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  userRole: string;
  setShowCreateCustomerDialog: (show: boolean) => void;
}

export function CustomerHeader({
  headerTitle,
  headerDescription,
  headerBgColor,
  headerColor,
  HeaderIcon,
  viewMode,
  setViewMode,
  userRole,
  setShowCreateCustomerDialog,
}: CustomerHeaderProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={`glass rounded-xl bg-gradient-to-r p-4 sm:p-6 ${headerBgColor} border-primary/20 border via-blue-500/5 to-purple-500/10`}
    >
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex w-full items-center gap-3 sm:gap-4">
          <div
            className={`h-10 w-10 sm:h-12 sm:w-12 ${headerBgColor.replace(
              "from-",
              "bg-",
            )} flex items-center justify-center rounded-xl`}
          >
            <HeaderIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${headerColor}`} />
          </div>
          <div>
            <h1 className="text-gradient text-xl font-bold sm:text-2xl md:text-3xl">
              {headerTitle}
            </h1>
            <p className="text-muted-foreground hidden text-xs sm:block sm:text-sm">
              {headerDescription}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {/* View Toggle */}
          <div className="bg-background/50 flex w-full justify-between gap-2 rounded-lg p-1 sm:w-auto">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("list");
              }}
              className="flex-1 px-2 sm:flex-none sm:px-4"
            >
              <Users className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">List</span>
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("map");
              }}
              className="flex-1 px-2 sm:flex-none sm:px-4"
            >
              <MapIcon className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Map</span>
            </Button>
          </div>
          {(userRole === "ADMIN" || userRole === "OWNER") && (
            <PrimaryActionButton
              icon={PlusCircle}
              mobileLabel="Add"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowCreateCustomerDialog(true);
              }}
            >
              <span className="hidden sm:inline">Add New Customer</span>
              <span className="sm:hidden">Add</span>
            </PrimaryActionButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}
