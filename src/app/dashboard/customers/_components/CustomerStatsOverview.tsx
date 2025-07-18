'use client';

import { motion } from "framer-motion";
import { Users, Home, Factory } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerStats } from "@/lib/types";

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

interface CustomerStatsOverviewProps {
  stats: CustomerStats;
}

const renderGrowthValue = (growth: {
  isPositive: boolean;
  value?: number;
  newCustomers?: number;
  period: string;
}) => {
  const growthValue = growth.value ?? growth.newCustomers ?? 0;
  return (
    <span
      className={
        growth.isPositive === true
          ? "text-green-500"
          : "text-red-500"
      }
    >
      {growth.isPositive === true ? "+" : ""}
      {growthValue}%
    </span>
  );
};

export function CustomerStatsOverview({ stats }: CustomerStatsOverviewProps) {
  return (
    <motion.div variants={cardVariants}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {[
          {
            title: "Total Customers",
            value: stats?.totalCustomers ?? 0,
            icon: Users,
            growth: stats?.growth?.total ?? { isPositive: true, value: 0, period: 'month' },
          },
          {
            title: "Residential",
            value: stats?.residential ?? 0,
            icon: Home,
            growth: stats?.growth?.residential ?? { isPositive: true, newCustomers: 0, period: 'quarter' },
          },
          {
            title: "Commercial",
            value: stats?.commercial ?? 0,
            icon: Factory,
            growth: stats?.growth?.commercial ?? { isPositive: true, newCustomers: 0, period: 'month' },
          },
          {
            title: "Industrial",
            value: stats?.industrial ?? 0,
            icon: Factory,
            growth: stats?.growth?.industrial ?? { isPositive: true, newCustomers: 0, period: 'year' },
          },
        ].map(({ title, value, icon: Icon, growth }) => (
          <Card
            key={title}
            className="glass border-border/50 border p-3 sm:p-6"
          >
            <CardContent className="space-y-2 p-0">
              <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-medium sm:text-sm">
                  {title}
                </h3>
                <Icon className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-lg font-bold sm:text-2xl">{value}</div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">
                {renderGrowthValue(growth)}{" "}
                from last {growth.period || "month"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
