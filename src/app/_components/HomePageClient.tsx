'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AnimatedHeading } from "./AnimatedHeading";
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Clock,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  Smartphone,
  Wifi,
  Star,
  Quote,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// MVP Feature data following design guidelines
const features = [
  {
    icon: BarChart3,
    title: "Smart Dashboard",
    description: "Complete overview of jobs, revenue, and team performance with real-time analytics.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: FileText,
    title: "Work Order Management",
    description: "Create, assign, and track jobs with comprehensive documentation and status updates.",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Drag-and-drop scheduling with automated conflicts detection and team optimization.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Centralized customer profiles with service history, preferences, and communication logs.",
    gradient: "from-orange-500/10 to-red-500/10",
    iconColor: "text-orange-500",
  },
  {
    icon: DollarSign,
    title: "Invoicing & Payments",
    description: "Professional invoicing with automated payment tracking and revenue analytics.",
    gradient: "from-yellow-500/10 to-orange-500/10",
    iconColor: "text-yellow-500",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Native mobile experience for field teams with offline capabilities and real-time sync.",
    gradient: "from-indigo-500/10 to-blue-500/10",
    iconColor: "text-indigo-500",
  },
];

// MVP Pricing plans - removed free tier
const pricingPlans = [
  {
    name: "Professional",
    description: "Complete solution for small to medium businesses",
    price: "$29",
    period: "per user/month",
    features: [
      "Unlimited work orders",
      "Customer management",
      "Team scheduling",
      "Invoice generation",
      "Mobile app access",
      "Basic reporting",
      "Email support",
      "Cloud storage"
    ],
    cta: "Start 14-Day Trial",
    popular: true,
    color: "border-primary/50 shadow-glow"
  },
  {
    name: "Business",
    description: "Advanced features for growing enterprises",
    price: "$59",
    period: "per user/month",
    features: [
      "Everything in Professional",
      "Advanced analytics & insights",
      "Custom workflow automation",
      "Team performance tracking",
      "API access & integrations",
      "Priority support",
      "White-label options",
      "Advanced security features"
    ],
    cta: "Start Trial",
    popular: false,
    color: "border-border/50"
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large operations",
    price: "Custom",
    period: "contact sales",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced security & compliance",
      "24/7 phone support",
      "On-premise deployment options",
      "Custom training & onboarding",
      "SLA guarantees"
    ],
    cta: "Contact Sales",
    popular: false,
    color: "border-border/50"
  }
];

// Real testimonials structure for MVP
const testimonials = [
  {
    name: "Sarah Johnson",
    company: "Clean Pro Services",
    role: "Owner",
    content: "FixFlow transformed our 15-person cleaning business. We've cut administrative time by 60% and increased customer satisfaction significantly.",
    rating: 5,
    metrics: "60% less admin time"
  },
  {
    name: "Mike Rodriguez",
    company: "Rodriguez Maintenance",
    role: "Operations Manager",
    content: "The mobile app keeps our field teams connected. Real-time updates and photo documentation have eliminated miscommunication completely.",
    rating: 5,
    metrics: "100% field connectivity"
  },
  {
    name: "Lisa Chen",
    company: "Elite Cleaning Co.",
    role: "Founder",
    content: "Revenue tracking and automated invoicing features helped us identify profitable services and eliminate unprofitable ones.",
    rating: 5,
    metrics: "25% revenue increase"
  }
];

// MVP FAQ focusing on core functionality
const faqs = [
  {
    question: "How quickly can we get started?",
    answer: "Setup takes less than 30 minutes. Import your existing customer data, invite your team, and start creating work orders immediately. No technical expertise required."
  },
  {
    question: "Does it work offline?",
    answer: "Yes, our mobile app works offline for field teams. Data syncs automatically when connection is restored, ensuring no work is lost."
  },
  {
    question: "Can we import our existing data?",
    answer: "Absolutely. We provide data import tools for customer lists, service history, and team information. Our support team assists with larger migrations."
  },
  {
    question: "What integrations are available?",
    answer: "We integrate with popular accounting software (QuickBooks, Xero), payment processors (Stripe, Square), and calendar applications (Google Calendar, Outlook)."
  },
  {
    question: "Is our data secure?",
    answer: "Yes. We use enterprise-grade encryption, regular security audits, and comply with SOC 2 standards. Your data is backed up daily with 99.9% uptime guarantee."
  },
  {
    question: "What happens if we need to cancel?",
    answer: "No long-term contracts required. Cancel anytime with 30 days notice. We provide data export tools to ensure you keep all your information."
  }
];

