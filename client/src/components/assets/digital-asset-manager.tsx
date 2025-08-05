import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Server, Globe, Shield, Mail, Eye, EyeOff, Calendar, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

interface DigitalAsset {
  id: string;
  type: string;
  name: string;
  provider?: string;
  renewalDate?: string;
  cost?: number;
  loginUrl?: string;
  username?: string;
  password?: string;
  notes?: string;
  reminderSent: boolean;
  autoRenew: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DigitalAssetManagerProps {
  clientId: string;
  clientName: string;
}

const ASSET_TYPES = [
  { value: 'domain', label: 'דומיין', icon: Globe },
  { value: 'hosting', label: 'אירוח', icon: Server },
  { value: 'ssl', label: 'תעודת SSL', icon: Shield },
  { value: 'email', label: 'אימייל', icon: Mail },
];

const PROVIDERS = [
  'GoDaddy', 'Namecheap', 'Cloudflare', 'Google Domains', 
  'SiteGround', 'Bluehost', 'HostGator', 'AWS', 'Azure', 'אחר'
];

export default function DigitalAssetManager({ clientId, clientName }: DigitalAssetManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DigitalAsset | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/digital-assets`],
  });

  const [formData, setFormData] = useState({
    type: 'domain',
    name: '',
    provider: '',
    renewalDate: '',
    cost: '',
    loginUrl: '',
    username: '',
    password: '',
    notes: '',
    autoRenew: false,
  });

  const createAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      const response = await fetch(`/api/clients/${clientId}/digital-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assetData),
      });
      if (!response.ok) throw new Error('Failed to create asset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/digital-assets`] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "✅ נכס דיגיטלי נוצר",
        description: "הנכס נוסף בהצלחה למערכת"
      });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, ...assetData }: any) => {
      const response = await fetch(`/api/clients/${clientId}/digital-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assetData),
      });
      if (!response.ok) throw new Error('Failed to update asset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/digital-assets`] });
      setIsDialogOpen(false);
      setSelectedAsset(null);
      resetForm();
      toast({
        title: "✅ נכס עודכן",
        description: "השינויים נשמרו בהצלחה"
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clients/${clientId}/digital-assets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete asset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/digital-assets`] });
      toast({
        title: "🗑️ נכס נמחק",
        description: "הנכס הוסר בהצלחה"
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'domain',
      name: '',
      provider: '',
      renewalDate: '',
      cost: '',
      loginUrl: '',
      username: '',
      password: '',
      notes: '',
      autoRenew: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assetData = {
      ...formData,
      cost: formData.cost ? parseInt(formData.cost) * 100 : null, // Convert to agorot
      renewalDate: formData.renewalDate || null,
    };

    if (selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id, ...assetData });
    } else {
      createAssetMutation.mutate(assetData);
    }
  };

  const handleEdit = (asset: DigitalAsset) => {
    setSelectedAsset(asset);
    setFormData({
      type: asset.type,
      name: asset.name,
      provider: asset.provider || '',
      renewalDate: asset.renewalDate ? asset.renewalDate.split('T')[0] : '',
      cost: asset.cost ? (asset.cost / 100).toString() : '',
      loginUrl: asset.loginUrl || '',
      username: asset.username || '',
      password: asset.password || '',
      notes: asset.notes || '',
      autoRenew: asset.autoRenew,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (asset: DigitalAsset) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את ${asset.name}?`)) {
      deleteAssetMutation.mutate(asset.id);
    }
  };

  const togglePasswordVisibility = (assetId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  const getAssetIcon = (type: string) => {
    const assetType = ASSET_TYPES.find(t => t.value === type);
    return assetType ? assetType.icon : Globe;
  };

  const getAssetLabel = (type: string) => {
    const assetType = ASSET_TYPES.find(t => t.value === type);
    return assetType ? assetType.label : type;
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    if (!renewalDate) return null;
    const days = differenceInDays(new Date(renewalDate), new Date());
    return days;
  };

  const getRenewalStatus = (renewalDate: string) => {
    if (!renewalDate) return { status: 'unknown', text: 'לא מוגדר', color: 'gray' };
    
    const days = getDaysUntilRenewal(renewalDate);
    if (days === null) return { status: 'unknown', text: 'לא מוגדר', color: 'gray' };
    
    if (days < 0) return { status: 'expired', text: 'פג תוקף', color: 'red' };
    if (days <= 7) return { status: 'urgent', text: `${days} ימים`, color: 'red' };
    if (days <= 30) return { status: 'warning', text: `${days} ימים`, color: 'yellow' };
    return { status: 'good', text: `${days} ימים`, color: 'green' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">נכסים דיגיטליים - {clientName}</h2>
          <p className="text-gray-600">ניהול דומיינים, אירוח ותעודות SSL</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedAsset(null); resetForm(); }}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף נכס
            </Button>
          </DialogTrigger>
          
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedAsset ? 'עריכת נכס דיגיטלי' : 'הוספת נכס דיגיטלי'}
              </DialogTitle>
              <DialogDescription>
                הוסף פרטי דומיין, אירוח או שירות דיגיטלי אחר
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">סוג הנכס</Label>
                <Select value={formData.type} onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">שם הנכס *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="provider">ספק</Label>
                <Select value={formData.provider} onValueChange={value => setFormData(prev => ({ ...prev, provider: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר ספק" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(provider => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="renewalDate">תאריך חידוש</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate}
                    onChange={e => setFormData(prev => ({ ...prev, renewalDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="cost">עלות (₪)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="299"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loginUrl">קישור התחברות</Label>
                <Input
                  id="loginUrl"
                  type="url"
                  value={formData.loginUrl}
                  onChange={e => setFormData(prev => ({ ...prev, loginUrl: e.target.value }))}
                  placeholder="https://account.provider.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">שם משתמש</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="password">סיסמה</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, autoRenew: checked }))}
                />
                <Label htmlFor="autoRenew">חידוש אוטומטי</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createAssetMutation.isPending || updateAssetMutation.isPending}>
                  {selectedAsset ? 'עדכן' : 'הוסף'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ביטול
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין נכסים דיגיטליים עדיין</h3>
            <p className="text-gray-500 text-center mb-4">
              הוסף פרטי דומיינים, אירוח ושירותים דיגיטליים אחרים כדי לעקוב אחר תאריכי חידוש
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assets.map((asset: DigitalAsset) => {
            const AssetIcon = getAssetIcon(asset.type);
            const renewalStatus = getRenewalStatus(asset.renewalDate || '');
            
            return (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AssetIcon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <p className="text-sm text-gray-600">{getAssetLabel(asset.type)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {asset.renewalDate && (
                        <Badge 
                          variant={renewalStatus.color === 'red' ? 'destructive' : 
                                  renewalStatus.color === 'yellow' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {renewalStatus.status === 'expired' && <AlertTriangle className="h-3 w-3" />}
                          {renewalStatus.status === 'urgent' && <AlertTriangle className="h-3 w-3" />}
                          {renewalStatus.status === 'warning' && <Calendar className="h-3 w-3" />}
                          {renewalStatus.status === 'good' && <CheckCircle className="h-3 w-3" />}
                          {renewalStatus.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {asset.provider && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">ספק:</span>
                      <span className="font-medium">{asset.provider}</span>
                    </div>
                  )}

                  {asset.renewalDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">תאריך חידוש:</span>
                      <span className="font-medium">
                        {format(new Date(asset.renewalDate), 'dd/MM/yyyy', { locale: he })}
                      </span>
                    </div>
                  )}

                  {asset.cost && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">עלות:</span>
                      <span className="font-medium">₪{(asset.cost / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {asset.loginUrl && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">התחברות:</span>
                      <a 
                        href={asset.loginUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        פתח חשבון
                      </a>
                    </div>
                  )}

                  {(asset.username || asset.password) && (
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      {asset.username && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">שם משתמש:</span>
                          <span className="font-mono">{asset.username}</span>
                        </div>
                      )}
                      
                      {asset.password && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">סיסמה:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {showPassword[asset.id] ? asset.password : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(asset.id)}
                            >
                              {showPassword[asset.id] ? 
                                <EyeOff className="h-4 w-4" /> : 
                                <Eye className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {asset.notes && (
                    <div className="text-sm">
                      <span className="text-gray-500 block mb-1">הערות:</span>
                      <p className="text-gray-700">{asset.notes}</p>
                    </div>
                  )}

                  {asset.autoRenew && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      חידוש אוטומטי מופעל
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(asset)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      עריכה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(asset)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Renewal Reminders */}
      {assets.some((asset: DigitalAsset) => {
        const days = getDaysUntilRenewal(asset.renewalDate || '');
        return days !== null && days <= 30 && days >= 0;
      }) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>תזכורת חידוש:</strong> יש לך נכסים שמתקרבים לתאריך החידוש. 
            בדוק את התאריכים ודאג לחדש בזמן.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}