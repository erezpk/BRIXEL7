import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, Save, Phone, Mail, MapPin } from 'lucide-react';

export default function AgencySettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current agency settings
  const { data: agency, isLoading } = useQuery({
    queryKey: ['/api/agencies/current'],
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
  });

  // Update form data when agency data loads
  React.useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || '',
        description: agency.description || '',
        phone: agency.phone || '',
        email: agency.email || '',
        address: agency.address || '',
        website: agency.website || '',
      });
    }
  }, [agency]);

  // Update agency settings mutation
  const updateAgencyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/agencies/current', 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: 'הגדרות הסוכנות עודכנו',
        description: 'השינויים נשמרו בהצלחה',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון הגדרות',
        description: 'אנא נסו שוב',
        variant: 'destructive',
      });
    },
  });

  // Logo upload handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('Getting upload URL for logo...');
      
      const uploadResponse = await fetch('/api/agencies/current/upload-logo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Upload URL error:', uploadResponse.status, errorData);
        throw new Error(`Failed to get upload URL: ${uploadResponse.status}`);
      }

      const { uploadURL } = await uploadResponse.json();
      console.log('Got upload URL, uploading file...');

      // Upload file to Object Storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error(`File upload failed: ${uploadFileResponse.status}`);
      }

      console.log('File uploaded successfully, updating agency...');

      // Update agency with logo URL
      const updateResponse = await fetch('/api/agencies/current', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: uploadURL.split('?')[0], // Remove query parameters
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update agency logo');
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });

      toast({
        title: 'לוגו הועלה בהצלחה',
        description: 'הלוגו יופיע בהצעות מחיר והמסמכים',
      });

      // Clear the input
      event.target.value = '';

    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'שגיאה בהעלאת לוגו',
        description: error instanceof Error ? error.message : 'נסה שוב',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = () => {
    updateAgencyMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (isLoading) {
    return <div className="p-6">טוען הגדרות סוכנות...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">הגדרות הסוכנות</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agency Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי הסוכנות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agency-name">שם הסוכנות</Label>
              <Input
                id="agency-name"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="הכנס שם סוכנות"
              />
            </div>

            <div>
              <Label htmlFor="agency-description">תיאור הסוכנות</Label>
              <Textarea
                id="agency-description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="תיאור קצר על הסוכנות"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="agency-phone">טלפון</Label>
              <Input
                id="agency-phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                placeholder="050-123-4567"
              />
            </div>

            <div>
              <Label htmlFor="agency-email">אימייל</Label>
              <Input
                id="agency-email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="contact@agency.com"
              />
            </div>

            <div>
              <Label htmlFor="agency-address">כתובת</Label>
              <Input
                id="agency-address"
                value={formData.address}
                onChange={handleInputChange('address')}
                placeholder="רחוב 123, עיר, מיקוד"
              />
            </div>

            <div>
              <Label htmlFor="agency-website">אתר אינטרנט</Label>
              <Input
                id="agency-website"
                type="url"
                value={formData.website}
                onChange={handleInputChange('website')}
                placeholder="https://www.agency.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              לוגו הסוכנות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>לוגו נוכחי:</Label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {agency?.logo ? (
                <div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">תצוגה מקדימה:</div>
                    <img 
                      src={`/api/logo/${agency.id}/${agency.logo.split('/').pop()}`} 
                      alt="לוגו הסוכנות" 
                      className="mx-auto max-h-20 mb-4 border rounded-lg p-2 bg-white shadow-sm"
                      onLoad={() => console.log('Logo loaded successfully')}
                      onError={(e) => {
                        console.error('Logo preview failed to load');
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    החלפת לוגו
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    העלאת לוגו
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">PNG, JPG עד 5MB</p>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>הלוגו יופיע:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>בהצעות מחיר</li>
                <li>במסמכים</li>
                <li>באימיילים שנשלחים</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={updateAgencyMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 ml-2" />
          {updateAgencyMutation.isPending ? 'שומר...' : 'שמירת הגדרות'}
        </Button>
      </div>
    </div>
  );
}