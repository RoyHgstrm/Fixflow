import { useState } from "react";
import { api } from "@/trpc/react";
import { CustomerType, CustomerStats, type CustomerWithRelations } from "@/lib/types";

export function useCustomerData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { 
    data: customersData, 
    isLoading: customersLoading, 
    error: customersError, 
    refetch: refetchCustomers 
  } = api.customer.list.useQuery({
    type: filterType === "all" ? undefined : (filterType as CustomerType),
    search: searchQuery ?? undefined,
    limit: 50,
  }, {
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = api.customer.getStats.useQuery(undefined, {
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const isLoading = customersLoading || statsLoading;
  const error = customersError || statsError;

  const handleRefresh = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchStats(),
    ]);
  };

  const customers: CustomerWithRelations[] = customersData?.items ?? [];
  const filteredCustomers = customers.filter((customer: CustomerWithRelations) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm)) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm))
    );
  });

  const safeStats: CustomerStats = {
    totalCustomers: stats?.totalCustomers ?? 0,
    newCustomers: stats?.newCustomers ?? 0,
    customersWithActiveWorkOrders: stats?.customersWithActiveWorkOrders ?? 0,
    averageWorkOrdersPerCustomer: stats?.averageWorkOrdersPerCustomer ?? 0,
    total: stats?.total ?? 0,
    residential: stats?.residential ?? 0,
    commercial: stats?.commercial ?? 0,
    industrial: stats?.industrial ?? 0,
    growth: {
      total: {
        isPositive: stats?.growth?.total?.isPositive === true,
        value: stats?.growth?.total?.value ?? 0,
        period: stats?.growth?.total?.period ?? 'month',
      },
      residential: {
        isPositive: stats?.growth?.residential?.isPositive === true,
        newCustomers: stats?.growth?.residential?.newCustomers ?? 0,
        period: stats?.growth?.residential?.period ?? 'quarter',
      },
      commercial: {
        isPositive: stats?.growth?.commercial?.isPositive === true,
        newCustomers: stats?.growth?.commercial?.newCustomers ?? 0,
        period: stats?.growth?.commercial?.period ?? 'month',
      },
      industrial: {
        isPositive: stats?.growth?.industrial?.isPositive === true,
        newCustomers: stats?.growth?.industrial?.newCustomers ?? 0,
        period: stats?.growth?.industrial?.period ?? 'year',
      },
    },
  };

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    viewMode,
    customersData,
    customersLoading,
    customersError,
    refetchCustomers,
    stats,
    statsLoading,
    statsError,
    refetchStats,
    isLoading,
    error,
    handleRefresh,
    filteredCustomers,
    safeStats,
  };
}
