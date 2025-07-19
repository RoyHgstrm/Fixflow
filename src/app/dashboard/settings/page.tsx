'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/lib/providers/session-provider';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Building,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { UserRole } from "@/lib/types";
import { api } from "@/trpc/react";
import { toast } from "sonner";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  }),
};

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch initial settings data
  const { data: settingsData, isLoading: isLoadingSettings, error: settingsError } = api.user.getSettingsData.useQuery();

  useEffect(() => {
    if (settingsData) {
      setProfileForm({
        name: settingsData.profile.name || '',
        email: settingsData.profile.email || '',
        phone: settingsData.profile.phone || '',
        jobTitle: settingsData.profile.jobTitle || '',
        image: settingsData.profile.image || '',
      });
      if (settingsData.company) {
        setCompanyForm({
          name: settingsData.company.name || '',
          email: settingsData.company.email || '',
          phone: settingsData.company.phone || '',
          address: settingsData.company.address || '',
          city: settingsData.company.city || '',
          state: settingsData.company.state || '',
          zipCode: settingsData.company.zipCode || '',
          website: settingsData.company.website || '',
          industry: settingsData.company.industry || '',
        });
      }
      setNotificationSettings(settingsData.notificationSettings);
    }
  }, [settingsData]);

  const [profileForm, setProfileForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    jobTitle: '',
    image: session?.user?.image || '',
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    industry: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    workOrderUpdates: true,
    teamUpdates: true,
    systemUpdates: false,
    marketingEmails: false,
  });

  const userRole = (session?.user as any)?.role || UserRole.EMPLOYEE;
  const canManageCompany = [UserRole.OWNER, UserRole.MANAGER].includes(userRole);

  // Mutations
  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setIsSaving(false);
      // Re-fetch session to update displayed user info
      update(); 
    },
    onError: (err) => {
      toast.error(`Failed to update profile: ${err.message}`);
      setIsSaving(false);
    },
  });

  const updateCompanyMutation = api.user.updateCompany.useMutation({
    onSuccess: () => {
      toast.success("Company info updated successfully!");
      setIsSaving(false);
      // Re-fetch session to update company info
      update();
    },
    onError: (err) => {
      toast.error(`Failed to update company info: ${err.message}`);
      setIsSaving(false);
    },
  });

  const updateNotificationsMutation = api.user.updateNotifications.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated!");
      setIsSaving(false);
    },
    onError: (err) => {
      toast.error(`Failed to update notification preferences: ${err.message}`);
      setIsSaving(false);
    },
  });

  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError('');
    },
    onError: (err) => {
      setPasswordError(err.message || "Failed to change password");
      setIsSaving(false);
    },
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfileMutation.mutateAsync(profileForm);
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    await updateCompanyMutation.mutateAsync(companyForm);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await updateNotificationsMutation.mutateAsync(notificationSettings);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setIsSaving(true);
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, canAccess: true },
    { id: 'company', name: 'Company', icon: Building, canAccess: canManageCompany },
    { id: 'notifications', name: 'Notifications', icon: Bell, canAccess: true },
    { id: 'security', name: 'Security', icon: Shield, canAccess: true },
    { id: 'billing', name: 'Billing', icon: CreditCard, canAccess: canManageCompany },
  ].filter(tab => tab.canAccess);

  if (isLoadingSettings) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="glass border border-border/50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="glass border border-border/50">
              <CardHeader>
                <CardTitle className="h-6 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="space-y-8">
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Settings</h3>
            <p className="text-muted-foreground mb-4">
              {settingsError.message || "Failed to load settings. Please try again."}
            </p>
            <Button onClick={() => { window.location.reload(); }} className="gradient-primary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <Card className="glass border border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                onClick={() => { setActiveTab(tab.id); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </motion.button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => { setProfileForm(prev => ({ ...prev, name: e.target.value })); }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => { setProfileForm(prev => ({ ...prev, email: e.target.value })); }}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => { setProfileForm(prev => ({ ...prev, phone: e.target.value })); }}
                        placeholder="+358 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={profileForm.jobTitle}
                        onChange={(e) => { setProfileForm(prev => ({ ...prev, jobTitle: e.target.value })); }}
                        placeholder="Your job title"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={userRole}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact your administrator to change your role
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isSaving || updateProfileMutation.isPending}
                    className="gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'company' && canManageCompany && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyForm.name}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, name: e.target.value })); }}
                        placeholder="Your company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, email: e.target.value })); }}
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone Number</Label>
                      <Input
                        id="companyPhone"
                        type="tel"
                        value={companyForm.phone}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, phone: e.target.value })); }}
                        placeholder="+358 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={companyForm.website}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, website: e.target.value })); }}
                        placeholder="https://www.company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={companyForm.address}
                      onChange={(e) => { setCompanyForm(prev => ({ ...prev, address: e.target.value })); }}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={companyForm.city}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, city: e.target.value })); }}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={companyForm.state}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, state: e.target.value })); }}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={companyForm.zipCode}
                        onChange={(e) => { setCompanyForm(prev => ({ ...prev, zipCode: e.target.value })); }}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={companyForm.industry}
                      onValueChange={(value) => { setCompanyForm(prev => ({ ...prev, industry: value })); }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Cleaning Services</SelectItem>
                        <SelectItem value="maintenance">Maintenance & Repair</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="hvac">HVAC Services</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSaveCompany}
                    disabled={isSaving || updateCompanyMutation.isPending}
                    className="gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateCompanyMutation.isPending ? 'Saving...' : 'Save Company Info'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked: boolean) => 
                        { setNotificationSettings(prev => ({ ...prev, emailNotifications: checked })); }
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="workOrderUpdates">Work Order Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when work orders are updated
                        </p>
                      </div>
                      <Switch
                        id="workOrderUpdates"
                        checked={notificationSettings.workOrderUpdates}
                        onCheckedChange={(checked: boolean) => 
                        { setNotificationSettings(prev => ({ ...prev, workOrderUpdates: checked })); }
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="teamUpdates">Team Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications about team member activities
                        </p>
                      </div>
                      <Switch
                        id="teamUpdates"
                        checked={notificationSettings.teamUpdates}
                        onCheckedChange={(checked: boolean) => 
                        { setNotificationSettings(prev => ({ ...prev, teamUpdates: checked })); }
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="systemUpdates">System Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Updates about new features and system changes
                        </p>
                      </div>
                      <Switch
                        id="systemUpdates"
                        checked={notificationSettings.systemUpdates}
                        onCheckedChange={(checked: boolean) => 
                        { setNotificationSettings(prev => ({ ...prev, systemUpdates: checked })); }
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketingEmails">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Tips, best practices, and promotional content
                        </p>
                      </div>
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked: boolean) => 
                        { setNotificationSettings(prev => ({ ...prev, marketingEmails: checked })); }
                        }
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={isSaving || updateNotificationsMutation.isPending}
                    className="gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter current password"
                          className="pr-10"
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                          onClick={() => { setShowPassword(!showPassword); }}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => { setConfirmNewPassword(e.target.value); }}
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {passwordError}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      Enable Two-Factor Authentication
                    </Button>
                  </div>

                  <Button 
                    onClick={handleChangePassword}
                    disabled={isSaving || changePasswordMutation.isPending}
                    className="gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'billing' && canManageCompany && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Card className="glass border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Billing & Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">


                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Available Plans</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-2 border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Solo</CardTitle>
                          <div className="text-2xl font-bold">29€<span className="text-sm font-normal">/month</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• 1 user</li>
                            <li>• Unlimited work orders</li>
                            <li>• Basic reporting</li>
                            <li>• Email support</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-primary">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Team
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Popular</span>
                          </CardTitle>
                          <div className="text-2xl font-bold">59€<span className="text-sm font-normal">/month</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• Up to 10 users</li>
                            <li>• Unlimited work orders</li>
                            <li>• Advanced reporting</li>
                            <li>• Team management</li>
                            <li>• Priority support</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-border">
                        <CardHeader>
                          <CardTitle className="text-lg">Business</CardTitle>
                          <div className="text-2xl font-bold">99€<span className="text-sm font-normal">/month</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• Up to 50 users</li>
                            <li>• Unlimited work orders</li>
                            <li>• Custom reporting</li>
                            <li>• API access</li>
                            <li>• Phone support</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Button className="w-full gradient-primary shadow-glow">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
