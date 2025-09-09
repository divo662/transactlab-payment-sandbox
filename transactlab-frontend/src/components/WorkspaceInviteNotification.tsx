import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Users, Check, XCircle } from 'lucide-react';
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

interface WorkspaceInviteNotificationProps {
  invites: PendingInvite[];
  onAccept: (teamId: string, token: string) => void;
  onReject: (token: string) => void;
  onDismiss: () => void;
}

const WorkspaceInviteNotification: React.FC<WorkspaceInviteNotificationProps> = ({
  invites,
  onAccept,
  onReject,
  onDismiss
}) => {
  const { toast } = useToast();

  if (invites.length === 0) return null;

  const handleAccept = async (teamId: string, token: string) => {
    try {
      onAccept(teamId, token);
      toast({ title: 'Invitation accepted', description: 'You can now switch to this workspace' });
    } catch (error) {
      toast({ title: 'Failed to accept invitation', variant: 'destructive' });
    }
  };

  const handleReject = async (token: string) => {
    try {
      onReject(token);
      toast({ title: 'Invitation rejected', description: 'The invitation has been declined' });
    } catch (error) {
      toast({ title: 'Failed to reject invitation', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {invites.map((invite) => (
        <Card key={invite.teamId} className="mb-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Workspace Invitation
                  </p>
                  <p className="text-sm text-gray-600">
                    You've been invited to join <span className="font-medium">{invite.teamName}</span>
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(invite.teamId, invite.invite.token)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(invite.invite.token)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorkspaceInviteNotification;
