import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GripVertical, Trash2, Eye, Save, Settings } from 'lucide-react';
import { ClientCardField } from '@shared/schema';
import { nanoid } from 'nanoid';

interface ClientCardBuilderProps {
  template?: {
    id?: string;
    name: string;
    description?: string;
    industry?: string;
    fields: ClientCardField[];
  };
  onSave: (template: {
    name: string;
    description?: string;
    industry?: string;
    fields: ClientCardField[];
  }) => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'textarea', label: 'טקסט רב שורות' },
  { value: 'select', label: 'בחירה מרשימה' },
  { value: 'date', label: 'תאריך' },
  { value: 'status', label: 'סטטוס' },
  { value: 'number', label: 'מספר' },
  { value: 'email', label: 'אימייל' },
  { value: 'phone', label: 'טלפון' },
];

const INDUSTRIES = [
  { value: 'marketing', label: 'שיווק דיגיטלי' },
  { value: 'design', label: 'עיצוב גרפי' },
  { value: 'video', label: 'עריכת וידאו' },
  { value: 'therapy', label: 'טיפול' },
  { value: 'consulting', label: 'ייעוץ' },
  { value: 'development', label: 'פיתוח' },
  { value: 'other', label: 'אחר' },
];

export default function ClientCardBuilder({ template, onSave, onCancel }: ClientCardBuilderProps) {
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    industry: template?.industry || 'marketing',
    fields: template?.fields || []
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingField, setEditingField] = useState<ClientCardField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);

  const addField = useCallback((type: ClientCardField['type']) => {
    const newField: ClientCardField = {
      id: nanoid(),
      type,
      label: `שדה ${type}`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'status' ? ['אפשרות 1', 'אפשרות 2'] : undefined,
      defaultValue: '',
    };
    
    setTemplateData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<ClientCardField>) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(templateData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTemplateData(prev => ({
      ...prev,
      fields: items
    }));
  }, [templateData.fields]);

  const openFieldEditor = (field: ClientCardField) => {
    setEditingField(field);
    setIsFieldDialogOpen(true);
  };

  const saveFieldChanges = () => {
    if (editingField) {
      updateField(editingField.id, editingField);
      setEditingField(null);
      setIsFieldDialogOpen(false);
    }
  };

  const renderFieldPreview = (field: ClientCardField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return <Input placeholder={field.placeholder || field.label} disabled />;
      case 'textarea':
        return <Textarea placeholder={field.placeholder || field.label} disabled />;
      case 'select':
      case 'status':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={`בחר ${field.label}`} />
            </SelectTrigger>
          </Select>
        );
      case 'date':
        return <Input type="date" disabled />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder || field.label} disabled />;
      default:
        return <Input placeholder={field.label} disabled />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50" dir="rtl">
      {/* Builder Panel */}
      <div className="w-1/2 p-6 bg-white border-r overflow-y-auto">
        <div className="space-y-6">
          {/* Template Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                הגדרות תבנית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">שם התבנית</Label>
                <Input
                  id="template-name"
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="תבנית לקוח שיווק דיגיטלי"
                />
              </div>

              <div>
                <Label htmlFor="template-description">תיאור</Label>
                <Textarea
                  id="template-description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור קצר של התבנית"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template-industry">תעשייה</Label>
                <Select
                  value={templateData.industry}
                  onValueChange={(value) => setTemplateData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Add Field Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                הוסף שדות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.map((fieldType) => (
                  <Button
                    key={fieldType.value}
                    variant="outline"
                    size="sm"
                    onClick={() => addField(fieldType.value as ClientCardField['type'])}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    {fieldType.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fields List */}
          <Card>
            <CardHeader>
              <CardTitle>שדות הכרטיס ({templateData.fields.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {templateData.fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{field.label}</p>
                                  <p className="text-sm text-gray-500">
                                    {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                    {field.required && ' • נדרש'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openFieldEditor(field)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeField(field.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {templateData.fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>עדיין לא הוספת שדות לתבנית</p>
                  <p className="text-sm">השתמש בכפתורים למעלה כדי להוסיף שדות</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">תצוגה מקדימה</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="h-4 w-4 ml-1" />
                תצוגה מלאה
              </Button>
              <Button onClick={() => onSave(templateData)}>
                <Save className="h-4 w-4 ml-1" />
                שמור תבנית
              </Button>
              <Button variant="outline" onClick={onCancel}>
                ביטול
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{templateData.name || 'תבנית כרטיס לקוח'}</CardTitle>
              {templateData.description && (
                <p className="text-sm text-gray-600">{templateData.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {templateData.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </Label>
                  {renderFieldPreview(field)}
                </div>
              ))}

              {templateData.fields.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>התבנית תופיע כאן כשתוסיף שדות</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת שדה</DialogTitle>
            <DialogDescription>
              הגדר את מאפייני השדה
            </DialogDescription>
          </DialogHeader>
          
          {editingField && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-label">תווית השדה</Label>
                <Input
                  id="field-label"
                  value={editingField.label}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, label: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="field-placeholder">placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="field-required"
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField(prev => prev ? { ...prev, required: checked } : null)}
                />
                <Label htmlFor="field-required">שדה נדרש</Label>
              </div>

              {(editingField.type === 'select' || editingField.type === 'status') && (
                <div>
                  <Label>אפשרויות</Label>
                  <Textarea
                    value={editingField.options?.join('\n') || ''}
                    onChange={(e) => setEditingField(prev => prev ? { 
                      ...prev, 
                      options: e.target.value.split('\n').filter(opt => opt.trim())
                    } : null)}
                    placeholder="אפשרות 1&#10;אפשרות 2&#10;אפשרות 3"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">כל אפשרות בשורה נפרדת</p>
                </div>
              )}

              <div>
                <Label htmlFor="field-default">ערך ברירת מחדל</Label>
                <Input
                  id="field-default"
                  value={editingField.defaultValue || ''}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, defaultValue: e.target.value } : null)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={saveFieldChanges}>שמור שינויים</Button>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה - {templateData.name}</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>{templateData.name}</CardTitle>
                {templateData.description && (
                  <p className="text-sm text-gray-600">{templateData.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {templateData.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-500 mr-1">*</span>}
                    </Label>
                    {renderFieldPreview(field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}