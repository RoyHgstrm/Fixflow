'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Shield, 
  User, 
  Crown,
  Search,
  Filter,
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { db } from '@/server/db';
import { api } from "@/trpc/react";
import { Badge } from '@/components/ui/badge';

type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ADMIN" | "TECHNICIAN" | "CLIENT";
type TeamRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "TECHNICIAN";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  image: string | null;
  phone: string | null;
  jobTitle: string | null;
  createdAt: Date;
}

interface TeamStats {
  total: number;
  active: number;
  managers: number;
  employees: number;
  technicians: number;
}

type TeamStatus = "active" | "invited" | "inactive";

export default function TeamPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | TeamRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TeamStatus>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'EMPLOYEE' as TeamRole,
    sendEmail: true,
  });

  const userRole = (session?.user as any)?.role || ('EMPLOYEE' as TeamRole);
  const canManageTeam = ['OWNER', 'MANAGER', 'ADMIN'].includes(userRole);

  // Fetch team members with filters
  const { data: teamData, isLoading: isLoadingTeam, refetch: refetchTeam } = api.team.getAll.useQuery({
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
    limit: 25,
  });

  // Fetch team statistics
  const { data: teamStats, refetch: refetchStats } = api.team.getStats.useQuery<TeamStats>();

  // Team member mutations
  const inviteMember = api.team.invite.useMutation({
    onSuccess: () => {
      setInviteForm({ email: '', role: 'EMPLOYEE' as TeamRole, sendEmail: true });
      setShowInviteModal(false);
      // Refetch team data
      refetchTeam();
      refetchStats();
    },
  });

  const updateMember = api.team.update.useMutation({
    onSuccess: () => {
      // Refetch team data
      refetchTeam();
      refetchStats();
    },
  });

  const handleInviteMember = async () => {
    if (!inviteForm.email || !canManageTeam) return;

    try {
      await inviteMember.mutateAsync({
        email: inviteForm.email,
        role: inviteForm.role,
        sendEmail: inviteForm.sendEmail,
      });
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: TeamRole) => {
    if (!canManageTeam) return;
    try {
      await updateMember.mutateAsync({
        id: memberId,
        role: newRole,
      });
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleToggleStatus = async (memberId: string, isActive: boolean) => {
    if (!canManageTeam) return;
    try {
      await updateMember.mutateAsync({
        id: memberId,
        isActive: !isActive,
      });
    } catch (error) {
      console.error('Failed to update member status:', error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
    case 'OWNER':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'MANAGER':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'EMPLOYEE':
      return <User className="w-4 h-4 text-green-500" />;
    default:
      return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const formatLastSeen = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members, roles, and permissions
          </p>
        </div>
        
        {canManageTeam && (
          <Button 
            onClick={() => { setShowInviteModal(true); }}
            className="gradient-primary shadow-glow"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamStats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamStats?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamStats?.managers || 0}</div>
                <div className="text-sm text-muted-foreground">Managers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamStats?.employees || 0}</div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="role">Role</Label>
          <Select
            value={roleFilter}
            onValueChange={(value: 'all' | TeamRole) => { setRoleFilter(value); }}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="TECHNICIAN">Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="status">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | TeamStatus) => { setStatusFilter(value); }}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Members List */}
      <Card className="glass border border-border/50">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoadingTeam ? (
              <div className="text-center py-8">Loading...</div>
            ) : teamData?.items?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No team members found
              </div>
            ) : (
              teamData?.items?.map((member: {
                name: string | null;
                id: string;
                email: string | null;
                role: UserRole;
                phone: string | null;
                isActive: boolean;
                createdAt: Date;
                image: string | null;
                jobTitle: string | null;
                lastLoginAt: Date | null;
              }) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{member.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.jobTitle && (
                        <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {canManageTeam && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role as TeamRole)}>
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(member.id, member.isActive)}>
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowInviteModal(false); }} />
          <Card className="relative z-10 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChange={(e) => { setInviteForm(prev => ({ ...prev, email: e.target.value })); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: TeamRole) => { setInviteForm(prev => ({ ...prev, role: value })); }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={inviteForm.sendEmail}
                  onChange={(e) => { setInviteForm(prev => ({ ...prev, sendEmail: e.target.checked })); }}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="sendEmail">Send invitation email</Label>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => { setShowInviteModal(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteForm.email || inviteMember.isPending}
                  className="gradient-primary shadow-glow"
                >
                  {inviteMember.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 