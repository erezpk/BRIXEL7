import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Palette, Eye } from 'lucide-react';

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

  // Get current agency settings
  const { data: agency, isLoading } = useQuery({
    queryKey: ['/api/agencies/current'],
  });

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
        description: 'אנא נסו שוב',
        variant: 'destructive',
      });
    },
  });

  // Test PDF generation mutation
  const generateTestPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/pdf/test-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          color: selectedColor
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate test PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-quote-${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: 'PDF נוצר בהצלחה',
        description: 'הקובץ נשמר למחשב שלכם',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה ביצירת PDF',
        description: 'אנא נסו שוב',
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

  const handleGenerateTest = () => {
    generateTestPDFMutation.mutate();
  };



  if (isLoading) {
    return <div className="p-6">טוען הגדרות...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">הגדרות PDF להצעות מחיר</h1>
        <Button onClick={handleGenerateTest} disabled={generateTestPDFMutation.isPending}>
          {generateTestPDFMutation.isPending ? 'יוצר...' : 'צור PDF לדוגמא'}
          <Eye className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="ml-2 h-5 w-5" />
              בחירת תבנית
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="template">תבנית PDF:</Label>
            <Select 
              value={selectedTemplate} 
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחרו תבנית" />
              </SelectTrigger>
              <SelectContent>
                {PDF_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="text-right">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Template Preview */}
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">תצוגה מקדימה: {PDF_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</h4>
              <div className="text-sm text-muted-foreground">
                {selectedTemplate === 'modern' && 'עיצוב מודרני עם קווים נקיים, צבעים בולטים וריווח אווירי'}
                {selectedTemplate === 'classic' && 'עיצוב פורמלי עם טבלאות מסודרות ומבנה מקצועי'}
                {selectedTemplate === 'minimal' && 'עיצוב מינימלי ונקי עם דגש על התוכן'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="ml-2 h-5 w-5" />
              בחירת צבע עיקרי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>צבעים מוכנים:</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setSelectedColor(preset.color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    selectedColor === preset.color ? 'border-black scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-color">צבע מותאם אישית:</Label>
              <div className="flex space-x-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setSelectedColor(e.target.value);
                  }}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#0066cc"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span>תצוגה מקדימה:</span>
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
              <div className="mt-2 text-sm" style={{ color: selectedColor }}>
                טקסט לדוגמא בצבע שנבחר
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Current Settings Display */}
        <Card>
          <CardHeader>
            <CardTitle>הגדרות נוכחיות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">תבנית נוכחית:</span>
              <span className="font-medium">
                {PDF_TEMPLATES.find(t => t.id === (agency?.pdfTemplate || 'modern'))?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">צבע נוכחי:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{agency?.pdfColor || '#0066cc'}</span>
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: agency?.pdfColor || '#0066cc' }}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={updateSettingsMutation.isPending}
          size="lg"
        >
          {updateSettingsMutation.isPending ? 'שומר...' : 'שמירת הגדרות'}
        </Button>
      </div>
    </div>
  );
}