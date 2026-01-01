'use client';

import { useState, useEffect } from 'react';
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
import { Search, Plus, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole, UserStatus } from '@pingclub/database';
import { createUser, updateUserStatus, deleteUser, getUsers } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';

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
  provider?: string | null;
  firebaseUid?: string | null;
};

interface UsersClientProps {
  initialUsers: User[];
  initialMeta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchParams: {
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  };
}

export function UsersClient({ initialUsers, initialMeta, searchParams }: UsersClientProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.search || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.role || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.status || 'all');
  const [page, setPage] = useState(Number(searchParams.page) || 1);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    avatar: '',
    role: 'USER' as UserRole,
  });
  const [formError, setFormError] = useState('');

  // Sync state with URL params and fetch data when filters change
  useEffect(() => {
    const currentSearch = searchParamsHook.get('search') || '';
    const currentRole = searchParamsHook.get('role') || 'all';
    const currentStatus = searchParamsHook.get('status') || 'all';
    const currentPage = Number(searchParamsHook.get('page')) || 1;

    setSearch(currentSearch);
    setRoleFilter(currentRole);
    setStatusFilter(currentStatus);
    setPage(currentPage);

    // Fetch data with current filters
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await getUsers({
          page: currentPage,
          limit: 10,
          search: currentSearch || undefined,
          role: currentRole !== 'all' ? (currentRole as UserRole) : undefined,
          status: currentStatus !== 'all' ? (currentStatus as UserStatus) : undefined,
        });
        setUsers(result.data);
        setMeta(result.meta);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchParamsHook]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    updateURL({ search: value, page: '1' });
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPage(1);
    updateURL({ role: value === 'all' ? undefined : value, page: '1' });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    updateURL({ status: value === 'all' ? undefined : value, page: '1' });
  };

  const updateURL = (params: Record<string, string | undefined>) => {
    const currentParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });
    router.push(`/users?${currentParams.toString()}`);
    router.refresh();
  };

  const handleViewUser = (user: User) => {
    router.push(`/users/${user.id}`);
  };

  const handleAddUser = () => {
    setFormData({
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      avatar: '',
      role: 'USER',
    });
    setFormError('');
    setDialogType('add');
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      if (dialogType === 'add') {
        await createUser(formData);
        setDialogOpen(false);
        // Redirect to refresh the list
        const currentParams = new URLSearchParams(window.location.search);
        router.push(`/users?${currentParams.toString()}`);
        router.refresh();
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      router.refresh();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      router.refresh();
    } catch (error) {
      console.error('Error updating user status:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor user accounts</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.avatar ? (
                          <img src={user.avatar} alt={getUserName(user)} />
                        ) : (
                          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{getUserName(user)}</div>
                        {user.provider && (
                          <div className="text-xs text-muted-foreground">{user.provider}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.emailVerified && (
                        <Badge variant="outline" className="text-xs">Email</Badge>
                      )}
                      {user.phoneVerified && (
                        <Badge variant="outline" className="text-xs">Phone</Badge>
                      )}
                      {!user.emailVerified && !user.phoneVerified && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {user.status === 'ACTIVE' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                          >
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          >
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * meta.limit) + 1} to {Math.min(page * meta.limit, meta.total)} of{' '}
            {meta.total} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.max(1, page - 1);
                setPage(newPage);
                updateURL({ page: newPage.toString() });
              }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.min(meta.totalPages, page + 1);
                setPage(newPage);
                updateURL({ page: newPage.toString() });
              }}
              disabled={page === meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View/Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'add' ? 'Add New User' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'add'
                ? 'Create a new user account'
                : 'Update user information'}
            </DialogDescription>
          </DialogHeader>

          {(dialogType === 'add' || dialogType === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={dialogType === 'edit'}
                  />
                </div>
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
                <div className="space-y-2">
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
                  {loading ? 'Saving...' : dialogType === 'add' ? 'Create User' : 'Update User'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

