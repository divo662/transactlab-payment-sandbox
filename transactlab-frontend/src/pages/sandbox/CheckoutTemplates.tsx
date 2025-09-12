import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CloudinaryUpload from '@/components/ui/cloudinary-upload';
import { Palette, Building2, Layout, FileText, Eye, Save, ExternalLink } from 'lucide-react';

const defaultConfig = {
  theme: { brandColor: '#0a164d', accentColor: '#22c55e', backgroundStyle: 'solid' },
  brand: { companyName: '', logoUrl: '', supportEmail: '', supportUrl: '' },
  layout: { showItemized: true, showTrustBadges: true, showSupportBox: true, showLegal: true },
  legal: { termsUrl: '', privacyUrl: '' }
};

const CheckoutTemplates: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewSessionId, setPreviewSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('brand');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const st = await api.getCheckoutSettings();
      const s = st?.data || defaultConfig;
      setSettings(s);
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAll(); }, []);

  const saveSettings = async (updates: any) => {
    try {
      setLoading(true);
      const res = await api.updateCheckoutSettings(updates);
      setSettings(res.data);
      toast({ title: 'Saved', description: 'Settings updated successfully' });
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings((s: any) => {
      const newSettings = { ...s };
      const keys = path.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const loadPreview = async () => {
    try {
      // Ensure we have a dedicated preview session
      const sess = await api.createTemplatePreviewSession();
      const sid = sess?.data?.sessionId || '';
      setPreviewSessionId(sid);
      // Also load merged config preview for possible inspector uses (optional)
      const res = await api.previewCheckoutConfig({});
      setPreviewData(res.data);
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to load preview', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (settings) {
      void loadPreview();
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Checkout Customization</h1>
        <p className="text-gray-600">Customize your checkout page branding, colors, and layout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Brand Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input 
                      value={settings?.brand?.companyName || ''} 
                      onChange={(e)=>updateSettings('brand.companyName', e.target.value)} 
                      placeholder="Your Company Name"
                    />
                  </div>
                  <CloudinaryUpload
                    value={settings?.brand?.logoUrl || ''}
                    onChange={(url) => updateSettings('brand.logoUrl', url)}
                    label="Company Logo"
                    folder="transactlab/checkout/logos"
                    maxSize={2}
                  />
                  <div>
                    <Label>Support Email</Label>
                    <Input 
                      value={settings?.brand?.supportEmail || ''} 
                      onChange={(e)=>updateSettings('brand.supportEmail', e.target.value)} 
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                  <div>
                    <Label>Support URL</Label>
                    <Input 
                      value={settings?.brand?.supportUrl || ''} 
                      onChange={(e)=>updateSettings('brand.supportUrl', e.target.value)} 
                      placeholder="https://yourcompany.com/support"
                    />
                  </div>
                  <Button onClick={()=>saveSettings({ brand: settings?.brand || {} })} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Brand
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Theme Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Brand Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={settings?.theme?.brandColor || '#0a164d'} 
                        onChange={(e)=>updateSettings('theme.brandColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        value={settings?.theme?.brandColor || '#0a164d'} 
                        onChange={(e)=>updateSettings('theme.brandColor', e.target.value)}
                        placeholder="#0a164d"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={settings?.theme?.accentColor || '#22c55e'} 
                        onChange={(e)=>updateSettings('theme.accentColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        value={settings?.theme?.accentColor || '#22c55e'} 
                        onChange={(e)=>updateSettings('theme.accentColor', e.target.value)}
                        placeholder="#22c55e"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Background Style</Label>
                    <Select 
                      value={settings?.theme?.backgroundStyle || 'solid'} 
                      onValueChange={(value)=>updateSettings('theme.backgroundStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {settings?.theme?.backgroundStyle === 'image' && (
                    <CloudinaryUpload
                      value={settings?.theme?.coverImageUrl || ''}
                      onChange={(url) => updateSettings('theme.coverImageUrl', url)}
                      label="Cover Image"
                      folder="transactlab/checkout/backgrounds"
                      maxSize={5}
                    />
                  )}
                  <Button onClick={()=>saveSettings({ theme: settings?.theme || {} })} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Theme
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layout className="w-5 h-5 mr-2" />
                    Layout Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Itemized Breakdown</Label>
                      <p className="text-sm text-gray-500">Display detailed order breakdown</p>
                    </div>
                    <Switch 
                      checked={settings?.layout?.showItemized ?? true}
                      onCheckedChange={(checked)=>updateSettings('layout.showItemized', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Trust Badges</Label>
                      <p className="text-sm text-gray-500">Display security and trust indicators</p>
                    </div>
                    <Switch 
                      checked={settings?.layout?.showTrustBadges ?? true}
                      onCheckedChange={(checked)=>updateSettings('layout.showTrustBadges', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Support Box</Label>
                      <p className="text-sm text-gray-500">Display customer support information</p>
                    </div>
                    <Switch 
                      checked={settings?.layout?.showSupportBox ?? true}
                      onCheckedChange={(checked)=>updateSettings('layout.showSupportBox', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Legal Links</Label>
                      <p className="text-sm text-gray-500">Display terms and privacy links</p>
                    </div>
                    <Switch 
                      checked={settings?.layout?.showLegal ?? true}
                      onCheckedChange={(checked)=>updateSettings('layout.showLegal', checked)}
                    />
                  </div>
                  <Button onClick={()=>saveSettings({ layout: settings?.layout || {} })} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Layout
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Legal Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Terms of Service URL</Label>
                    <Input 
                      value={settings?.legal?.termsUrl || ''} 
                      onChange={(e)=>updateSettings('legal.termsUrl', e.target.value)} 
                      placeholder="https://yourcompany.com/terms"
                    />
                  </div>
                  <div>
                    <Label>Privacy Policy URL</Label>
                    <Input 
                      value={settings?.legal?.privacyUrl || ''} 
                      onChange={(e)=>updateSettings('legal.privacyUrl', e.target.value)} 
                      placeholder="https://yourcompany.com/privacy"
                    />
                  </div>
                  <Button onClick={()=>saveSettings({ legal: settings?.legal || {} })} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Legal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Live Preview
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/checkout-demo', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Full Page
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={previewSessionId ? `/checkout/${previewSessionId}` : '/checkout-demo'}
                  className="w-full h-full border-0"
                  title="Checkout Preview"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
          <p className="text-sm text-gray-600">Test your checkout page with different configurations</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/checkout-demo', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Demo Checkout
            </Button>
            <Button
              variant="outline"
              onClick={loadPreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              Refresh Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutTemplates;

