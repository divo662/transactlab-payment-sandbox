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
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [inviteStatus, setInviteStatus] = React.useState<{[key: string]: string}>({});
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

  const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const res = await fetch(`${API_BASE}/team/members`, { headers: authHeader() });
      const json = await res.json();
      if (json?.success) setMembers(json.data || []);
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
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

  if (initialLoading) {
  return (
    <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,160px] gap-3">
          <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>

      <div className="border rounded-lg overflow-hidden">
          <div className="hidden sm:block">
            <div className="bg-gray-50 p-3">
              <div className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="sm:hidden">
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,160px] gap-3">
        <Input placeholder="Invite email" value={email} onChange={(e)=>setEmail(e.target.value)} className="text-sm sm:text-base" />
        <Button disabled={loading} onClick={invite} className="w-full sm:w-auto">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Inviting...
            </>
          ) : (
            'Invite'
          )}
        </Button>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">Invited members must register if they don't have an account before accepting.</div>

      <div className="border rounded-lg overflow-hidden">
        <div className="hidden sm:block">
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
                <tr><td className="p-3 text-gray-500" colSpan={4}>No members yet</td></tr>
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
        
        {/* Mobile view */}
        <div className="sm:hidden">
          {members.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No members yet</div>
          ) : (
            <div className="divide-y">
              {members.map((m) => (
                <div key={m.email} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{m.email}</div>
                    <span className={`capitalize px-2 py-1 rounded text-xs ${
                      m.status === 'active' ? 'bg-green-100 text-green-800' :
                      m.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last switched: {m.lastSwitchAt ? new Date(m.lastSwitchAt).toLocaleString() : '-'}
                  </div>
                  <div className="flex gap-2">
                    {m.status === 'invited' ? (
                      <Button variant="outline" size="sm" disabled={loading} onClick={async ()=>{ 
                        try { 
                          setLoading(true); 
                          await fetch(`${API_BASE}/team/invite?email=${encodeURIComponent(m.email)}`, { method: 'DELETE', headers: authHeader() }); 
                          toast({ title: 'Invite cancelled' }); 
                          setInviteStatus(prev => ({ ...prev, [m.email]: 'cancelled' }));
                          await fetchMembers(); 
                        } finally { setLoading(false); } 
                      }} className="flex-1">Cancel invite</Button>
                    ) : (
                      <Button variant="destructive" size="sm" disabled={loading} onClick={async ()=>{
                        try {
                          setLoading(true);
                          await fetch(`${API_BASE}/team/member?email=${encodeURIComponent(m.email)}`, { method: 'DELETE', headers: authHeader() });
                          toast({ title: 'Member removed' });
                          await fetchMembers();
                        } finally { setLoading(false); }
                      }} className="flex-1">Remove</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [editingTeam, setEditingTeam] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [logs, setLogs] = React.useState<any[]>([]);
  const [showLogs, setShowLogs] = React.useState(false);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

  const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const res = await fetch(`${API_BASE}/teams`, { headers: authHeader() });
      const json = await res.json();
      if (json?.success) setTeams(json.data || []);
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch(`${API_BASE}/team/logs`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) {
      toast({ title: 'Failed to fetch logs', variant: 'destructive' });
    } finally {
      setLogsLoading(false);
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

  if (initialLoading) {
    return (
      <div className="grid gap-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="hidden sm:block">
            <div className="bg-gray-50 p-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="sm:hidden">
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="text-xs sm:text-sm text-muted-foreground">Select your active workspace. Invites you accept will appear here after joining.</div>
      <div className="border rounded-lg overflow-hidden">
        <div className="hidden sm:block">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowLogs(true);
                            fetchLogs();
                          }}
                          disabled={loading}
                        >
                          {logsLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            'View Logs'
                          )}
                        </Button>
                        {activeId === String(t._id) && (
                          <span className="text-green-600 text-xs">Active</span>
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
        
        {/* Mobile view */}
        <div className="sm:hidden">
          {teams.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="font-medium text-sm">No workspaces yet</p>
              <p className="text-xs mt-1">Invites you accept will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((t: any) => (
                <div key={t._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{t.name || 'Workspace'}</div>
                      <div className="text-xs text-gray-500">Owner: {t.ownerId?.slice(-6)}</div>
                    </div>
                    {activeId === String(t._id) && (
                      <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Active</span>
                    )}
                  </div>
                  
                  {editingTeam === t._id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Workspace name"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={loading} className="flex-1 h-9">Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 h-9">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {t.ownerId === uid ? (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowLogs(true);
                              fetchLogs();
                            }}
                            disabled={loading}
                            className="w-full h-9 text-xs font-medium"
                          >
                            {logsLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                View Activity Logs
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(t)}
                            disabled={loading}
                            className="w-full h-9 text-xs"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Rename Workspace
                          </Button>
                        </div>
                      ) : activeId === String(t._id) ? (
                        <div className="text-center py-2">
                          <span className="text-green-600 text-sm font-medium">Currently Active</span>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={loading} 
                          onClick={()=>setActive(String(t._id))} 
                          className="w-full h-9 text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Switch to This Workspace
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs Viewer Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden mx-2 sm:mx-4 lg:mx-0 w-[95vw] sm:w-full">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Workspace Activity Logs</DialogTitle>
            <DialogDescription className="text-sm">
              Recent activity in this workspace
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[65vh] -mx-2 sm:mx-0">
            {logsLoading ? (
              <div className="space-y-3 px-2 sm:px-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="font-medium">No activity logs found</p>
                <p className="text-xs mt-1">Activity will appear here as it happens</p>
              </div>
            ) : (
              <div className="space-y-3 px-2 sm:px-0">
                {logs.map((log, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium capitalize text-sm sm:text-base text-gray-900">
                          {log.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        {log.actorEmail && `by ${log.actorEmail}`}
                        {log.meta?.name && ` to "${log.meta.name}"`}
                      </div>
                    </div>
                      <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {new Date(log.at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowLogs(false)} className="w-full sm:w-auto">
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
    <div className="space-y-4 sm:space-y-6 animate-enter">
      <h1 className="text-xl sm:text-2xl font-semibold">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full min-w-max sm:w-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Profile</TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Payouts</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Team</TabsTrigger>
            <TabsTrigger value="workspaces" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Workspaces</TabsTrigger>
            <TabsTrigger value="fraud" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Fraud</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
      {/* Debug info - remove this after testing */}
      {!user?.email && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <p className="text-yellow-800 text-xs sm:text-sm">
            <strong>Note:</strong> If your email is not showing, please log out and log back in to refresh your session.
          </p>
        </div>
      )}

      {/* Account section */}
      <Card className="glass-panel">
        <CardHeader><CardTitle className="text-lg sm:text-xl">Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:gap-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label className="text-sm sm:text-base">First name</Label>
                <Input {...register("firstName")} className="text-sm sm:text-base" />
                {errors.firstName && <p className="text-xs sm:text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-sm sm:text-base">Last name</Label>
                <Input {...register("lastName")} className="text-sm sm:text-base" />
                {errors.lastName && <p className="text-xs sm:text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label className="text-sm sm:text-base">Email address</Label>
                <Input 
                  type="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-gray-50 text-gray-600 text-sm sm:text-base"
                  placeholder="Loading email..."
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed from this page</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm sm:text-base">Phone</Label>
                <Input {...register("phone")} className="text-sm sm:text-base" />
              </div>
            </div>

            {/* Avatar */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-full bg-[#0a164d]/10 flex items-center justify-center text-[#0a164d] font-bold overflow-hidden mx-auto sm:mx-0">
                {avatarPreviewUrl || normalizedAvatar ? (
                  <img
                    src={avatarPreviewUrl || (normalizedAvatar?.startsWith('http') ? normalizedAvatar : `https://transactlab-backend.onrender.com/${normalizedAvatar}`)}
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
                <Label className="text-sm sm:text-base">Avatar</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="text-sm sm:text-base"
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
                <CardHeader><CardTitle className="text-sm sm:text-base">Preferences</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm sm:text-base">Language</Label>
                    <Select value={watch("language")} onValueChange={(v)=>setValue("language", v)}>
                      <SelectTrigger className="text-sm sm:text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {languages.map(l=> (<SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm sm:text-base">Timezone</Label>
                    <Select value={watch("timezone")} onValueChange={(v)=>setValue("timezone", v)}>
                      <SelectTrigger className="text-sm sm:text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timezones.map(t=> (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                    <Label className="text-sm sm:text-base">Default currency</Label>
                    <Select value={watch("currency")} onValueChange={(v)=>setValue("currency", v)}>
                      <SelectTrigger className="text-sm sm:text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencies.map(c=> (<SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button type="submit" className="w-full sm:w-auto">Save changes</Button>
              <Button type="button" variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Payout settings</CardTitle></CardHeader>
            <CardContent className="space-y-6 sm:space-y-8">
              {/* Payout methods */}
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Select a default payout method</div>
                <div className="grid gap-3 max-w-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 sm:p-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0a164d]/10 flex items-center justify-center font-semibold text-[#0a164d]">🏦</div>
                      <div>
                        <div className="font-medium text-sm sm:text-base">Bank Account</div>
                        <div className="text-xs text-muted-foreground">{connectedBank ? `**** ${connectedBank.last4} NGN` : 'Not connected'}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=>setShowBankConnect(true)} className="w-full sm:w-auto">{connectedBank ? 'Change' : 'Connect'}</Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 sm:p-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-semibold text-blue-600">PP</div>
                      <div>
                        <div className="font-medium text-sm sm:text-base">PayPal</div>
                        <div className="text-xs text-muted-foreground">{connectedPaypal ? connectedPaypal.email : 'Connect your PayPal account'}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=>setShowPaypalConnect(true)} className="w-full sm:w-auto">{connectedPaypal ? 'Change' : 'Connect'}</Button>
                  </div>
                </div>
              </div>

              {/* Payout invoice info */}
              <div className="space-y-2 max-w-3xl">
                <div className="font-medium text-sm sm:text-base">Payout invoice info</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Optional. Information added here, such as your business name, address, Tax ID number, etc. will be included when generating a payout invoice.</div>
                <textarea className="w-full min-h-[100px] sm:min-h-[120px] border rounded-md p-3 text-sm" placeholder="Enter your business name, address, Tax ID number, etc." />
              </div>

              {/* Payout history (empty state) */}
              <div className="space-y-2">
                <div className="font-medium text-sm sm:text-base">Payout history</div>
                <div className="text-xs sm:text-sm text-muted-foreground">No payouts yet.</div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2">
                <Button variant="outline" onClick={()=>setShowFantasy(true)} className="w-full sm:w-auto">Test payout</Button>
                <Button onClick={()=>setShowFantasy(true)} className="w-full sm:w-auto">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Fantasy dialog */}
          <Dialog open={showFantasy} onOpenChange={setShowFantasy}>
            <DialogContent className="mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Oops… this is a fantasy world</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-700">
                Don't worry — you'll have that kind of money soon. This is the TransactLab sandbox, so payouts are simulated for testing purposes only.
              </div>
              <DialogFooter>
                <Button onClick={()=>setShowFantasy(false)} className="w-full sm:w-auto">Got it</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect Bank dialog */}
          <Dialog open={showBankConnect} onOpenChange={setShowBankConnect}>
            <DialogContent className="mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Connect bank account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label className="text-sm sm:text-base">Bank</Label>
                  <Input value={bankForm.bank} onChange={(e)=>setBankForm(v=>({...v, bank: e.target.value}))} className="text-sm sm:text-base" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-sm sm:text-base">Account number</Label>
                  <Input value={bankForm.accountNumber} onChange={(e)=>setBankForm(v=>({...v, accountNumber: e.target.value}))} placeholder="0001234567" className="text-sm sm:text-base" />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={()=>setShowBankConnect(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={()=>{ setConnectedBank({ bank: bankForm.bank, last4: (bankForm.accountNumber||'').slice(-4).padStart(4,'*') }); setShowBankConnect(false); toast({ title: 'Bank connected', description: 'Sandbox connection successful' }); }} className="w-full sm:w-auto">Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect PayPal dialog */}
          <Dialog open={showPaypalConnect} onOpenChange={setShowPaypalConnect}>
            <DialogContent className="mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Connect PayPal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label className="text-sm sm:text-base">PayPal email</Label>
                  <Input type="email" value={paypalForm.email} onChange={(e)=>setPaypalForm({ email: e.target.value })} placeholder="you@example.com" className="text-sm sm:text-base" />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={()=>setShowPaypalConnect(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={()=>{ setConnectedPaypal({ email: paypalForm.email }); setShowPaypalConnect(false); toast({ title: 'PayPal connected', description: 'Sandbox connection successful' }); }} className="w-full sm:w-auto">Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Team</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:gap-6 max-w-2xl">
              <TeamSection />
            </CardContent>
          </Card>
        </TabsContent>


        {/* Workspaces */}
        <TabsContent value="workspaces">
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Workspaces</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:gap-6 max-w-2xl">
              <WorkspaceSection />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud */}
        <TabsContent value="fraud">
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Fraud Controls (Sandbox)</CardTitle></CardHeader>
            <CardContent className="grid gap-6 sm:gap-8">
              <FraudSettingsSection />
              <FraudSummarySection />
              <FraudReviewSection />
            </CardContent>
          </Card>
        </TabsContent>

        

      </Tabs>
    </div>
  );
};

export default Profile;

// --- Fraud Settings Section ---
const MagicSdkWizardSection: React.FC = () => {
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/magic-sdk';
  const [loading, setLoading] = React.useState(false);
  const [successUrl, setSuccessUrl] = React.useState('');
  const [cancelUrl, setCancelUrl] = React.useState('');
  const [callbackUrl, setCallbackUrl] = React.useState('');
  const [frontendUrl, setFrontendUrl] = React.useState('');
  const [sandboxSecret, setSandboxSecret] = React.useState('');
  const [encrypt, setEncrypt] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);

  const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const bake = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch(`${API_BASE}/bake`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ successUrl, cancelUrl, callbackUrl, frontendUrl, sandboxSecret, encrypt })
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Bake failed');
      setResult(json?.data || null);
      toast({ title: 'SDK config generated', description: 'Copy the config below or use the CLI.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Bake failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: 'Copied to clipboard' }); } catch {}
  };

  return (
    <div className="grid gap-6">
      <div className="text-sm text-muted-foreground">Provide your sandbox URLs and secret. We will generate a config and a suggested CLI command.</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Success URL</Label>
          <Input placeholder="https://yourapp.com/success" value={successUrl} onChange={(e)=>setSuccessUrl(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Cancel URL</Label>
          <Input placeholder="https://yourapp.com/cancel" value={cancelUrl} onChange={(e)=>setCancelUrl(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Callback URL (webhooks)</Label>
          <Input placeholder="https://yourapp.com/webhooks/transactlab" value={callbackUrl} onChange={(e)=>setCallbackUrl(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Frontend URL</Label>
          <Input placeholder="https://yourapp.com" value={frontendUrl} onChange={(e)=>setFrontendUrl(e.target.value)} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label>Sandbox Secret (x-sandbox-secret)</Label>
          <Input placeholder="sk_test_..." value={sandboxSecret} onChange={(e)=>setSandboxSecret(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Switch checked={encrypt} onCheckedChange={setEncrypt} />
          <span className="text-sm">Encrypt configuration vault</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={bake} disabled={loading}>Generate SDK Config</Button>
      </div>

      {result && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Suggested CLI</Label>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-gray-50 border rounded text-sm overflow-x-auto">{result.suggestedCli}</code>
              <Button size="sm" variant="outline" onClick={()=>copy(result.suggestedCli)}>Copy</Button>
            </div>
          </div>
          {Array.isArray(result.files) && result.files.map((f: any) => (
            <div className="grid gap-2" key={f.path}>
              <Label>{f.path}</Label>
              <textarea className="w-full min-h-[200px] border rounded-md p-2 text-xs font-mono" readOnly value={f.contents} />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={()=>copy(f.contents)}>Copy file</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Fraud Settings Section ---
const FraudSettingsSection: React.FC = () => {
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(true);
  const [block, setBlock] = React.useState(70);
  const [review, setReview] = React.useState(50);
  const [flag, setFlag] = React.useState(30);

  const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const load = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const res = await fetch(`${API_BASE}/fraud/settings`, { headers: headers() });
      const json = await res.json();
      if (json?.success && json.data?.fraud) {
        setEnabled(!!json.data.fraud.enabled);
        setBlock(Number(json.data.fraud.blockThreshold ?? 70));
        setReview(Number(json.data.fraud.reviewThreshold ?? 50));
        setFlag(Number(json.data.fraud.flagThreshold ?? 30));
      }
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
  };

  React.useEffect(() => { void load(); }, []);

  const save = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/fraud/settings`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ enabled, blockThreshold: block, reviewThreshold: review, flagThreshold: flag })
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Failed to save');
      toast({ title: 'Saved', description: 'Fraud settings updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Save failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (initialLoading) {
  return (
    <div className="grid gap-4">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
          <div className="flex items-center justify-between border rounded-lg p-3 sm:p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-11 animate-pulse"></div>
          </div>
          <div className="border rounded-lg p-3 sm:p-4">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="font-medium text-sm sm:text-base">Settings</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
        <div className="flex items-center justify-between border rounded-lg p-3 sm:p-4">
          <div>
            <div className="font-medium text-sm sm:text-base">Enable fraud checks</div>
            <div className="text-xs text-muted-foreground">Applies to sandbox payment simulations</div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="font-medium mb-3 text-sm sm:text-base">Thresholds</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label className="text-xs sm:text-sm">Block ≥</Label>
              <Input type="number" value={block} onChange={(e)=>setBlock(Number(e.target.value))} className="text-sm sm:text-base" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs sm:text-sm">Review ≥</Label>
              <Input type="number" value={review} onChange={(e)=>setReview(Number(e.target.value))} className="text-sm sm:text-base" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs sm:text-sm">Flag ≥</Label>
              <Input type="number" value={flag} onChange={(e)=>setFlag(Number(e.target.value))} className="text-sm sm:text-base" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <Button onClick={save} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save settings'
          )}
        </Button>
      </div>
    </div>
  );
};

// --- Fraud Summary Section ---
const FraudSummarySection: React.FC = () => {
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [totals, setTotals] = React.useState<any | null>(null);
  const [factors, setFactors] = React.useState<any[]>([]);

  const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` });

  const load = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const [sumRes, decRes] = await Promise.all([
        fetch(`${API_BASE}/fraud/summary`, { headers: headers() }),
        fetch(`${API_BASE}/fraud/decisions`, { headers: headers() })
      ]);
      const sumJson = await sumRes.json();
      const fac = sumJson?.data?.topFactors || [];
      setFactors(fac);
      setTotals(sumJson?.data?.totals || null);
      // decisions list is available in FraudReviewSection
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
  };

  React.useEffect(() => { void load(); }, []);

  if (initialLoading) {
  return (
    <div className="grid gap-4">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-3 sm:p-4">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
          ))}
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="hidden sm:block">
            <div className="bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="sm:hidden">
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="font-medium text-sm sm:text-base">Summary</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Decisions (7d)</div>
          <div className="text-xl sm:text-2xl font-semibold">{totals?.count ?? 0}</div>
        </div>
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Avg score</div>
          <div className="text-xl sm:text-2xl font-semibold">{totals?.avgScore ? totals.avgScore.toFixed(1) : '0.0'}</div>
        </div>
        <div className="border rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-xs sm:text-sm text-muted-foreground">Blocked / Reviewed / Flagged</div>
          <div className="text-lg sm:text-2xl font-semibold">{(totals?.blocked ?? 0)} / {(totals?.reviewed ?? 0)} / {(totals?.flagged ?? 0)}</div>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Top risk factors</th>
              <th className="text-right p-3">Count</th>
            </tr>
          </thead>
          <tbody>
            {factors.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={2}>No data</td></tr>
            ) : factors.map((f)=> (
              <tr key={f._id}>
                <td className="p-3">{f._id}</td>
                <td className="p-3 text-right">{f.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {/* Mobile view */}
        <div className="sm:hidden">
          {factors.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No data</div>
          ) : (
            <div className="divide-y">
              {factors.map((f) => (
                <div key={f._id} className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{f._id}</span>
                  <span className="text-sm text-muted-foreground">{f.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Fraud Review Section ---
const FraudReviewSection: React.FC = () => {
  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);

  const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 'Content-Type': 'application/json' });

  const load = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const res = await fetch(`${API_BASE}/fraud/reviews?status=pending`, { headers: headers() });
      const json = await res.json();
      setItems(json?.data?.reviews || []);
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
  };

  React.useEffect(() => { void load(); }, []);

  const act = async (id: string, action: 'approve'|'deny') => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/fraud/reviews/${id}/${action}`, { method: 'POST', headers: headers() });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Action failed');
      toast({ title: `Review ${action}d` });
      await load();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Action failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (initialLoading) {
  return (
    <div className="grid gap-4">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="border rounded-lg overflow-hidden">
          <div className="hidden sm:block">
            <div className="space-y-4 p-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="flex flex-wrap gap-1">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded w-14 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-6">
                      <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sm:hidden">
            <div className="space-y-4 p-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="flex flex-wrap gap-1">
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      <div className="h-9 bg-gray-200 rounded flex-1 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="font-medium text-sm sm:text-base">Review queue</div>
      <div className="border rounded-lg overflow-hidden">
        <div className="hidden sm:block">
            {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                  </div>
              <p className="font-medium text-lg">No pending reviews</p>
              <p className="text-sm mt-1">All transactions have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((r) => (
                <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-gray-500 mb-1">Session ID</div>
                      <div className="font-medium text-sm text-gray-900 mb-3">{r.sessionId}</div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          r.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          r.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {r.riskLevel} ({r.riskScore})
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-2">Risk Factors</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(r.factors) && r.factors.length > 0 ? (
                            r.factors.map((factor, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                                {factor}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 italic">No specific factors identified</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-6">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={loading} 
                        onClick={()=>act(r._id, 'approve')} 
                        className="h-9 px-4 text-sm font-medium"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        disabled={loading} 
                        onClick={()=>act(r._id, 'deny')} 
                        className="h-9 px-4 text-sm font-medium"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Deny
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Mobile view */}
        <div className="sm:hidden">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">No pending reviews</p>
              <p className="text-xs mt-1">All transactions have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((r) => (
                <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with session ID and risk badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-gray-500 mb-1">Session ID</div>
                      <div className="font-medium text-sm text-gray-900 truncate">{r.sessionId}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      r.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {r.riskLevel} ({r.riskScore})
                    </div>
                  </div>

                  {/* Risk factors */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Risk Factors</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(r.factors) && r.factors.length > 0 ? (
                        r.factors.map((factor, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                            {factor}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">No specific factors identified</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={loading} 
                      onClick={()=>act(r._id, 'approve')} 
                      className="flex-1 h-9 text-sm font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      disabled={loading} 
                      onClick={()=>act(r._id, 'deny')} 
                      className="flex-1 h-9 text-sm font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Deny
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
