'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, Edit, Trash2, Smartphone, Monitor, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole, UserStatus, DevicePlatform, LoginMethod, LoginStatus } from '@pingclub/database';
import { updateUserStatus, deleteUser, updateUser, forceLogoutSession, forceLogoutAllSessions } from '../actions';
import { LogOut } from 'lucide-react';

type User = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  provider?: string | null;
  firebaseUid?: string | null;
};

type LoginHistoryItem = {
  id: string;
  platform: DevicePlatform;
  deviceId?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;
  loginMethod: LoginMethod;
  status: LoginStatus;
  failureReason?: string | null;
  loginAt: Date;
};

type ActiveSession = {
  id: string;
  deviceId?: string | null;
  platform?: DevicePlatform | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
};

interface UserDetailsClientProps {
  initialUser: User;
  initialLoginHistory: LoginHistoryItem[];
  initialActiveSessions: ActiveSession[];
}

export function UserDetailsClient({ initialUser, initialLoginHistory, initialActiveSessions }: UserDetailsClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialUser);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>(initialLoginHistory);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'edit' | 'delete'>('edit');
  
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    avatar: user.avatar || '',
    role: user.role,
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEditUser = () => {
    setFormData({
      phone: user.phone || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      avatar: user.avatar || '',
      role: user.role,
    });
    setFormError('');
    setDialogType('edit');
    setDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(user.id);
      router.push('/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await updateUserStatus(user.id, newStatus);
      setUser({ ...user, status: newStatus });
      router.refresh();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      const updatedUser = await updateUser(user.id, formData);
      setUser(updatedUser);
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      setFormError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    if (!confirm('Are you sure you want to logout this device?')) return;

    try {
      await forceLogoutSession(user.id, sessionId);
      setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
      router.refresh();
    } catch (error) {
      console.error('Error logging out session:', error);
    }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm('Are you sure you want to logout all devices? This will sign out the user from all active sessions.')) return;

    try {
      await forceLogoutAllSessions(user.id);
      setActiveSessions([]);
      router.refresh();
    } catch (error) {
      console.error('Error logging out all sessions:', error);
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'SUSPENDED':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'DELETED':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'MODERATOR':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground mt-1">View and manage user information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditUser}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {user.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => handleStatusChange('SUSPENDED')}>
                  Suspend
                </DropdownMenuItem>
              )}
              {user.status === 'SUSPENDED' && (
                <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDeleteUser} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* User Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            {user.avatar ? (
              <img src={user.avatar} alt={getUserName(user)} />
            ) : (
              <AvatarFallback className="text-2xl">{getUserInitials(user)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">{getUserName(user)}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Role</div>
                <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email Verified</div>
                <div className="text-sm">{user.emailVerified ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Phone Verified</div>
                <div className="text-sm">{user.phoneVerified ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="history">Login History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">User Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                <div className="text-sm">{user.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
                <div className="text-sm">{user.phone || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">First Name</div>
                <div className="text-sm">{user.firstName || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Name</div>
                <div className="text-sm">{user.lastName || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Provider</div>
                <div className="text-sm">{user.provider || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Firebase UID</div>
                <div className="text-sm font-mono text-xs">{user.firebaseUid || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Login</div>
                <div className="text-sm">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created At</div>
                <div className="text-sm">{new Date(user.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Updated At</div>
                <div className="text-sm">{new Date(user.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6 mt-6">
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Active Sessions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Devices currently logged in
                </p>
              </div>
              {activeSessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleForceLogoutAll}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout All
                </Button>
              )}
            </div>
            {activeSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No active sessions
              </div>
            ) : (
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Expires At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {session.platform === 'IOS' && <Smartphone className="h-4 w-4" />}
                            {session.platform === 'ANDROID' && <Smartphone className="h-4 w-4" />}
                            {session.platform === 'WEB' && <Monitor className="h-4 w-4" />}
                            <span className="text-sm">{session.platform || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {session.deviceId || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {session.ipAddress || '-'}
                          </div>
                          {session.userAgent && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-muted-foreground truncate max-w-[150px] cursor-help mt-1">
                                    {session.userAgent}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p className="text-xs break-words">{session.userAgent}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(session.lastUsedAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(session.expiresAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleForceLogout(session.id)}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Login History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Recent login attempts and sessions
              </p>
            </div>
            {loginHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No login history found
              </div>
            ) : (
              <div className="p-6">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistory.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell>
                            <div className="font-medium">
                              {new Date(history.loginAt).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {history.platform === 'IOS' && <Smartphone className="h-4 w-4" />}
                              {history.platform === 'ANDROID' && <Smartphone className="h-4 w-4" />}
                              {history.platform === 'WEB' && <Monitor className="h-4 w-4" />}
                              <span className="text-sm">{history.platform}</span>
                            </div>
                            {history.deviceModel && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {history.deviceModel}
                                {history.osVersion && ` • ${history.osVersion}`}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{history.loginMethod}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {history.ipAddress ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="font-mono text-xs truncate max-w-[150px] cursor-help">
                                      {history.ipAddress}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">{history.ipAddress}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="text-xs">-</div>
                              )}
                              {history.userAgent && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-muted-foreground truncate max-w-[150px] cursor-help">
                                      {history.userAgent}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p className="text-xs break-words">{history.userAgent}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        <TableCell className="text-sm">
                          {history.location || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              history.status === 'SUCCESS'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                            }
                          >
                            {history.status}
                          </Badge>
                          {history.failureReason && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                              {history.failureReason}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </TooltipProvider>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