export default function HomePageClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_70%)]" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative container mx-auto px-4 py-24 lg:py-32 min-h-screen flex items-center"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 w-full">
            {/* Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <motion.div variants={itemVariants} className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  <Zap className="w-4 h-4 mr-2" />
                  Trusted by 2,500+ Service Businesses
                </span>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <AnimatedHeading>
                  Professional Business Management for <span className="text-gradient">Service Companies</span>
                </AnimatedHeading>
              </motion.div>
              
              <motion.p 
                variants={itemVariants}
                className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Streamline operations, manage teams, and grow revenue with FixFlow's comprehensive platform 
                designed specifically for cleaning, maintenance, and repair businesses.
              </motion.p>
              
              <motion.div 
                variants={itemVariants}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/signup">
                  <Button size="lg" className="gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300 group">
                    Start 14-Day Trial
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" size="lg" className="glass hover:bg-primary/5 transition-all duration-300">
                    Schedule Demo
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No setup fees
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Cancel anytime
                </div>
              </motion.div>
            </div>
            
            {/* Hero Visual */}
            <motion.div
              variants={itemVariants}
              className="lg:w-1/2 relative"
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="relative w-full max-w-lg mx-auto"
              >
                <div className="glass rounded-2xl p-8 shadow-2xl border border-primary/20">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Live Dashboard</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-muted-foreground">Real-time</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary">28</div>
                        <div className="text-sm text-muted-foreground">Active Jobs</div>
                        <div className="text-xs text-green-500">+15% this week</div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-500">$3,240</div>
                        <div className="text-sm text-muted-foreground">Today's Revenue</div>
                        <div className="text-xs text-green-500">+22% vs yesterday</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Commercial Cleaning - Tech Plaza</div>
                            <div className="text-xs text-muted-foreground">Team Alpha • In Progress</div>
                          </div>
                          <div className="text-xs text-blue-500 font-medium">2h remaining</div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">HVAC Maintenance - Medical Center</div>
                            <div className="text-xs text-muted-foreground">Sarah M. • Completed</div>
                          </div>
                          <div className="text-xs text-green-500 font-medium">$450</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-500/20 rounded-full blur-xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.4, 0.2, 0.4],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to <span className="text-gradient">Scale Your Business</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional-grade tools designed specifically for service businesses. 
              Streamline operations and focus on what matters most - growing your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature: any, index: number) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className={`glass rounded-xl p-6 bg-gradient-to-br ${feature.gradient} hover:shadow-lg transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-muted/10 to-background">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Professional Pricing for <span className="text-gradient">Growing Businesses</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business size. All plans include 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan: any, index: number) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative w-full"
              >
                {plan.popular && (
                  <div className="absolute z-10 -top-4 left-1/2 transform -translate-x-1/2 w-full max-w-[200px]">
                    <span className="block text-center bg-gradient-to-r from-primary to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium truncate">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <Card className={`glass ${plan.color} h-full relative overflow-hidden group hover:shadow-glow transition-all duration-300`}>
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm min-h-[48px]">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground ml-2 text-sm">/{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature: any, featureIndex: number) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-6">
                      <Button 
                        className={`w-full ${plan.popular ? 'gradient-primary shadow-glow' : 'glass hover:bg-primary/5'}`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {plan.cta}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Need a custom solution? We'll build it for you.
            </p>
            <Button variant="outline" className="glass hover:bg-primary/5">
              Contact Sales Team
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Trusted by <span className="text-gradient">Service Professionals</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Real results from businesses that chose FixFlow to transform their operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial: any, index: number) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass hover:shadow-glow transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                      <span className="text-sm text-primary font-medium ml-2">{testimonial.metrics}</span>
                    </div>
                    
                    <div className="mb-6">
                      <Quote className="w-8 h-8 text-primary/30 mb-2" />
                      <p className="text-muted-foreground leading-relaxed">
                        {testimonial.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {testimonial.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-gradient">Frequently Asked</span> Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about FixFlow and how it works for your business.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10" />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 text-center relative"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of service businesses already using FixFlow to streamline operations, 
            manage teams, and accelerate growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/signup">
                <Button size="lg" className="gradient-primary shadow-glow-lg text-lg px-8 py-4 group">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="#demo">
                <Button variant="outline" size="lg" className="glass hover:bg-primary/5 text-lg px-8 py-4">
                  Schedule Demo
                </Button>
              </Link>
            </motion.div>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
