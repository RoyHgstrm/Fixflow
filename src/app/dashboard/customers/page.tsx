'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Users, User, AlertCircle, Loader2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { usePageTitle } from "@/lib/hooks/use-page-title";
import { CustomerType, CustomerStats, type CustomerWithRelations } from "@/lib/types";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";

import { CustomerHeader } from "./_components/CustomerHeader";
import { CustomerStatsOverview } from "./_components/CustomerStatsOverview";
import { CustomerList } from "./_components/CustomerList";
import { CustomerPageStates } from "./_components/CustomerPageStates";
import { useCustomerData } from "@/lib/hooks/useCustomerData";
import { CustomerDialogs } from "./_components/CustomerDialogs";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { api } from "@/trpc/react";

// Extend CustomerWithRelations to include optional city
type ExtendedCustomerWithRelations = CustomerWithRelations & {
  city?: string;
};

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

export default function CustomersPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [showCreateWorkOrderDialog, setShowCreateWorkOrderDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();

  const router = useRouter();

  // Get user role for role-based functionality
  const userRole = session?.user?.role ?? "ADMIN";
  
  // Set dynamic page title
  usePageTitle(userRole);

  // Fetch customers from database with improved error handling
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    error: customersError, 
    refetch: refetchCustomers 
  } = api.customer.list.useQuery({
    search: searchQuery ?? undefined,
    limit: 50,
  }, {
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch customer statistics with improved error handling
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = api.customer.getStats.useQuery(undefined, {
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Combine loading and error states
  const isLoading = customersLoading || statsLoading;
  const error = customersError || statsError;

  // Refresh function for after creating customers
  const handleRefresh = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchStats(),
    ]);
  };

  // Handle create work order for specific customer
  const handleCreateWorkOrder = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowCreateWorkOrderDialog(true);
  };

  // Filter customers based on search query (frontend filtering)
  const customers: ExtendedCustomerWithRelations[] = customersData?.items ?? [];
  const filteredCustomers = customers.filter((customer: ExtendedCustomerWithRelations) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm)) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm))
    );
  });

  // Ensure type safety for stats
  const safeStats: CustomerStats = {
    totalCustomers: statsData?.totalCustomers ?? 0,
    newCustomers: statsData?.newCustomers ?? 0,
    customersWithActiveWorkOrders: statsData?.customersWithActiveWorkOrders ?? 0,
    averageWorkOrdersPerCustomer: statsData?.averageWorkOrdersPerCustomer ?? 0,
    total: statsData?.total ?? 0,
    residential: statsData?.residential ?? 0,
    commercial: statsData?.commercial ?? 0,
    industrial: statsData?.industrial ?? 0,
    growth: {
      total: {
        isPositive: statsData?.growth?.total?.isPositive === true,
        value: statsData?.growth?.total?.value ?? 0,
        period: statsData?.growth?.total?.period ?? 'month',
      },
      residential: {
        isPositive: statsData?.growth?.residential?.isPositive === true,
        newCustomers: statsData?.growth?.residential?.newCustomers ?? 0,
        period: statsData?.growth?.residential?.period ?? 'quarter',
      },
      commercial: {
        isPositive: statsData?.growth?.commercial?.isPositive === true,
        newCustomers: statsData?.growth?.commercial?.newCustomers ?? 0,
        period: statsData?.growth?.commercial?.period ?? 'month',
      },
      industrial: {
        isPositive: statsData?.growth?.industrial?.isPositive === true,
        newCustomers: statsData?.growth?.industrial?.newCustomers ?? 0,
        period: statsData?.growth?.industrial?.period ?? 'year',
      },
    },
  };

  // Role-based header content
  const getHeaderContent = () => {
    switch (userRole) {
      case "ADMIN":
        return {
          title: "Customer Management",
          description:
            "View and manage all customer accounts, their work orders, and invoices.",
          icon: Users,
          bgColor: "from-blue-500/10",
          color: "text-blue-500",
        };
      case "TECHNICIAN":
        return {
          title: "My Customers",
          description: "View customers assigned to your work orders.",
          icon: Users,
          bgColor: "from-green-500/10",
          color: "text-green-500",
        };
      case "CLIENT":
        return {
          title: "My Profile",
          description: "Manage your personal information and service history.",
          icon: User,
          bgColor: "from-purple-500/10",
          color: "text-purple-500",
        };
      default:
        return {
          title: "Customers",
          description: "Manage customer information.",
          icon: Users,
          bgColor: "from-blue-500/10",
          color: "text-blue-500",
        };
    }
  };

  const headerContent = getHeaderContent();
  const HeaderIcon = headerContent.icon;
  const headerTitle = headerContent.title;
  const headerDescription = headerContent.description;
  const headerBgColor = headerContent.bgColor ?? "from-blue-500/10";
  const headerColor = headerContent.color;

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <CustomerHeader
        headerTitle={headerTitle}
        headerDescription={headerDescription}
        headerBgColor={headerBgColor}
        headerColor={headerColor}
        HeaderIcon={HeaderIcon}
        viewMode={viewMode}
        setViewMode={setViewMode}
        userRole={userRole}
        setShowCreateCustomerDialog={setShowCreateCustomerDialog}
      />

      <CustomerStatsOverview stats={safeStats} />

      <CustomerList 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filteredCustomers={filteredCustomers}
        viewMode={viewMode}
        userRole={userRole}
        handleCreateWorkOrder={handleCreateWorkOrder}
      />

      <CustomerDialogs 
        showCreateCustomerDialog={showCreateCustomerDialog}
        showCreateWorkOrderDialog={showCreateWorkOrderDialog}
        selectedCustomerId={selectedCustomerId}
        onCreateCustomerDialogClose={() => setShowCreateCustomerDialog(false)}
        onCreateWorkOrderDialogClose={() => {
          setShowCreateWorkOrderDialog(false);
          setSelectedCustomerId(undefined);
        }}
        onRefresh={handleRefresh}
      />
    </motion.div>
  );
}