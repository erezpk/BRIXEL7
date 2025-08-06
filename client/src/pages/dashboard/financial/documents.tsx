import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockDocuments = [
  {
    id: '1',
    name: 'חוזה עיצוב אתר',
    type: 'contract',
    category: 'עיצוב',
    content: 'זהו תוכן החוזה לעיצוב האתר...',
    createdAt: '2025-01-06',
    usageCount: 5
  },
  {
    id: '2',
    name: 'הסכם ניהול מדיה חברתית',
    type: 'agreement',
    category: 'מדיה חברתית',
    content: 'הסכם ניהול מדיה חברתית...',
    createdAt: '2025-01-05',
    usageCount: 3
  },
  {
    id: '3',
    name: 'נספח תנאי תשלום',
    type: 'appendix',
    category: 'כללי',
    content: 'תנאי התשלום וההחזר...',
    createdAt: '2025-01-04',
    usageCount: 8
  }
];

const documentTypes = [
  { value: 'contract', label: 'חוזה' },
  { value: 'agreement', label: 'הסכם' },
  { value: 'appendix', label: 'נספח' },
  { value: 'terms', label: 'תנאים' },
  { value: 'proposal', label: 'הצעה' }
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    content: ''
  });
  const { toast } = useToast();

  const handleCreateDocument = () => {
    if (!formData.name || !formData.type || !formData.content) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    const newDocument = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };

    setDocuments([...documents, newDocument]);
    setFormData({ name: '', type: '', category: '', content: '' });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "הצלחה",
      description: "המסמך נוצר בהצלחה"
    });
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "הצלחה",
      description: "המסמך נמחק בהצלחה"
    });
  };

  const getTypeLabel = (type: string) => {
    return documentTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול מסמכים</h1>
          <p className="text-muted-foreground">
            יצירה וניהול של תבניות מסמכים לשימוש בהצעות מחיר
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              מסמך חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>יצירת מסמך חדש</DialogTitle>
              <DialogDescription>
                צור תבנית מסמך חדשה שתוכל לצרף להצעות מחיר
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">שם המסמך</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="לדוגמה: חוזה עיצוב אתר"
                />
              </div>
              <div>
                <Label htmlFor="type">סוג המסמך</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג מסמך" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">קטגוריה</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="לדוגמה: עיצוב, פיתוח, מדיה חברתית"
                />
              </div>
              <div>
                <Label htmlFor="content">תוכן המסמך</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="כתוב כאן את תוכן המסמך..."
                  rows={10}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreateDocument}>
                  יצירת מסמך
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-primary" />
                <Badge variant="secondary">
                  {getTypeLabel(document.type)}
                </Badge>
              </div>
              <CardTitle className="text-lg">{document.name}</CardTitle>
              <CardDescription>{document.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  נוצר: {new Date(document.createdAt).toLocaleDateString('he-IL')}
                </div>
                <div className="text-sm text-muted-foreground">
                  שימושים: {document.usageCount}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDocument(document);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for viewing document */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              {getTypeLabel(selectedDocument?.type || '')} - {selectedDocument?.category}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
              {selectedDocument?.content}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              סגור
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              הורד
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}