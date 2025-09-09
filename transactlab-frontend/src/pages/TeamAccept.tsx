import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TeamAccept: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState<string>('Processing invite…');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const accept = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          // Redirect to registration; after auth, come back here to auto-accept
          sessionStorage.setItem('postLoginRedirect', location.pathname + location.search);
          navigate('/auth/register?invite=1');
          return;
        }
        const res = await fetch('https://transactlab-backend.onrender.com/api/v1/sandbox/team/accept', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        const json = await res.json();
        if (json?.success) {
          setMessage('You have joined the workspace. Redirecting…');
          setTimeout(() => navigate('/sandbox/transactions'), 1200);
        } else {
          setMessage(json?.message || 'Unable to accept invite.');
        }
      } catch (e: any) {
        setMessage(e?.message || 'Unexpected error.');
      }
    };
    if (token) void accept(); else setMessage('Invalid invite link.');
  }, [location, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="border rounded-xl p-6 shadow-sm text-center">
        <div className="text-xl font-semibold text-[#0a164d] mb-2">Team Invite</div>
        <p className="text-gray-600">{message}</p>
        <button className="mt-4 px-4 py-2 rounded bg-[#0a164d] text-white" onClick={()=>navigate('/')}>Go to Dashboard</button>
      </div>
    </div>
  );
};

export default TeamAccept;


