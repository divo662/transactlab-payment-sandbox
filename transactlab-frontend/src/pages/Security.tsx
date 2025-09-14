import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      const token = localStorage.getItem('accessToken');
      
      // Load security settings
      const settingsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSecuritySettings(settingsData.data.securitySettings);
        setTotpEnabled(settingsData.data.totpEnabled);
      }

      // Load trusted devices
      const devicesResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        setDevices(devicesData.data.devices);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleTotpSetup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/totp/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTotpSetup(data.data);
        setShowTotpSetup(true);
        toast.success('TOTP setup generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to setup TOTP');
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
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/totp/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: totpCode })
      });

      if (response.ok) {
        setTotpEnabled(true);
        setShowTotpSetup(false);
        setTotpCode('');
        toast.success('Two-Factor Authentication enabled successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Invalid TOTP code');
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
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/totp`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setTotpEnabled(false);
        setPassword('');
        toast.success('Two-Factor Authentication disabled successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to disable TOTP');
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
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDevices(devices.filter(device => device.deviceId !== deviceId));
        toast.success('Device removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to remove device');
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
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/security/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSecuritySettings({ ...securitySettings, ...newSettings });
        toast.success('Security settings updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update settings');
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>

          {/* Overview Tab Skeleton */}
          <div className="space-y-6">
            {/* Security Status Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Recommendations Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-1"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8 mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading security data...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Center</h1>
        <p className="text-gray-600">Manage your account security settings and monitor login activity</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="two-factor">Two-Factor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Security Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {totpEnabled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Protected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">At Risk</span>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trusted Devices</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {devices.length === 0 ? 'No trusted devices' : 'Devices with saved login'}
                </p>
              </CardContent>
            </Card>

            {/* Login Notifications Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Login Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {securitySettings.notifyOnNewDevice ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Disabled</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {securitySettings.notifyOnNewDevice ? 'You will be notified of new logins' : 'Enable to receive login alerts'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Security Recommendations</span>
              </CardTitle>
              <CardDescription>Improve your account security with these recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!totpEnabled && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Two-Factor Authentication:</strong> Add an extra layer of security to your account by enabling 2FA with Google Authenticator.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setActiveTab('two-factor')}
                    >
                      Enable 2FA
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {!securitySettings.notifyOnNewDevice && (
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Login Notifications:</strong> Get notified when someone logs into your account from a new device.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
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
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Trusted Devices</span>
              </CardTitle>
              <CardDescription>
                Manage devices that have access to your account. Remove any devices you don't recognize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Trusted Devices</h3>
                  <p className="text-gray-500">When you log in from a new device, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{device.deviceName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{getLocationString(device.location)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Last used: {formatDate(device.lastUsed)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {device.isTrusted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Trusted
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.deviceId)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <TabsContent value="two-factor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account with Google Authenticator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!totpEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Google Authenticator</h4>
                        <p className="text-sm text-gray-500">Use your mobile device to generate security codes</p>
                      </div>
                    </div>
                    <Button onClick={handleTotpSetup} disabled={loading}>
                      {loading ? 'Setting up...' : 'Enable 2FA'}
                    </Button>
                  </div>

                  {showTotpSetup && totpSetup && (
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900">Setup Instructions</h4>
                      <div className="space-y-3">
                        <p className="text-sm text-blue-800">1. Install Google Authenticator on your mobile device</p>
                        <p className="text-sm text-blue-800">2. Scan this QR code with the app:</p>
                        <div className="flex justify-center">
                          <img src={totpSetup.qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                        </div>
                        <p className="text-sm text-blue-800">3. Enter the 6-digit code from the app:</p>
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            placeholder="123456"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            className="w-32"
                            maxLength={6}
                          />
                          <Button onClick={handleTotpVerify} disabled={loading || totpCode.length !== 6}>
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
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your security preferences and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone logs into your account from a new device
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.notifyOnNewDevice}
                    onCheckedChange={(checked) => handleUpdateSettings({ notifyOnNewDevice: checked })}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow New Device Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow login from devices that haven't been trusted before
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.allowNewDeviceLogin}
                    onCheckedChange={(checked) => handleUpdateSettings({ allowNewDeviceLogin: checked })}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Force all users to enable 2FA for their accounts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={(checked) => handleUpdateSettings({ requireTwoFactor: checked })}
                    disabled={loading}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users after this many minutes
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleUpdateSettings({ sessionTimeout: parseInt(e.target.value) })}
                      className="w-24"
                      min="5"
                      max="1440"
                      disabled={loading}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Max Concurrent Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum number of active sessions allowed per user
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={securitySettings.maxConcurrentSessions}
                      onChange={(e) => handleUpdateSettings({ maxConcurrentSessions: parseInt(e.target.value) })}
                      className="w-24"
                      min="1"
                      max="20"
                      disabled={loading}
                    />
                    <span className="text-sm text-muted-foreground">sessions</span>
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
