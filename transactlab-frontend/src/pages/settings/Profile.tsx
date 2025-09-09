import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";
const TeamSection: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inviteStatus, setInviteStatus] = React.useState<{[key: string]: string}>({});
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';

  const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/team/members`, { headers: authHeader() });
      const json = await res.json();
      if (json?.success) setMembers(json.data || []);
    } finally { setLoading(false); }
  };

  React.useEffect(() => { void fetchMembers(); }, []);

  const invite = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/team/invite`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ email }) });
      const json = await res.json();
      if (json?.success) {
        setEmail('');
        setInviteStatus(prev => ({ ...prev, [email]: 'sent' }));
        toast({ title: 'Invite sent', description: 'An invite email has been sent.' });
        await fetchMembers();
      } else {
        toast({ title: 'Error', description: json?.message || 'Failed to invite', variant: 'destructive' });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-[1fr,160px] gap-3">
        <Input placeholder="Invite email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <Button disabled={loading} onClick={invite}>Invite</Button>
      </div>
      <div className="text-sm text-muted-foreground">Invited members must register if they don’t have an account before accepting.</div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Last switched</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={3}>No members yet</td></tr>
            ) : members.map((m) => (
              <tr key={m.email}>
                <td className="p-3">{m.email}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`capitalize px-2 py-1 rounded text-xs ${
                      m.status === 'active' ? 'bg-green-100 text-green-800' :
                      m.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {m.status}
                    </span>
                    {inviteStatus[m.email] && (
                      <span className="text-xs text-blue-600">
                        ({inviteStatus[m.email]})
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">{m.lastSwitchAt ? new Date(m.lastSwitchAt).toLocaleString() : '-'}</td>
                <td className="p-3 text-right">
                  {m.status === 'invited' ? (
                    <Button variant="outline" size="sm" disabled={loading} onClick={async ()=>{ 
                      try { 
                        setLoading(true); 
                        await fetch(`${API_BASE}/team/invite?email=${encodeURIComponent(m.email)}`, { method: 'DELETE', headers: authHeader() }); 
                        toast({ title: 'Invite cancelled' }); 
                        setInviteStatus(prev => ({ ...prev, [m.email]: 'cancelled' }));
                        await fetchMembers(); 
                      } finally { setLoading(false); } 
                    }}>Cancel invite</Button>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-green-600">Member</span>
                      <Button variant="destructive" size="sm" disabled={loading} onClick={async ()=>{
                        try {
                          setLoading(true);
                          await fetch(`${API_BASE}/team/member?email=${encodeURIComponent(m.email)}`, { method: 'DELETE', headers: authHeader() });
                          toast({ title: 'Member removed' });
                          await fetchMembers();
                        } finally { setLoading(false); }
                      }}>Remove</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WorkspaceSection: React.FC = () => {
  const { user } = useAuth();
  const uid = (user as any)?._id ?? (user as any)?.id ?? 'anon';
  const userKey = React.useMemo(() => `activeTeamId:${uid}`,[uid]);
  const [teams, setTeams] = React.useState<any[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [logs, setLogs] = React.useState<any[]>([]);
  const [showLogs, setShowLogs] = React.useState(false);
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';

  const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/teams`, { headers: authHeader() });
      const json = await res.json();
      if (json?.success) setTeams(json.data || []);
    } finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/team/logs`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) {
      toast({ title: 'Failed to fetch logs', variant: 'destructive' });
    }
  };

  React.useEffect(() => {
    // initialize active from per-user key
    const stored = localStorage.getItem(userKey);
    setActiveId(stored);
    void fetchTeams();
  }, [userKey]);

  const setActive = (id: string) => {
    setActiveId(id);
    localStorage.setItem(userKey, id);
    const team = teams.find((t: any) => String(t._id) === id);
    if (team?.ownerId) {
      localStorage.setItem(`activeOwnerId:${uid}`, team.ownerId);
      // Also write generic keys for contexts that read non-scoped keys
      localStorage.setItem('activeOwnerId', team.ownerId);
    }
    localStorage.setItem('activeTeamId', id);
    if (team?.name) {
      localStorage.setItem('activeTeamName', team.name);
    }
    try { console.debug('[Workspace] setActive', { id, ownerId: team?.ownerId }); } catch {}
    // record switch
    try {
      const email = (user as any)?.email;
      fetch(`${API_BASE}/team/logs/switch`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ teamId: id, email }) }).catch(()=>{});
    } catch {}
    toast({ title: 'Workspace switched', description: 'Active workspace updated' });
    // force reload so all data re-fetches under new workspace
    setTimeout(() => window.location.reload(), 400);
  };

  const startEdit = (team: any) => {
    setEditingTeam(team._id);
    setEditName(team.name);
  };

  const saveEdit = async () => {
    if (!editingTeam || !editName.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/team/name`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ name: editName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Workspace renamed', description: 'Name updated successfully' });
        await fetchTeams();
        setEditingTeam(null);
        setEditName('');
      } else {
        toast({ title: 'Failed to rename', description: data.message || 'Unknown error', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Failed to rename', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setEditName('');
  };

  return (
    <div className="grid gap-4">
      {(() => {
        const activeOwner = localStorage.getItem(`activeOwnerId:${uid}`);
        return activeOwner && activeOwner !== uid;
      })() && (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem(`activeTeamId:${uid}`);
              localStorage.removeItem(`activeOwnerId:${uid}`);
              localStorage.removeItem('activeTeamId');
              localStorage.removeItem('activeOwnerId');
              localStorage.removeItem('activeTeamName');
              setActiveId(null);
              toast({ title: 'Switched to personal workspace' });
              setTimeout(() => window.location.reload(), 400);
            }}
          >
            Switch to personal workspace
          </Button>
        </div>
      )}
      <div className="text-sm text-muted-foreground">Select your active workspace. Invites you accept will appear here after joining.</div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Owner</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={3}>No workspaces yet</td></tr>
            ) : teams.map((t: any) => (
              <tr key={t._id}>
                <td className="p-3">
                  {editingTeam === t._id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        placeholder="Workspace name"
                      />
                      <Button size="sm" onClick={saveEdit} disabled={loading}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{t.name || 'Workspace'}</span>
                      {t.ownerId === uid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(t)}
                          disabled={loading}
                          className="h-6 px-2 text-xs"
                        >
                          Rename
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3">{t.ownerId?.slice(-6)}</td>
                <td className="p-3 text-right">
                  {t.ownerId === uid ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-gray-500">Owner</span>
                      {activeId === String(t._id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowLogs(true);
                            fetchLogs();
                          }}
                          disabled={loading}
                        >
                          View Logs
                        </Button>
                      )}
                    </div>
                  ) : activeId === String(t._id) ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <Button size="sm" disabled={loading} onClick={()=>setActive(String(t._id))}>Set active</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Logs Viewer Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Workspace Activity Logs</DialogTitle>
            <DialogDescription>
              Recent activity in this workspace
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium capitalize">{log.type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.actorEmail && `by ${log.actorEmail}`}
                        {log.meta?.name && ` to "${log.meta.name}"`}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogs(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const schema = z.object({ 
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
  language: z.string(),
  timezone: z.string(),
  currency: z.string(),
  notifyEmail: z.boolean().optional().default(true),
  notifySms: z.boolean().optional().default(false),
  notifyPush: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof schema>;

const currencies = [
  { code: "NGN", name: "Nigerian Naira" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
];

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
];

const timezones = ["UTC", "Africa/Lagos", "Africa/Nairobi", "Europe/London", "America/New_York"];


const Profile = () => {
  useSEO("Account Settings — TransactLab", "Manage your account, preferences, and currency.");
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const normalizedAvatar = user?.avatar ? String(user.avatar).replace(/\\/g, "/") : undefined;

  // Debug: Log user data
  React.useEffect(() => {
    console.log('Profile component - User data:', user);
  }, [user]);

  const defaultValues: FormValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: (user as any)?.phone || "",
    language: (user as any)?.preferences?.language || "en",
    timezone: (user as any)?.preferences?.timezone || "UTC",
    currency: (user as any)?.preferences?.currency || "NGN",
    notifyEmail: (user as any)?.preferences?.notifications?.email ?? true,
    notifySms: (user as any)?.preferences?.notifications?.sms ?? false,
    notifyPush: (user as any)?.preferences?.notifications?.push ?? false,
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const [showFantasy, setShowFantasy] = React.useState(false);
  const [showBankConnect, setShowBankConnect] = React.useState(false);
  const [showPaypalConnect, setShowPaypalConnect] = React.useState(false);
  const [connectedBank, setConnectedBank] = React.useState<{ bank: string; last4: string } | null>(null);
  const [connectedPaypal, setConnectedPaypal] = React.useState<{ email: string } | null>(null);
  const [bankForm, setBankForm] = React.useState({ bank: 'Demo Bank', accountNumber: '' });
  const [paypalForm, setPaypalForm] = React.useState({ email: '' });

  // When user data loads/changes after initial mount, sync the form values
  React.useEffect(() => {
    if (!user) return;
    const freshValues: FormValues = {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: (user as any)?.phone || "",
      language: (user as any)?.preferences?.language || "en",
      timezone: (user as any)?.preferences?.timezone || "UTC",
      currency: (user as any)?.preferences?.currency || "NGN",
      notifyEmail: (user as any)?.preferences?.notifications?.email ?? true,
      notifySms: (user as any)?.preferences?.notifications?.sms ?? false,
      notifyPush: (user as any)?.preferences?.notifications?.push ?? false,
    };
    reset(freshValues);
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const api = (await import("@/lib/api")).default;
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        preferences: {
          notifications: { email: !!values.notifyEmail, sms: !!values.notifySms, push: !!values.notifyPush },
          language: values.language,
          timezone: values.timezone,
          currency: values.currency,
        },
      };

      const res = await api.updateProfile(payload);
      if (res?.success) {
        updateUser(payload as any);
        toast({ title: "Saved", description: "Account settings updated" });
      } else {
        throw new Error(res?.message || "Failed to update profile");
      }

      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const avatarRes = await api.uploadAvatar(form);
        if (avatarRes?.success) {
          toast({ title: "Avatar uploaded", description: "Profile picture updated successfully" });
          // Update user context with new avatar
          updateUser({ avatar: avatarRes.data.avatar });
          setAvatarPreviewUrl(null);
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Update failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      <h1 className="text-2xl font-semibold">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
      {/* Debug info - remove this after testing */}
      {!user?.email && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> If your email is not showing, please log out and log back in to refresh your session.
          </p>
        </div>
      )}

      {/* Account section */}
      <Card className="glass-panel">
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 max-w-3xl">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>First name</Label>
                <Input {...register("firstName")} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Last name</Label>
                <Input {...register("lastName")} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email address</Label>
                <Input 
                  type="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-gray-50 text-gray-600"
                  placeholder="Loading email..."
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed from this page</p>
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input {...register("phone")} />
              </div>
            </div>

            {/* Avatar */}
            <div className="grid md:grid-cols-[auto,1fr] items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0a164d]/10 flex items-center justify-center text-[#0a164d] font-bold overflow-hidden">
                {avatarPreviewUrl || normalizedAvatar ? (
                  <img
                    src={avatarPreviewUrl || `http://localhost:5000/${normalizedAvatar}`}
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (sibling) sibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${(avatarPreviewUrl || user?.avatar) ? 'hidden' : 'flex'}`}>
                  {(user?.firstName || 'D').charAt(0)}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Avatar</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAvatarFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setAvatarPreviewUrl(url);
                    } else {
                      setAvatarPreviewUrl(null);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            {/* Preferences */}
            <div className="grid gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Preferences</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Language</Label>
                    <Select value={watch("language")} onValueChange={(v)=>setValue("language", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {languages.map(l=> (<SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Timezone</Label>
                    <Select value={watch("timezone")} onValueChange={(v)=>setValue("timezone", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timezones.map(t=> (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default currency</Label>
                    <Select value={watch("currency")} onValueChange={(v)=>setValue("currency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencies.map(c=> (<SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader><CardTitle>Payout settings</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {/* Payout methods */}
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Select a default payout method</div>
                <div className="grid gap-3 max-w-2xl">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0a164d]/10 flex items-center justify-center font-semibold text-[#0a164d]">🏦</div>
                      <div>
                        <div className="font-medium">Bank Account</div>
                        <div className="text-xs text-muted-foreground">{connectedBank ? `**** ${connectedBank.last4} NGN` : 'Not connected'}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=>setShowBankConnect(true)}>{connectedBank ? 'Change' : 'Connect'}</Button>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-semibold text-blue-600">PP</div>
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-xs text-muted-foreground">{connectedPaypal ? connectedPaypal.email : 'Connect your PayPal account'}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=>setShowPaypalConnect(true)}>{connectedPaypal ? 'Change' : 'Connect'}</Button>
                  </div>
                </div>
              </div>

              {/* Payout invoice info */}
              <div className="space-y-2 max-w-3xl">
                <div className="font-medium">Payout invoice info</div>
                <div className="text-sm text-muted-foreground">Optional. Information added here, such as your business name, address, Tax ID number, etc. will be included when generating a payout invoice.</div>
                <textarea className="w-full min-h-[120px] border rounded-md p-3 text-sm" placeholder="Enter your business name, address, Tax ID number, etc." />
              </div>

              {/* Payout history (empty state) */}
              <div className="space-y-2">
                <div className="font-medium">Payout history</div>
                <div className="text-sm text-muted-foreground">No payouts yet.</div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowFantasy(true)}>Test payout</Button>
                <Button onClick={()=>setShowFantasy(true)}>Save changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Fantasy dialog */}
          <Dialog open={showFantasy} onOpenChange={setShowFantasy}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Oops… this is a fantasy world</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-700">
                Don’t worry — you’ll have that kind of money soon. This is the TransactLab sandbox, so payouts are simulated for testing purposes only.
              </div>
              <DialogFooter>
                <Button onClick={()=>setShowFantasy(false)}>Got it</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect Bank dialog */}
          <Dialog open={showBankConnect} onOpenChange={setShowBankConnect}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect bank account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Bank</Label>
                  <Input value={bankForm.bank} onChange={(e)=>setBankForm(v=>({...v, bank: e.target.value}))} />
                </div>
                <div className="grid gap-1">
                  <Label>Account number</Label>
                  <Input value={bankForm.accountNumber} onChange={(e)=>setBankForm(v=>({...v, accountNumber: e.target.value}))} placeholder="0001234567" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setShowBankConnect(false)}>Cancel</Button>
                <Button onClick={()=>{ setConnectedBank({ bank: bankForm.bank, last4: (bankForm.accountNumber||'').slice(-4).padStart(4,'*') }); setShowBankConnect(false); toast({ title: 'Bank connected', description: 'Sandbox connection successful' }); }}>Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect PayPal dialog */}
          <Dialog open={showPaypalConnect} onOpenChange={setShowPaypalConnect}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect PayPal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>PayPal email</Label>
                  <Input type="email" value={paypalForm.email} onChange={(e)=>setPaypalForm({ email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setShowPaypalConnect(false)}>Cancel</Button>
                <Button onClick={()=>{ setConnectedPaypal({ email: paypalForm.email }); setShowPaypalConnect(false); toast({ title: 'PayPal connected', description: 'Sandbox connection successful' }); }}>Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle>Team</CardTitle></CardHeader>
            <CardContent className="grid gap-6 max-w-2xl">
              <TeamSection />
            </CardContent>
          </Card>
        </TabsContent>


        {/* Workspaces */}
        <TabsContent value="workspaces">
          <Card>
            <CardHeader><CardTitle>Workspaces</CardTitle></CardHeader>
            <CardContent className="grid gap-6 max-w-2xl">
              <WorkspaceSection />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Profile;
