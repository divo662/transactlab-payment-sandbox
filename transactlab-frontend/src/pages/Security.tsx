import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiService from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  QrCode,
  Key,
  Settings,
  Bell,
  Lock,
  Smartphone as MobileIcon,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  lastUsed: string;
  isTrusted: boolean;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

interface SecuritySettings {
  requireEmailVerification: boolean;
  allowNewDeviceLogin: boolean;
  notifyOnNewDevice: boolean;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
}

interface TotpSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

const Security: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Data state
  const [devices, setDevices] = useState<Device[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    requireEmailVerification: true,
    allowNewDeviceLogin: true,
    notifyOnNewDevice: true,
    requireTwoFactor: false,
    sessionTimeout: 60,
    maxConcurrentSessions: 5
  });

  // Load security data on component mount
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security settings
      const settingsData = await apiService.getSecuritySettings();
      if (settingsData && settingsData.success && settingsData.data) {
        // Safely access securitySettings with fallback to default values
        const receivedSettings = settingsData.data.securitySettings;
        if (receivedSettings) {
          setSecuritySettings({
            requireEmailVerification: receivedSettings.requireEmailVerification ?? true,
            allowNewDeviceLogin: receivedSettings.allowNewDeviceLogin ?? true,
            notifyOnNewDevice: receivedSettings.notifyOnNewDevice ?? true,
            requireTwoFactor: receivedSettings.requireTwoFactor ?? false,
            sessionTimeout: receivedSettings.sessionTimeout ?? 60,
            maxConcurrentSessions: receivedSettings.maxConcurrentSessions ?? 5
          });
        }
        setTotpEnabled(settingsData.data.totpEnabled ?? false);
      } else {
        // If API fails, keep default values
        console.warn('Failed to load security settings, using defaults');
      }

      // Load trusted devices
      const devicesData = await apiService.getTrustedDevices();
      if (devicesData && devicesData.success && devicesData.data) {
        setDevices(devicesData.data.devices || []);
      } else {
        // If API fails, keep empty array
        setDevices([]);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
      // Ensure we have fallback values even on error
      setDevices([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleTotpSetup = async () => {
    try {
      setLoading(true);
      
      const data = await apiService.setupTotp();
      
      if (data.success) {
        setTotpSetup(data.data);
        setShowTotpSetup(true);
        toast.success('TOTP setup generated successfully');
      } else {
        toast.error(data.message || 'Failed to setup TOTP');
      }
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      toast.error('Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpVerify = async () => {
    try {
      setLoading(true);
      
      const data = await apiService.verifyTotp({ code: totpCode });
      
      if (data.success) {
        setTotpEnabled(true);
        setShowTotpSetup(false);
        setTotpCode('');
        toast.success('Two-Factor Authentication enabled successfully');
      } else {
        toast.error(data.message || 'Invalid TOTP code');
      }
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      toast.error('Failed to verify TOTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    try {
      setLoading(true);
      
      const data = await apiService.disableTotp();
      
      if (data.success) {
        setTotpEnabled(false);
        setPassword('');
        toast.success('Two-Factor Authentication disabled successfully');
      } else {
        toast.error(data.message || 'Failed to disable TOTP');
      }
    } catch (error) {
      console.error('Error disabling TOTP:', error);
      toast.error('Failed to disable TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      setLoading(true);
      
      const data = await apiService.removeTrustedDevice(deviceId);
      
      if (data.success) {
        setDevices(devices.filter(device => device.deviceId !== deviceId));
        toast.success('Device removed successfully');
      } else {
        toast.error(data.message || 'Failed to remove device');
      }
    } catch (error) {
      console.error('Error removing device:', error);
      toast.error('Failed to remove device');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      setLoading(true);
      
      const data = await apiService.updateSecuritySettings(newSettings);
      
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, ...newSettings }));
        toast.success('Security settings updated successfully');
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <MobileIcon className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Smartphone className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationString = (location?: { country?: string; city?: string; region?: string }) => {
    if (!location) return 'Unknown Location';
    const parts = [location.city, location.region, location.country].filter(Boolean);
    return parts.join(', ') || 'Unknown Location';
  };

  if (initialLoading) {
    return (
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mb-2 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-72 sm:w-96 animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>

          {/* Overview Tab Skeleton */}
          <div className="space-y-4 sm:space-y-6">
            {/* Security Status Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 animate-pulse"></div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 animate-pulse"></div>
                      </div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-36 sm:w-48 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Recommendations Skeleton */}
            <Card>
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-40 sm:w-48 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-80 animate-pulse"></div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse mt-1"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-48 sm:w-64 animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-72 sm:w-96 animate-pulse"></div>
                        <div className="h-7 sm:h-8 bg-gray-200 rounded w-20 sm:w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-6 sm:py-8 mt-6 sm:mt-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#0a164d] mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Loading security data...</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Security Center</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account security settings and monitor login activity</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-3">Overview</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs sm:text-sm py-2 sm:py-3">Devices</TabsTrigger>
          <TabsTrigger value="two-factor" className="text-xs sm:text-sm py-2 sm:py-3">Two-Factor</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 sm:py-3">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Security Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="flex items-center space-x-2">
                  {totpEnabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      <span className="text-xs sm:text-sm font-medium text-green-700">Protected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      <span className="text-xs sm:text-sm font-medium text-red-700">At Risk</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totpEnabled ? 'Two-Factor Authentication enabled' : 'Enable 2FA for better security'}
                </p>
              </CardContent>
            </Card>

            {/* Trusted Devices Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Trusted Devices</CardTitle>
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold">{devices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {devices.length === 0 ? 'No trusted devices' : 'Devices with saved login'}
                </p>
              </CardContent>
            </Card>

            {/* Login Notifications Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Login Alerts</CardTitle>
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="flex items-center space-x-2">
                  {securitySettings?.notifyOnNewDevice ? (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      <span className="text-xs sm:text-sm font-medium text-green-700">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      <span className="text-xs sm:text-sm font-medium text-red-700">Disabled</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {securitySettings?.notifyOnNewDevice ? 'You will be notified of new logins' : 'Enable to receive login alerts'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Recommendations */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span>Security Recommendations</span>
              </CardTitle>
              <CardDescription className="text-sm">Improve your account security with these recommendations</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
              {!totpEnabled && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Two-Factor Authentication:</strong> Add an extra layer of security to your account by enabling 2FA with Google Authenticator.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 text-xs sm:text-sm h-7 sm:h-8"
                      onClick={() => setActiveTab('two-factor')}
                    >
                      Enable 2FA
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {!securitySettings?.notifyOnNewDevice && (
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Login Notifications:</strong> Get notified when someone logs into your account from a new device.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 text-xs sm:text-sm h-7 sm:h-8"
                      onClick={() => setActiveTab('settings')}
                    >
                      Enable Alerts
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {devices.length === 0 && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    <strong>No Trusted Devices:</strong> When you log in from a device, it will be automatically added to your trusted devices list.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Trusted Devices</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Manage devices that have access to your account. Remove any devices you don't recognize.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Trusted Devices</h3>
                  <p className="text-gray-500">When you log in from a new device, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {devices.map((device) => (
                    <div key={device.deviceId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{device.deviceName}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{getLocationString(device.location)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Last used: {formatDate(device.lastUsed)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        {device.isTrusted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Trusted
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.deviceId)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Two-Factor Authentication Tab */}
        <TabsContent value="two-factor" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Add an extra layer of security to your account with Google Authenticator.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6">
              {!totpEnabled ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm sm:text-base">Google Authenticator</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Use your mobile device to generate security codes</p>
                      </div>
                    </div>
                    <Button onClick={handleTotpSetup} disabled={loading} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                      {loading ? 'Setting up...' : 'Enable 2FA'}
                    </Button>
                  </div>

                  {showTotpSetup && totpSetup && (
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900 text-sm sm:text-base">Setup Instructions</h4>
                      <div className="space-y-2 sm:space-y-3">
                        <p className="text-xs sm:text-sm text-blue-800">1. Install Google Authenticator on your mobile device</p>
                        <p className="text-xs sm:text-sm text-blue-800">2. Scan this QR code with the app:</p>
                        <div className="flex justify-center">
                          <img src={totpSetup.qrCode} alt="QR Code" className="w-36 h-36 sm:w-48 sm:h-48 border rounded-lg" />
                        </div>
                        <p className="text-xs sm:text-sm text-blue-800">3. Enter the 6-digit code from the app:</p>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Input
                            type="text"
                            placeholder="123456"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            className="w-full sm:w-32 text-center"
                            maxLength={6}
                          />
                          <Button onClick={handleTotpVerify} disabled={loading || totpCode.length !== 6} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                            {loading ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-900">Two-Factor Authentication Enabled</h4>
                        <p className="text-sm text-green-700">Your account is protected with 2FA</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>

                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Backup Codes:</strong> Save these codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowBackupCodes(!showBackupCodes)}
                      >
                        {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
                      </Button>
                    </div>

                    {showBackupCodes && totpSetup?.backupCodes && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg bg-gray-50">
                        {totpSetup.backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-white border rounded text-center font-mono text-sm">
                            {code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-red-900">Danger Zone</h4>
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-red-900">Disable Two-Factor Authentication</h5>
                          <p className="text-sm text-red-700">This will make your account less secure</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-40"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDisableTotp}
                            disabled={loading || !password}
                          >
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your security preferences and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="space-y-1">
                    <Label className="text-sm sm:text-base">Login Notifications</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Get notified when someone logs into your account from a new device
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.notifyOnNewDevice ?? false}
                    onCheckedChange={(checked) => handleUpdateSettings({ notifyOnNewDevice: checked })}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="space-y-1">
                    <Label className="text-sm sm:text-base">Allow New Device Login</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Allow login from devices that haven't been trusted before
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.allowNewDeviceLogin ?? true}
                    onCheckedChange={(checked) => handleUpdateSettings({ allowNewDeviceLogin: checked })}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="space-y-1">
                    <Label className="text-sm sm:text-base">Require Two-Factor Authentication</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Force all users to enable 2FA for their accounts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.requireTwoFactor ?? false}
                    onCheckedChange={(checked) => handleUpdateSettings({ requireTwoFactor: checked })}
                    disabled={loading}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Session Timeout</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatically log out inactive users after this many minutes
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      type="number"
                      value={securitySettings?.sessionTimeout ?? 60}
                      onChange={(e) => handleUpdateSettings({ sessionTimeout: parseInt(e.target.value) })}
                      className="w-full sm:w-24 text-sm"
                      min="5"
                      max="1440"
                      disabled={loading}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Max Concurrent Sessions</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Maximum number of active sessions allowed per user
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      type="number"
                      value={securitySettings?.maxConcurrentSessions ?? 5}
                      onChange={(e) => handleUpdateSettings({ maxConcurrentSessions: parseInt(e.target.value) })}
                      className="w-full sm:w-24 text-sm"
                      min="1"
                      max="20"
                      disabled={loading}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">sessions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Security;
