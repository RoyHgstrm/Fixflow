'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  Users,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Crown,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLAN_CONFIGS, PlanType } from '@/lib/types';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types';

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

interface SignupFormData {
  // Personal info
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Company info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  
  // Selected plan
  selectedPlan: PlanType;
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();

  // Initialize form data with plan from URL if provided
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    selectedPlan: PlanType.TEAM // Default to most popular
  });

  // Set initial plan from URL parameter
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && Object.values(PlanType).includes(planParam.toUpperCase() as PlanType)) {
      setFormData(prev => ({
        ...prev,
        selectedPlan: planParam.toUpperCase() as PlanType
      }));
    }
  }, [searchParams]);

  const updateFormData = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const handlePlanSelect = (plan: PlanType) => {
    setFormData(prev => ({ ...prev, selectedPlan: plan }));
    setCurrentStep(2);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.fullName.trim().length > 0 &&
          formData.email.trim().length > 0 &&
          formData.password.length >= 6 && // Example: Minimum password length
          formData.password === formData.confirmPassword
        );
      case 2:
        return (
          formData.companyName.trim().length > 0 &&
          formData.companyEmail.trim().length > 0 &&
          formData.companyPhone.trim().length > 0
        );
      case 3:
        return formData.selectedPlan !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            company_email: formData.companyEmail,
            company_phone: formData.companyPhone,
            selected_plan: formData.selectedPlan,
            role: UserRole.OWNER, // Default role for the first user of a company
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // After successful sign-up and user creation in Supabase,
        // insert or update the user and company in your Prisma database
        console.log("Supabase user created:", data.user);

        // Call the new API route to ensure server-side cookies are set
        const refreshResponse = await fetch('/api/auth/refresh-session');
        const refreshData = await refreshResponse.json();

        if (refreshData.success) {
          console.log("SignupClient: Server session refreshed successfully.");
          // Redirect to dashboard after successful signup and session refresh
          router.push('/dashboard');
        } else {
          console.error("SignupClient: Server session refresh failed:", refreshData.message);
          setError(refreshData.message);
          setIsLoading(false);
        }
      } else {
        setError('An unexpected error occurred during signup.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const selectedPlanConfig = PLAN_CONFIGS[formData.selectedPlan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold text-gradient">FixFlow</span>
        </Link>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Already have an account?</span>
          <Link href="/login">
            <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto w-full px-6 mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step <= currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 sm:w-24 h-1 mx-2 transition-colors ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Choose Plan</span>
          <span>Your Details</span>
          <span>Company Info</span>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex items-center justify-center px-6 pb-12"
      >
        <div className="w-full max-w-4xl">
          {/* Step 1: Plan Selection */}
          {currentStep === 1 && (
            <motion.div variants={cardVariants} className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">
                  Choose Your <span className="text-gradient">Perfect Plan</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Start with a 14-day free trial. No credit card required.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(PLAN_CONFIGS).map(([planType, plan]) => (
                  <motion.div
                    key={planType}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                    onClick={() => { handlePlanSelect(planType as PlanType); }}
                  >
                    <Card className={`glass transition-all duration-300 hover:shadow-glow h-full min-h-[380px] ${
                      formData.selectedPlan === planType ? 'border-primary/50 shadow-glow' : 'border-border/50'}
                    ${plan.isPopular ? 'relative' : ''}`}>
                      {plan.isPopular && (
                        <div className="absolute z-10 -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-2">
                          {planType === PlanType.SOLO && <User className="w-8 h-8 text-blue-500" />}
                          {planType === PlanType.TEAM && <Users className="w-8 h-8 text-green-500" />}
                          {planType === PlanType.BUSINESS && <Building2 className="w-8 h-8 text-purple-500" />}
                          {planType === PlanType.ENTERPRISE && <Crown className="w-8 h-8 text-yellow-500" />}
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                      </CardHeader>
                      
                      <CardContent className="pt-0 flex flex-col justify-between h-full">
                        <div className="text-center flex-grow flex flex-col justify-center">
                          {plan.price > 0 ? (
                            <div>
                              <span className="text-2xl font-bold text-gradient">{plan.price}€</span>
                              <span className="text-muted-foreground text-sm">/month</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-gradient">Custom</span>
                          )}
                          {plan.maxUsers > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Up to {plan.maxUsers} {plan.maxUsers === 1 ? 'user' : 'users'}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          className={`w-full mt-4 ${formData.selectedPlan === planType || plan.isPopular ? 'gradient-primary' : ''}`}
                          variant={formData.selectedPlan === planType || plan.isPopular ? 'default' : 'outline'}
                        >
                          {planType === PlanType.ENTERPRISE ? 'Contact Sales' : 'Start 14-Day Trial'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  All plans include a 14-day free trial. You can change plans anytime.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <motion.div variants={cardVariants} className="max-w-md mx-auto">
              <Card className="glass border border-border/50">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Create Your Account</CardTitle>
                  <p className="text-muted-foreground">
                    You'll be the owner of your {selectedPlanConfig.name} workspace
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => { updateFormData('fullName', e.target.value); }}
                      className="glass"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => { updateFormData('email', e.target.value); }}
                      className="glass"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => { updateFormData('password', e.target.value); }}
                      className="glass"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => { updateFormData('confirmPassword', e.target.value); }}
                      className="glass"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleBack}
                      className="glass hover:bg-muted/50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleNext}
                      className="flex-1 gradient-primary shadow-glow"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Company Information */}
          {currentStep === 3 && (
            <motion.div variants={cardVariants} className="max-w-md mx-auto">
              <Card className="glass border border-border/50">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Company Information</CardTitle>
                  <p className="text-muted-foreground">
                    Set up your {selectedPlanConfig.name} workspace
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Selected Plan Summary */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedPlanConfig.name} Plan</span>
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <Sparkles className="w-3 h-3" />
                        14-day trial
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlanConfig.description}
                    </p>
                    <div className="mt-2 text-sm">
                      <span className="font-semibold">
                        {selectedPlanConfig.price > 0 ? `€${selectedPlanConfig.price}/month` : 'Custom pricing'}
                      </span>
                      {selectedPlanConfig.maxUsers > 0 && (
                        <span className="text-muted-foreground ml-2">
                          • Up to {selectedPlanConfig.maxUsers} {selectedPlanConfig.maxUsers === 1 ? 'user' : 'users'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Your Company Name"
                      value={formData.companyName}
                      onChange={(e) => { updateFormData('companyName', e.target.value); }}
                      className="glass"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      placeholder="info@yourcompany.com (optional)"
                      value={formData.companyEmail}
                      onChange={(e) => { updateFormData('companyEmail', e.target.value); }}
                      className="glass"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      placeholder="(555) 123-4567 (optional)"
                      value={formData.companyPhone}
                      onChange={(e) => { updateFormData('companyPhone', e.target.value); }}
                      className="glass"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">14-Day Free Trial Included</p>
                        <p className="text-muted-foreground">
                          No credit card required. Cancel anytime during the trial period.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleBack}
                      disabled={isLoading}
                      className="glass hover:bg-muted/50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex-1 gradient-primary shadow-glow"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Start Free Trial
                          <Zap className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center p-6 text-sm text-muted-foreground">
        <p>
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
