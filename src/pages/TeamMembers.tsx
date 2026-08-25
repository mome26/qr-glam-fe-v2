import { useState } from 'react';
import {
  useTeamMembers,
  useInviteTeamMember,
  useUpdateUserRole,
  useDeleteTeamMember,
  type User,
} from '../hooks/use-team';
import { useAuth } from '../hooks/use-auth';
import {
  Loader2,
  UserPlus,
  Mail,
  Shield,
  User as UserIcon,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamMembers() {
  const { user: currentUser } = useAuth();
  const { data: members = [], isLoading } = useTeamMembers();

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'STAFF' | 'MEMBER'>(
    'MEMBER',
  );

  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Hooks
  const inviteMutation = useInviteTeamMember();
  const updateRoleMutation = useUpdateUserRole(selectedMember?.id);
  const deleteMutation = useDeleteTeamMember(selectedMember?.id);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(
        `Invite sent to ${inviteEmail}. Temporary password: 123456789`,
      );
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to invite member',
      );
    }
  };

  const handleRoleUpdate = async (role: 'ADMIN' | 'STAFF' | 'MEMBER') => {
    try {
      await updateRoleMutation.mutateAsync({ role });
      toast.success('Role updated successfully');
      setIsRoleModalOpen(false);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success('Team member removed');
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to remove member',
      );
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'
    );
  };

  return (
    <div className="w-full min-h-full bg-background p-8 md:p-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-semibold font-display text-card-foreground">
            Team Management
          </h1>
          <p className="text-sm text-muted">
            Manage your organization's team, permissions, and roles.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 bg-info text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-info/90 active:scale-95 transition-all shadow-lg shadow-info/10 hover:shadow-info/20"
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden max-w-5xl transition-all hover:shadow-md">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-accent/30">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">
                Team Member
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">
                Role
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-muted uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border/50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-info opacity-40" />
                    <span className="text-sm font-medium text-muted">
                      Synchronizing team data...
                    </span>
                  </div>
                </td>
              </tr>
            ) : members.length > 0 ? (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-accent/10 transition-colors group"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-info/20 to-primary/20 text-info flex items-center justify-center font-bold text-sm border border-info/10 shadow-inner group-hover:scale-105 transition-transform">
                        {getInitials(member.name || '')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {member.name || 'Staff Member'}{' '}
                          {member.id === currentUser?.id && (
                            <span className="ml-1 text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground font-normal">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-info" />
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        member.role === 'ADMIN'
                          ? 'bg-info/5 text-info border-info/20'
                          : member.role === 'STAFF'
                          ? 'bg-info/5 text-info border-info/20'
                          : 'bg-muted/5 text-muted-foreground border-muted/20'
                      }`}
                    >
                      {member.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {(member.role === 'STAFF' ||
                        member.role === 'MEMBER') && (
                        <UserIcon className="w-3 h-3" />
                      )}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-muted">
                    <span className="flex items-center gap-1.5 text-success font-medium">
                      <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    {member.id !== currentUser?.id ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setIsRoleModalOpen(true);
                          }}
                          className="p-2.5 text-muted-foreground hover:text-info hover:bg-info/10 rounded-xl transition-all"
                          title="Change Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-xl transition-all"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted/40 font-bold uppercase tracking-widest px-2 italic">
                        Owner
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted">
                  No other team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-accent/30">
              <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-info" />
                Invite Staff Member
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-muted hover:text-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm font-medium focus:ring-4 focus:ring-info/5 focus:border-info outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Permission Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as 'ADMIN' | 'STAFF' | 'MEMBER')
                  }
                  className="w-full px-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm font-medium focus:ring-4 focus:ring-info/5 focus:border-info outline-none transition-all appearance-none"
                >
                  <option value="MEMBER">Member (Read-Only)</option>
                  <option value="STAFF">Staff (Editor)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-info hover:bg-info/90 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-info/10 flex items-center justify-center gap-2"
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-info/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-info" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Adjust Member Role</h3>
                <p className="text-sm text-muted">
                  Update permissions for{' '}
                  <span className="font-bold text-foreground">
                    {selectedMember.name}
                  </span>
                </p>
              </div>

              <div className="flex flex-col w-full gap-2">
                {(['MEMBER', 'STAFF', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleUpdate(role)}
                    disabled={updateRoleMutation.isPending}
                    className={`w-full p-4 rounded-xl text-left border flex items-center justify-between transition-all group ${
                      selectedMember.role === role
                        ? 'bg-info/5 border-info'
                        : 'bg-accent/20 border-border hover:border-info/50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          selectedMember.role === role
                            ? 'text-info'
                            : 'text-foreground'
                        }`}
                      >
                        {role}
                      </span>
                      <span className="text-[10px] text-muted">
                        {role === 'ADMIN'
                          ? 'Full organization control'
                          : role === 'STAFF'
                          ? 'Can edit events and guests'
                          : 'Can only view data'}
                      </span>
                    </div>
                    {selectedMember.role === role && (
                      <div className="bg-info text-white p-1 rounded-full">
                        <UserCheck className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-full py-3 text-sm font-bold text-muted hover:text-foreground hover:bg-accent/30 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
            {updateRoleMutation.isPending && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-info" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Remove Team Member?</h3>
                <p className="text-sm text-muted px-4">
                  Are you sure you want to remove{' '}
                  <span className="font-bold text-error">
                    {selectedMember.name}
                  </span>{' '}
                  from the organization? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3.5 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3.5 text-sm font-bold text-white bg-error hover:bg-error/90 rounded-xl transition-all shadow-lg shadow-error/10 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
