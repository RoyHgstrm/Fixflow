'use client';

import { useState, type ReactElement } from 'react';
import { useSession } from '@/lib/providers/session-provider';
import { trpc } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PlanType,
  SubscriptionStatus,
  InvoiceStatus
} from '@prisma/client';
import {
  CompanyWithSubscription,
  PaymentMethod,
  Invoice,
  PlanFeatures
} from '@/lib/types';
import { PLAN_CONFIGS } from '@/lib/constants';
import { getTrialDaysRemaining, isTrialEndingSoon, formatTrialEndDate } from '@/lib/utils';
import { User, Users, Building2, Crown, CheckCircle2, ArrowRight, Wallet, ReceiptText, CircleDollarSign, CalendarDays, MoreVertical, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast'; // Added useToast import

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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

export default function BillingPage() {
  const { session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast(); // Initialize useToast

  // Fetch company subscription data
  const { data: companyData, isLoading: companyLoading } = trpc.company.getSubscription.useQuery();
  
  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = trpc.billing.getPaymentMethods.useQuery();
  
  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading } = trpc.billing.getInvoices.useQuery<Invoice[]>();

  // Loading state
  if (companyLoading || paymentMethodsLoading || invoicesLoading) {
    return <div>Loading billing information...</div>;
  }

  const company = companyData ?? {
    planType: PlanType.SOLO,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    trialStartDate: new Date(),
    trialEndDate: new Date(),
    isActive: true,
  };

  const currentPlan: PlanFeatures = PLAN_CONFIGS[company.planType as keyof typeof PLAN_CONFIGS];
  const daysRemaining = getTrialDaysRemaining(company.trialEndDate);
  const isOnTrial = company.subscriptionStatus === SubscriptionStatus.TRIAL;
  const trialEndingSoon = isTrialEndingSoon(company.trialEndDate);

  const handleUpgradePlan = async (planType: PlanType) => {
    setSelectedPlan(planType);
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    setIsUpgrading(true);
    
    try {
      // Upgrade plan
      if (selectedPlan != null) {
        // @ts-ignore: mutateAsync type issue, assuming underlying functionality is correct.
        const result: { success: boolean; message?: string } = await trpc.billing.upgradePlan.mutateAsync({ planType: selectedPlan });
        
        if (result.success) {
          setShowPaymentForm(false);
          setSelectedPlan(null);
          toast({
            title: "Plan Upgraded!",
            description: "Your plan has been successfully upgraded.",
            type: "success",
          });
        } else {
          toast({
            title: "Upgrade Failed",
            description: `Failed to upgrade plan: ${result.message}`,
            type: "destructive",
          });
          console.error('Payment failed:', result.message);
        }
      }
    } catch (error: any) {
      toast({
        title: "Upgrade Error",
        description: `Failed to upgrade plan: ${error.message}`,
        type: "destructive",
      });
      console.error('Payment failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getPlanIcon = (planType: PlanType): React.ElementType => {
    switch (planType) {
    case PlanType.SOLO:
      return User;
    case PlanType.TEAM:
      return Users;
    case PlanType.BUSINESS:
      return Building2;
    case PlanType.ENTERPRISE:
      return Crown;
    default:
      return User;
    }
  };

  const getSubscriptionStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
    case SubscriptionStatus.TRIAL:
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4" /> Trial
      </Badge>;
    case SubscriptionStatus.ACTIVE:
      return <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 rounded-full">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Active
        </Badge>
      </motion.div>;
    case SubscriptionStatus.PAST_DUE:
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Past Due</Badge>;
    case SubscriptionStatus.CANCELLED:
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
    case SubscriptionStatus.EXPIRED:
      return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Expired</Badge>;
    default:
      return <Badge>Unknown</Badge>;
    }
  };

  const getInvoiceStatusBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
    case InvoiceStatus.PAID: return 'bg-green-500/10 text-green-500 border-green-500/20';
    case InvoiceStatus.PENDING: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case InvoiceStatus.OVERDUE: return 'bg-red-500/10 text-red-500 border-red-500/20';
    case InvoiceStatus.DRAFT: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 md:p-8"
    >
      <motion.h1 variants={itemVariants} className="text-4xl font-bold text-foreground mb-6">Billing & Subscription</motion.h1>

      {/* Current Plan Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border border-border/50 p-6">
          <CardHeader className="flex-row items-center justify-between pb-4 px-0 pt-0">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-primary" />
              Your Current Plan
            </CardTitle>
            {getSubscriptionStatusBadge(company.subscriptionStatus)}
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="flex items-center gap-4 mb-4">
              {React.createElement(getPlanIcon(company.planType), { className: "w-10 h-10 text-primary" })}
              <div>
                <p className="text-3xl font-bold text-gradient">{currentPlan.name}</p>
                <p className="text-muted-foreground">{currentPlan.description}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p className="flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-primary" />
                {currentPlan.price > 0 ? `€${currentPlan.price} / month` : 'Custom Pricing'}
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Up to {currentPlan.maxUsers} {currentPlan.maxUsers === 1 ? 'user' : 'users'}
              </p>
              {isOnTrial && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Trial Ends: {formatTrialEndDate(company.trialEndDate)}
                  {trialEndingSoon && ( <span className="ml-2 text-yellow-500 font-medium">(Expires in {daysRemaining} days)</span>)}
                </p>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Plan Features:</h3>
            <ul className="space-y-2 mb-6">
              {currentPlan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button className="w-full gradient-primary shadow-glow">
              Manage Subscription
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Payment Methods Section */}
        <Card className="glass border border-border/50 p-6">
          <CardHeader className="flex-row items-center justify-between pb-4 px-0 pt-0">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Payment Methods
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add New
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {paymentMethods?.length ? (
              <ul className="space-y-4">
                {paymentMethods.map((method: PaymentMethod) => (
                  <motion.li 
                    key={method.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex items-center justify-between glass p-4 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {method.type === 'card' ? (
                        <img 
                          src={`/images/cards/${method.brand?.toLowerCase()}.png`}
                          alt={method.brand ?? 'Card brand'}
                          className="w-10 h-auto"
                        />
                      ) : (
                        <ReceiptText className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium capitalize">{method.brand ?? method.type} ending in {method.last4}</p>
                        {method.expiryMonth && method.expiryYear && (
                          <p className="text-sm text-muted-foreground">Expires {method.expiryMonth}/{method.expiryYear % 100}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && <Badge>Default</Badge>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass backdrop-blur-xl">
                          {!method.isDefault && (
                            <DropdownMenuItem onClick={() => toast({
                              title: "Set as Default",
                              description: "Set as default clicked!",
                              type: "default",
                            })}>
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toast({
                            title: "Remove",
                            description: "Remove clicked!",
                            type: "destructive",
                          })}>
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p>No payment methods added yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowPaymentForm(true)}>
                  Add Your First Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoices Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border border-border/50 p-6">
          <CardHeader className="flex-row items-center justify-between pb-4 px-0 pt-0">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <ReceiptText className="w-6 h-6 text-primary" />
              Recent Invoices
            </CardTitle>
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {invoicesData?.length ? (
              <ul className="space-y-4">
                {invoicesData.map((invoice: Invoice) => (
                  <motion.li 
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex items-center justify-between glass p-4 rounded-lg border border-border/50"
                  >
                    <div>
                      <p className="font-medium">Invoice #{invoice.number || invoice.id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">for {invoice.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{invoice.amount.toFixed(2)}</p>
                      <Badge className={getInvoiceStatusBadgeClass(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <ReceiptText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p>No invoices found for your company.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Selection and Upgrade Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border border-border/50 p-6">
          <CardHeader className="pb-4 px-0 pt-0">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Explore Our Plans
            </CardTitle>
            <p className="text-muted-foreground">Choose the perfect plan for your growing business.</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(PLAN_CONFIGS).map(([planTypeKey, plan]) => (
                <motion.div
                  key={planTypeKey}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className={`glass rounded-xl p-6 border ${company.planType === (planTypeKey as PlanType) ? 'border-primary shadow-lg' : 'border-border/50'} relative flex flex-col justify-between`}
                >
                  <div>
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    
                    <div className="flex items-baseline mb-4">
                      <span className="text-4xl font-bold text-gradient">{plan.price > 0 ? `€${plan.price}` : 'Custom'}</span>
                      {plan.price > 0 && <span className="text-muted-foreground ml-2">/month</span>}
                    </div>

                    <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgradePlan(planTypeKey as PlanType)}
                    disabled={company.planType === (planTypeKey as PlanType) || isUpgrading}
                  >
                    {company.planType === (planTypeKey as PlanType) ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Form Modal/Section (simplified for now) */}
      {showPaymentForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-md glass p-6">
            <CardHeader className="pb-4 px-0 pt-0">
              <CardTitle className="text-2xl font-bold">Confirm Upgrade to {PLAN_CONFIGS[selectedPlan as PlanType]?.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <p className="mb-4">You are about to upgrade to the <span className="font-semibold">{PLAN_CONFIGS[selectedPlan as PlanType]?.name}</span> plan for <span className="font-semibold">€{PLAN_CONFIGS[selectedPlan as PlanType]?.price} / month</span>.</p>
              <Button
                onClick={handlePayment}
                disabled={isUpgrading}
                className="w-full gradient-primary shadow-glow"
              >
                {isUpgrading ? 'Processing...' : 'Confirm Payment & Upgrade'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPaymentForm(false)}
                className="w-full mt-2 glass hover:bg-muted/50"
                disabled={isUpgrading}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Payment Method</DialogTitle>
            <DialogDescription>
              This is a placeholder for adding new payment methods. Integration with a payment gateway (e.g., Stripe) would go here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Card Number" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVC" />
            </div>
            <Input placeholder="Cardholder Name" />
            <Button className="w-full">Save Payment Method</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 