'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { PlusCircle, Search, Home, Factory, Users, User, Mail, Phone, MapPin, FileText, DollarSign, Loader2, AlertCircle, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { api } from "~/trpc/react";
import { CustomerType, type CustomerWithRelations } from "~/lib/types";
import type { Session } from "next-auth";

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

export default function CustomersPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Get user role for role-based functionality
  const userRole = (session?.user as Session["user"] & { role?: string })?.role ?? "ADMIN";

  // Fetch customers from database
  const { data: customersData, isLoading: customersLoading, error: customersError } = api.customer.getAll.useQuery({
    type: filterType === "all" ? undefined : (filterType as CustomerType),
    search: searchQuery ?? undefined,
    limit: 50,
  });

  // Fetch customer statistics
  const { data: stats, isLoading: statsLoading } = api.customer.getStats.useQuery();

  // Filter customers based on search query (frontend filtering)
  const customers: CustomerWithRelations[] = customersData?.customers ?? [];
  const filteredCustomers = customers.filter((customer: CustomerWithRelations) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.address?.toLowerCase().includes(searchTerm) ||
      customer.city?.toLowerCase().includes(searchTerm)
    );
  });

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

  const HeaderIcon = getHeaderContent().icon;
  const headerTitle = getHeaderContent().title;
  const headerDescription = getHeaderContent().description;
  const headerBgColor = getHeaderContent().bgColor;
  const headerColor = getHeaderContent().color;

  // Loading state
  if (customersLoading || statsLoading) {
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

  // Error state
  if (customersError) {
    return (
      <div className="space-y-6">
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Customers</h3>
            <p className="text-muted-foreground mb-4">
              {customersError.message || "Failed to load customers. Please try again."}
            </p>
            <Button onClick={() => window.location.reload()} className="gradient-primary">
              Try Again
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
      {/* Header */}
      <motion.div
        variants={cardVariants}
        className={`glass rounded-xl p-6 bg-gradient-to-r ${headerBgColor} via-blue-500/5 to-purple-500/10 border border-primary/20`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 ${headerBgColor.replace(
                "from-",
                "bg-",
              )} rounded-xl flex items-center justify-center`}
            >
              <HeaderIcon className={`w-6 h-6 ${headerColor}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                {headerTitle}
              </h1>
              <p className="text-muted-foreground">{headerDescription}</p>
            </div>
          </div>
          {userRole === "ADMIN" && (
            <Button className="gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300">
              <PlusCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Add New Customer
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </h3>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats?.total ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+10%</span> from last month
              </p>
            </CardContent>
          </Card>
          <Card className="glass border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Residential
                </h3>
                <Home className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats?.residential ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+5</span> new this quarter
              </p>
            </CardContent>
          </Card>
          <Card className="glass border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Commercial
                </h3>
                <Factory className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats?.commercial ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-blue-500">+2</span> new this month
              </p>
            </CardContent>
          </Card>
          <Card className="glass border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Industrial
                </h3>
                <Factory className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats?.industrial ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-purple-500">+1</span> new this year
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Customers List */}
      <motion.div variants={cardVariants}>
        <Card className="glass border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gradient">All Customers</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search customers..."
                    className="pl-10 glass bg-muted/20 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] glass bg-muted/20">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent className="glass backdrop-blur-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={CustomerType.RESIDENTIAL}>Residential</SelectItem>
                    <SelectItem value={CustomerType.COMMERCIAL}>Commercial</SelectItem>
                    <SelectItem value={CustomerType.INDUSTRIAL}>Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <DatabaseZap className="w-12 h-12 mx-auto mb-4" />
                <p>No customers found matching your criteria.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCustomers.map((customer: CustomerWithRelations) => {
                const avatarSrc = customer.avatar ?? undefined;
                const fallback = customer.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <motion.div
                    key={customer.id}
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="glass rounded-xl p-5 border border-border/50 hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={avatarSrc}
                          alt={customer.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {fallback}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {customer.type.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {customer.email ?? "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {customer.phone ?? "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {customer.address ?? "N/A"}
                        </span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4 border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        Work Orders:{" "}
                        <span className="font-medium text-foreground">
                          {customer.workOrders?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        Invoices:{" "}
                        <span className="font-medium text-foreground">
                          {customer.invoices?.length ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="glass hover:bg-muted/50">
                        View
                      </Button>
                      {userRole === "ADMIN" && (
                        <>
                          <Button variant="outline" size="sm" className="glass hover:bg-muted/50">
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="glass hover:bg-destructive/10 text-destructive">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass backdrop-blur-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the customer and all related
                                  work orders and invoices.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="glass hover:bg-muted/50">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction className="gradient-primary">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
