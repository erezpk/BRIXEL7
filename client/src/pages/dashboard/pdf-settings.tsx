import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Palette, Eye, ArrowRight } from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import { rtlClass, cn } from '@/lib/utils';

const PDF_TEMPLATES = [
  { id: 'modern', name: 'מודרני', description: 'עיצוב מודרני עם צבעים ויזואליות' },
  { id: 'classic', name: 'קלאסי', description: 'עיצוב פורמלי ומקצועי' },
  { id: 'minimal', name: 'מינימלי', description: 'עיצוב נקי ופשוט' }
];

const COLOR_PRESETS = [
  { color: '#0066cc', name: 'כחול' },
  { color: '#28a745', name: 'ירוק' },
  { color: '#dc3545', name: 'אדום' },
  { color: '#fd7e14', name: 'כתום' },
  { color: '#6f42c1', name: 'סגול' },
  { color: '#20c997', name: 'טורקיז' },
  { color: '#6c757d', name: 'אפור' },
  { color: '#212529', name: 'שחור' }
];

export default function PDFSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedColor, setSelectedColor] = useState('#0066cc');
  const [customColor, setCustomColor] = useState('#0066cc');
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);

  // Get current agency settings
  const { data: agency, isLoading } = useQuery({
    queryKey: ['/api/agencies/current'],
  });

  // Set initial values when data loads
  useEffect(() => {
    if (agency) {
      setSelectedTemplate((agency as any).pdfTemplate || 'modern');
      setSelectedColor((agency as any).pdfColor || '#0066cc');
      setCustomColor((agency as any).pdfColor || '#0066cc');
      setAgencyLogo((agency as any).logo || null);
    }
  }, [agency]);

  // Update PDF settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { pdfTemplate: string; pdfColor: string }) => {
      return apiRequest('/api/agencies/current', 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: 'הגדרות PDF עודכנו',
        description: 'ההגדרות נשמרו בהצלחה',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בשמירת ההגדרות',
        description: 'נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
    },
  });

  // Generate test PDF mutation
  const generateTestPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/pdf/test-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template: selectedTemplate,
          color: selectedColor,
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה ביצירת PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `test-quote-${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'PDF נוצר בהצלחה',
        description: 'הקובץ הורד למחשב שלך',
      });
    },
    onError: () => {
      toast({
        title: 'שגיאה ביצירת PDF',
        description: 'נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      pdfTemplate: selectedTemplate,
      pdfColor: selectedColor,
    });
  };

  const handleGenerateTestPDF = () => {
    generateTestPDFMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">טוען...</div>;
  }

  return (
    <div className={rtlClass("container mx-auto py-6 space-y-6 max-w-4xl")}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות PDF להצעות מחיר</h1>
        <p className="text-muted-foreground">
          התאם את עיצוב ה-PDF, בחר תבנית וצבעים למסמכים מקצועיים
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              בחירת תבנית
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>תבנית PDF:</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PDF_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">תצוגה מקדימה: {PDF_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</h4>
              <p className="text-sm text-muted-foreground">
                {PDF_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </p>
              {selectedTemplate === 'modern' && (
                <p className="text-xs text-muted-foreground mt-2">
                  עיצוב מודרני עם קווים נקיים, צבעים בולטים וריווח אוורירי
                </p>
              )}
              {selectedTemplate === 'classic' && (
                <p className="text-xs text-muted-foreground mt-2">
                  עיצוב פורמלי עם גבולות מוגדרים וטקסט ברור למראה מקצועי
                </p>
              )}
              {selectedTemplate === 'minimal' && (
                <p className="text-xs text-muted-foreground mt-2">
                  עיצוב מינימליסטי עם טקסט נקי וללא עיטורים מיותרים
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Color Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              בחירת צבע עיקרי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>צבעים מוגדרים מראש:</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedColor === preset.color ? 'border-primary scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    onClick={() => setSelectedColor(preset.color)}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-color">צבע מותאם אישית:</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setSelectedColor(customColor)}
                  className="flex-1"
                >
                  השתמש בצבע זה
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">צבע נבחר:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-xs font-mono">{selectedColor}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              לוגו החברה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agencyLogo && (
              <div className="mb-4">
                <img 
                  src={agencyLogo} 
                  alt="לוגו החברה" 
                  className="max-w-48 max-h-24 object-contain border rounded-lg p-2"
                />
              </div>
            )}
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5 * 1024 * 1024} // 5MB
              onGetUploadParameters={async () => {
                const response = await fetch('/api/agencies/current/upload-logo', {
                  method: 'POST',
                  credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to get upload URL');
                const data = await response.json();
                return {
                  method: 'PUT' as const,
                  url: data.uploadURL,
                };
              }}
              onComplete={async (result) => {
                if (result.successful && result.successful[0]) {
                  const uploadURL = result.successful[0].uploadURL;
                  if (uploadURL) {
                    try {
                      const response = await fetch('/api/agencies/current/logo', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logoURL: uploadURL }),
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        // Extract the object path from the upload URL for display
                        const objectPath = uploadURL.split('?')[0]; // Remove query params
                        setAgencyLogo(objectPath);
                        queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });
                        toast({
                          title: "לוגו הועלה בהצלחה",
                          description: "הלוגו יופיע בהצעות מחיר החדשות"
                        });
                      } else {
                        const errorData = await response.json();
                        console.error('Logo save error:', errorData);
                        throw new Error('Failed to save logo');
                      }
                    } catch (error) {
                      toast({
                        title: "שגיאה בשמירת לוגו",
                        description: "נסה שוב מאוחר יותר",
                        variant: "destructive"
                      });
                    }
                  }
                }
              }}
            >
              <Upload className="h-4 w-4 me-2" />
              העלה לוגו חדש
            </ObjectUploader>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              צור PDF לדוגמא
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              צור קובץ PDF לדוגמא כדי לראות איך ההגדרות שלך ייראו בפועל
            </p>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleGenerateTestPDF}
                disabled={generateTestPDFMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 me-2" />
                {generateTestPDFMutation.isPending ? 'יוצר PDF...' : 'צור PDF לדוגמא'}
              </Button>

              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full"
              >
                {updateSettingsMutation.isPending ? 'שומר...' : 'שמור הגדרות'}
                <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}