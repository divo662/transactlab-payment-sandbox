import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SearchModal } from "@/components/ui/search-modal";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { useWorkspaceInvites } from "@/contexts/WorkspaceInviteContext";
import WorkspaceInviteNotification from "@/components/WorkspaceInviteNotification";
import { Search, Command } from "lucide-react";

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const avatarPath = user?.avatar ? String(user.avatar).replace(/\\/g, "/") : undefined;
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeOwner = typeof window !== 'undefined' ? localStorage.getItem('activeOwnerId') : null;
  const activeTeamName = typeof window !== 'undefined' ? localStorage.getItem('activeTeamName') : null;
  const isPersonal = !activeOwner || activeOwner === (user as any)?._id || activeOwner === (user as any)?.id;

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-14 px-2 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          
          {/* Centered Search Bar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-gray-300 transition-all duration-200"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span className="flex-1">Search for features, pages, and more...</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </button>
          </div>
          
          {/* Mobile Search Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Workspace badge - Hidden on mobile, shown on tablet+ */}
            <div className={`hidden sm:block px-2 py-1 rounded text-xs border ${isPersonal ? 'bg-gray-50 text-gray-600' : 'bg-[#0a164d]/10 text-[#0a164d] border-[#0a164d]/30'}`} title={isPersonal ? 'Personal workspace' : `Workspace: ${activeTeamName || 'Team'}`}>
              {isPersonal ? 'Personal' : (activeTeamName || 'Team')}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0a164d]/10 flex items-center justify-center text-[#0a164d] font-bold overflow-hidden">
              {avatarPath && !avatarError ? (
                <img
                  src={avatarPath.startsWith('http') ? avatarPath : `https://transactlab-backend.onrender.com/${avatarPath}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {(user?.firstName || 'D').charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

const AppLayout = () => {
  const { pendingInvites, acceptInvite, rejectInvite, dismissNotification, showNotification } = useWorkspaceInvites();
  const { user } = useAuth();
  const [kycTimeoutId, setKycTimeoutId] = useState<number | null>(null);

  const startKyc = async () => {
    try {
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/kyc/callback` : undefined;
      const res = await apiService.startKyc(returnUrl);
      const hostedUrl = res?.data?.hostedUrl;
      if (hostedUrl && typeof window !== 'undefined') {
        window.location.href = hostedUrl;
      }
    } catch (e) {
      console.warn('Failed to start KYC:', e);
    }
  };

  useEffect(() => {
    // Auto-redirect to KYC after 2 minutes if user hasn't acted
    // But don't redirect if we're on the KYC callback page
    if (user && user.isVerified && (user as any).isKycVerified === false) {
      const id = window.setTimeout(() => {
        // Check if we're on the KYC callback page
        if (window.kycCallbackActive) {
          console.log('AppLayout: Skipping KYC redirect - on callback page');
          return;
        }
        void startKyc();
      }, 120000);
      setKycTimeoutId(id);
      return () => {
        if (id) window.clearTimeout(id);
      };
    }
    return () => {};
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          {user && user.isVerified && (user as any).isKycVerified === false && (
            <div className="mx-2 sm:mx-4 lg:mx-6 mt-4 mb-0 p-3 sm:p-4 rounded-lg border bg-amber-50 border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="font-semibold text-sm sm:text-base">Complete your KYC verification</div>
                <div className="text-xs sm:text-sm opacity-90">For security, please verify your identity to continue using TransactLab. You will be redirected automatically in 2 minutes.</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => void startKyc()}
                  className="px-3 py-2 rounded-md bg-[#0a164d] text-white text-sm font-medium hover:bg-[#0a164d]/90 transition-colors w-full sm:w-auto"
                >
                  Complete KYC
                </button>
              </div>
            </div>
          )}
          <main className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Workspace Invitation Notifications */}
      {showNotification && pendingInvites.length > 0 && (
        <WorkspaceInviteNotification
          invites={pendingInvites}
          onAccept={acceptInvite}
          onReject={rejectInvite}
          onDismiss={dismissNotification}
        />
      )}
    </SidebarProvider>
  );
};

export default AppLayout;
