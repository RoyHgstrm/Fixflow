'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/lib/providers/session-provider';
import { 
  DollarSign, 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Send, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  Receipt,
  Loader2,
  Shield,
  User,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PrimaryActionButton, SecondaryActionButton, ActionButtonGroup } from '@/components/ui/action-button';
import { api } from "@/trpc/react";
import type { InvoiceStatus} from '@/lib/types';
import { type InvoiceWithRelations } from '@/lib/types';
import { usePageTitle } from "@/lib/hooks/use-page-title";

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

const invoiceStatuses = ['All', 'DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

const getStatusColor = (status: string) => {
  switch (status) {
  case 'PAID': return 'text-green-500 bg-green-500/10 border-green-500/20';
  case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  case 'OVERDUE': return 'text-red-500 bg-red-500/10 border-red-500/20';
  case 'DRAFT': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  case 'CANCELLED': return 'text-red-600 bg-red-600/10 border-red-600/20';
  default: return 'text-muted-foreground bg-muted/10 border-border/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
  case 'PAID': return CheckCircle;
  case 'PENDING': return Clock;
  case 'OVERDUE': return AlertCircle;
  case 'DRAFT': return FileText;
  case 'CANCELLED': return XCircle;
  default: return Receipt;
  }
};

export default function InvoicesPage() {
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Get user role for role-based functionality
  const userRole = (session?.user?.role as "ADMIN" | "CLIENT" | "TECHNICIAN") ?? 'ADMIN';
  
  // Set dynamic page title
  usePageTitle(userRole);

  // Fetch invoices from database
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = api.invoice.getAll.useQuery({
    status: selectedStatus === 'All' ? undefined : selectedStatus as InvoiceStatus,
    search: searchQuery || undefined,
    limit: 50,
  });

  // Fetch invoice statistics
  const { data: stats, isLoading: statsLoading } = api.invoice.getStats.useQuery();

  // Get filtered invoices
  const invoices = invoicesData?.invoices ?? [];

  // Role-based header content
  const getHeaderContent = () => {
    switch (userRole) {
    case 'ADMIN':
      return {
        title: 'Invoice Management',
        description: 'Manage billing and track payments across your organization',
        icon: Shield,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
    case 'CLIENT':
      return {
        title: 'My Invoices',
        description: 'View and track your service invoices and payments',
        icon: User,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      };
    default:
      return {
        title: 'Invoices',
        description: 'Invoice and payment management',
        icon: Receipt,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
    }
  };

  const headerContent = getHeaderContent();
  const HeaderIcon = headerContent.icon;

  // Loading state
  if (invoicesLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading invoices...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (invoicesError) {
    return (
      <div className="space-y-6">
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Invoices</h3>
            <p className="text-muted-foreground mb-4">
              {invoicesError.message || 'Failed to load invoices. Please try again.'}
            </p>
            <Button 
              onClick={() => { window.location.reload(); }} 
              className="gradient-primary"
            >
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
      {/* Header Section */}
      <motion.div variants={cardVariants} className="glass rounded-xl p-6 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${headerContent.bgColor} rounded-xl flex items-center justify-center`}>
              <HeaderIcon className={`w-6 h-6 ${headerContent.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">{headerContent.title}</h1>
              <p className="text-muted-foreground">{headerContent.description}</p>
            </div>
          </div>
          
          {userRole === 'ADMIN' && (
            <ActionButtonGroup spacing="normal">
              <SecondaryActionButton 
                icon={Download}
                mobileLabel="Export"
              >
                Export
              </SecondaryActionButton>
              <PrimaryActionButton 
                icon={PlusCircle}
                mobileLabel="Create"
              >
                Create Invoice
              </PrimaryActionButton>
            </ActionButtonGroup>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-emerald-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                  <p className="text-xs text-emerald-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active billing
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Receipt className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-yellow-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending ?? 0}</p>
                  <p className="text-xs text-yellow-500 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Awaiting payment
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-red-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overdue</p>
                  <p className="text-2xl font-bold">{stats?.overdue ?? 0}</p>
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Needs attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-green-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold">{stats?.paid ?? 0}</p>
                  <p className="text-xs text-green-500 flex items-center mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-blue-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">€{(stats?.totalAmount ?? 0).toLocaleString("de-DE")}</p>
                  <p className="text-xs text-blue-500 flex items-center mt-1">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Revenue tracking
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div variants={cardVariants} className="glass rounded-xl p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="pl-10 pr-4 py-2 glass rounded-lg border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {invoiceStatuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedStatus(status); }}
                  className={selectedStatus === status ? 
                    "gradient-primary shadow-glow" : 
                    "glass hover:bg-primary/5"
                  }
                >
                  {status === 'All' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </motion.div>

      {/* Invoices List */}
      <motion.div variants={cardVariants} className="space-y-4">
        {invoices.length === 0 ? (
          <Card className="glass border border-border/50">
            <CardContent className="p-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Invoices Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedStatus !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first invoice.'
                }
              </p>
              {userRole === 'ADMIN' && (
                <Button className="gradient-primary shadow-glow">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice: InvoiceWithRelations, index: number) => {
            const StatusIcon = getStatusIcon(invoice.status);
            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card className="glass hover:shadow-glow transition-all duration-300 border border-border/50 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Main Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {invoice.number}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-emerald-500">
                            €{invoice.amount.toFixed(2)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{invoice.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
                          </div>
                          {invoice.dueDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {invoice.workOrder && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>Job: {invoice.workOrder.title}</span>
                            </div>
                          )}
                        </div>

                        {invoice.notes && (
                          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        
                        {userRole === 'ADMIN' && (
                          <>
                            <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </Button>

                            {invoice.status === 'DRAFT' && (
                              <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                                <Send className="w-4 h-4 mr-2" />
                                Send
                              </Button>
                            )}
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass backdrop-blur-xl">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Email PDF
                            </DropdownMenuItem>
                            {userRole === 'ADMIN' && invoice.status === 'PENDING' && (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
