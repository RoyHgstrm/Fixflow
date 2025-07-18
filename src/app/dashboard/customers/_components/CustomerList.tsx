'use client';

import { motion } from "framer-motion";
import { Search, Mail, Phone, MapPin, FileText, DollarSign, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ActionButtonGroup, SecondaryActionButton, DestructiveActionButton } from "@/components/ui/action-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerMap } from "@/components/ui/customer-map";
import { CustomerType, type CustomerWithRelations } from "@/lib/types";
import { useRouter } from "next/navigation";

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

interface CustomerListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filteredCustomers: CustomerWithRelations[];
  viewMode: 'list' | 'map';
  userRole: string;
  handleCreateWorkOrder: (customerId: string) => void;
}

export function CustomerList({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filteredCustomers,
  viewMode,
  userRole,
  handleCreateWorkOrder,
}: CustomerListProps) {
  const router = useRouter();

  return (
    <motion.div variants={cardVariants}>
      <Card className="glass border-border/50 border">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:mb-6 sm:flex-row">
            <h2 className="text-gradient w-full text-center text-xl font-bold sm:text-left sm:text-2xl">
              All Customers
            </h2>
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
              <div className="relative w-full">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  className="glass bg-muted/20 w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="glass bg-muted/20 w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="glass backdrop-blur-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={CustomerType.RESIDENTIAL}>
                    Residential
                  </SelectItem>
                  <SelectItem value={CustomerType.COMMERCIAL}>
                    Commercial
                  </SelectItem>
                  <SelectItem value={CustomerType.INDUSTRIAL}>
                    Industrial
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">
              <DatabaseZap className="mx-auto mb-4 h-12 w-12" />
              <p>No customers found matching your criteria.</p>
            </div>
          )}

          {/* Conditional Rendering: Map or List View */}
          {viewMode === "map" ? (
            <CustomerMap
              customers={filteredCustomers}
              height="400px sm:h-[600px]"
              showStats={false}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
                    className="glass border-border/50 hover:border-primary/50 rounded-xl border p-3 transition-all duration-300 sm:p-5"
                  >
                    <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={avatarSrc} alt={customer.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                          {fallback}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-semibold sm:text-lg">
                          {customer.name}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {customer.type.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground mb-3 space-y-1 text-xs sm:mb-4 sm:space-y-2 sm:text-sm">
                      <p className="flex items-center gap-2">
                        <Mail className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="max-w-[200px] truncate">
                          {customer.email ?? "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{customer.phone ?? "N/A"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="max-w-[200px] truncate">
                          {customer.address ?? "N/A"}
                        </span>
                      </p>
                    </div>
                    <div className="text-muted-foreground border-border/50 mb-3 grid grid-cols-2 gap-2 border-t pt-2 text-xs sm:mb-4 sm:pt-4 sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        Work Orders:{" "}
                        <span className="text-foreground font-medium">
                          {customer.workOrders?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <DollarSign className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
                        Invoices:{" "}
                        <span className="font-medium text-foreground">
                          {customer.invoices?.length ?? 0}
                        </span>
                      </div>
                    </div>
                    <ActionButtonGroup
                      spacing="tight"
                      className="flex-col sm:flex-row"
                    >
                      <SecondaryActionButton
                        size="sm"
                        mobileLabel="View"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          router.push(`/dashboard/customers/${customer.id}`);
                        }}
                      >
                        View
                      </SecondaryActionButton>
                      {(userRole === "ADMIN" || userRole === "OWNER") && (
                        <>
                          <SecondaryActionButton
                            size="sm"
                            mobileLabel="Edit"
                            className="w-full sm:w-auto"
                          >
                            Edit
                          </SecondaryActionButton>
                          <SecondaryActionButton
                            size="sm"
                            mobileLabel="Job"
                            className="text-primary hover:text-primary w-full sm:w-auto"
                            onClick={() => {
                              handleCreateWorkOrder(customer.id);
                            }}
                          >
                            Create Job
                          </SecondaryActionButton>
                        </>
                      )}
                    </ActionButtonGroup>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
