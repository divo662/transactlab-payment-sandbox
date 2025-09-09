import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PendingInvite {
  teamId: string;
  teamName: string;
  ownerId: string;
  invite: {
    email: string;
    token: string;
    expiresAt: string;
  };
}

interface WorkspaceInviteContextType {
  pendingInvites: PendingInvite[];
  loading: boolean;
  fetchPendingInvites: () => Promise<void>;
  acceptInvite: (teamId: string, token: string) => Promise<void>;
  rejectInvite: (token: string) => Promise<void>;
  dismissNotification: () => void;
  showNotification: boolean;
}

const WorkspaceInviteContext = createContext<WorkspaceInviteContextType | undefined>(undefined);

export const useWorkspaceInvites = () => {
  const context = useContext(WorkspaceInviteContext);
  if (!context) {
    throw new Error('useWorkspaceInvites must be used within a WorkspaceInviteProvider');
  }
  return context;
};

export const WorkspaceInviteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const API_BASE = 'http://localhost:5000/api/v1/sandbox';

  const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchPendingInvites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/team/pending-invites`, {
        headers: authHeader()
      });
      const data = await response.json();
      
      if (data.success) {
        setPendingInvites(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (teamId: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/team/accept`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the accepted invite from the list
        setPendingInvites(prev => prev.filter(invite => invite.teamId !== teamId));
        toast({ title: 'Invitation accepted', description: 'You can now switch to this workspace' });
      } else {
        throw new Error(data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
      throw error;
    }
  };

  const rejectInvite = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/team/reject`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the rejected invite from the list
        setPendingInvites(prev => prev.filter(invite => invite.invite.token !== token));
        toast({ title: 'Invitation rejected', description: 'The invitation has been declined' });
      } else {
        throw new Error(data.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Failed to reject invite:', error);
      throw error;
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  // Fetch invites when user changes
  useEffect(() => {
    if (user) {
      fetchPendingInvites();
    }
  }, [user]);

  // Refresh invites every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchPendingInvites();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const value: WorkspaceInviteContextType = {
    pendingInvites,
    loading,
    fetchPendingInvites,
    acceptInvite,
    rejectInvite,
    dismissNotification,
    showNotification
  };

  return (
    <WorkspaceInviteContext.Provider value={value}>
      {children}
    </WorkspaceInviteContext.Provider>
  );
};
