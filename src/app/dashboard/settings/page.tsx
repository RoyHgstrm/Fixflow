'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  CreditCard, 
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  Monitor,
  Building2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const settingsCategories = [
  { id: 'profile', name: 'Profile', icon: User, description: 'Personal information and account details' },
  { id: 'security', name: 'Security', icon: Shield, description: 'Password and login security' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email and system notifications' },
  { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme and display preferences' },
  { id: 'billing', name: 'Billing', icon: CreditCard, description: 'Subscription and payment details' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [theme, setTheme] = useState('system');

  // Form state
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    company: 'FixFlow Services',
    address: '',
    timezone: 'America/New_York'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    workOrderUpdates: true,
    invoiceReminders: true,
    systemAlerts: true
  });

  // Get user role for role-based functionality
  const userRole = (session?.user as any)?.role || 'ADMIN';

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1000);
  };

  const renderProfileSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={session?.user?.image ?? undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {session?.user?.name?.[0] ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="font-medium">Profile Picture</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                  Change Photo
                </Button>
                <Button variant="outline" size="sm" className="glass hover:bg-destructive/5 text-destructive">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                placeholder="Enter your full name"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                placeholder="Enter your email"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                placeholder="Enter your phone number"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                placeholder="Enter company name"
                className="glass"
              />
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Account Role:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSecuritySettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Password & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  className="glass pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className="glass"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h4 className="font-medium mb-3">Security Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Two-factor authentication</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Last password change</span>
                </div>
                <span className="text-xs text-yellow-600 font-medium">90 days ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderNotificationSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                <div>
                  <h4 className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {key === 'emailNotifications' && 'Receive email notifications for important updates'}
                    {key === 'pushNotifications' && 'Browser and mobile push notifications'}
                    {key === 'workOrderUpdates' && 'Notifications about work order status changes'}
                    {key === 'invoiceReminders' && 'Reminders for pending and overdue invoices'}
                    {key === 'systemAlerts' && 'System maintenance and security alerts'}
                  </p>
                </div>
                <Button
                  variant={value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    [key]: !value
                  })}
                  className={value ? "gradient-primary" : "glass"}
                >
                  {value ? 'On' : 'Off'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAppearanceSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme & Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Color Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', name: 'Light', icon: Sun },
                  { id: 'dark', name: 'Dark', icon: Moon },
                  { id: 'system', name: 'System', icon: Monitor }
                ].map((themeOption) => {
                  const Icon = themeOption.icon;
                  return (
                    <Button
                      key={themeOption.id}
                      variant={theme === themeOption.id ? "default" : "outline"}
                      className={`h-16 flex flex-col gap-2 ${
                        theme === themeOption.id ? "gradient-primary" : "glass hover:bg-primary/5"
                      }`}
                      onClick={() => setTheme(themeOption.id)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{themeOption.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderBillingSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Billing & Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Professional Plan</h4>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Active
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Full access to all features for up to 10 users
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></span>
              <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                Change Plan
              </Button>
            </div>
          </div>

          {/* Billing Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Billing Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Email</Label>
                <Input value="billing@fixflow.com" readOnly className="glass bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label>Next Billing Date</Label>
                <Input value="February 15, 2024" readOnly className="glass bg-muted/20" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <div className="p-4 border border-border/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/26</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
                  Update
                </Button>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="space-y-4">
            <h4 className="font-medium">Recent Invoices</h4>
            <div className="space-y-2">
              {[
                { date: 'Jan 15, 2024', amount: '$29.00', status: 'Paid' },
                { date: 'Dec 15, 2023', amount: '$29.00', status: 'Paid' },
                { date: 'Nov 15, 2023', amount: '$29.00', status: 'Paid' }
              ].map((invoice, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.date}</p>
                    <p className="text-sm text-muted-foreground">Monthly subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{invoice.amount}</p>
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'profile':
        return renderProfileSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'billing':
        return renderBillingSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="glass rounded-xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Settings</h1>
              <p className="text-muted-foreground">Manage your account and application preferences</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="glass border border-border/50">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {settingsCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-auto p-3 ${
                        activeCategory === category.id
                          ? "gradient-primary shadow-glow"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderContent()}
          
          {/* Save Button */}
          <motion.div variants={cardVariants} className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2">
              {successMessage && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{successMessage}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
