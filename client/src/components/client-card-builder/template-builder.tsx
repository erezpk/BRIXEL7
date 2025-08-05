import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit3, 
  Type, 
  Hash, 
  Mail, 
  Phone, 
  Calendar, 
  ToggleLeft,
  List,
  FileText,
  Link,
  MapPin,
  Save,
  X
} from "lucide-react";
import { type ClientCardTemplate } from "@shared/schema";

interface Field {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface TemplateBuilderProps {
  template: ClientCardTemplate;
  onSave: (fields: Field[]) => void;
  onCancel: () => void;
}

const fieldTypes = [
  { value: "text", label: "טקסט", icon: Type },
  { value: "number", label: "מספר", icon: Hash },
  { value: "email", label: "אימייל", icon: Mail },
  { value: "phone", label: "טלפון", icon: Phone },
  { value: "date", label: "תאריך", icon: Calendar },
  { value: "boolean", label: "כן/לא", icon: ToggleLeft },
  { value: "select", label: "בחירה", icon: List },
  { value: "textarea", label: "טקסט ארוך", icon: FileText },
  { value: "url", label: "קישור", icon: Link },
  { value: "address", label: "כתובת", icon: MapPin },
];

export default function ClientCardTemplateBuilder({ template, onSave, onCancel }: TemplateBuilderProps) {
  const [fields, setFields] = useState<Field[]>(template.fields || []);
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newField, setNewField] = useState<Partial<Field>>({
    type: "text",
    label: "",
    required: false,
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);

    setFields(reorderedFields);
  };

  const addField = () => {
    if (!newField.label || !newField.type) return;

    const field: Field = {
      id: Date.now().toString(),
      type: newField.type as string,
      label: newField.label,
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.options,
      defaultValue: newField.defaultValue,
      validation: newField.validation,
    };

    setFields([...fields, field]);
    setNewField({ type: "text", label: "", required: false });
    setIsAddingField(false);
  };

  const updateField = (updatedField: Field) => {
    setFields(fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    ));
    setEditingField(null);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const handleSave = () => {
    onSave(fields);
  };

  const renderFieldPreview = (field: Field) => {
    const FieldIcon = fieldTypes.find(type => type.value === field.type)?.icon || Type;
    
    return (
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2 mb-2">
          <FieldIcon className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{field.label}</span>
          {field.required && <Badge variant="destructive" className="text-xs">נדרש</Badge>}
        </div>
        <div className="text-sm text-gray-600">
          {fieldTypes.find(type => type.value === field.type)?.label}
          {field.placeholder && ` • ${field.placeholder}`}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עורך תבנית: {template.name}</h1>
          <p className="text-gray-600">גרור ושחרר כדי לסדר מחדש את השדות</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 ml-2" />
            ביטול
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 ml-2" />
            שמור שינויים
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fields Editor */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>שדות התבנית</CardTitle>
              <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף שדה
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>הוסף שדה חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>תווית השדה</Label>
                      <Input
                        value={newField.label || ""}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        placeholder="הזן תווית לשדה"
                      />
                    </div>
                    <div>
                      <Label>סוג השדה</Label>
                      <Select 
                        value={newField.type} 
                        onValueChange={(value) => setNewField({ ...newField, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>טקסט עזר</Label>
                      <Input
                        value={newField.placeholder || ""}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        placeholder="טקסט עזר לשדה"
                      />
                    </div>
                    {newField.type === "select" && (
                      <div>
                        <Label>אפשרויות (מופרדות בפסיק)</Label>
                        <Textarea
                          value={newField.options?.join(", ") || ""}
                          onChange={(e) => setNewField({ 
                            ...newField, 
                            options: e.target.value.split(",").map(opt => opt.trim()).filter(Boolean)
                          })}
                          placeholder="אפשרות 1, אפשרות 2, אפשרות 3"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newField.required || false}
                        onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                      />
                      <Label>שדה חובה</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingField(false)}>
                        ביטול
                      </Button>
                      <Button onClick={addField}>הוסף</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center space-x-2 p-3 border rounded-lg bg-white ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {(() => {
                                  const FieldIcon = fieldTypes.find(type => type.value === field.type)?.icon || Type;
                                  return <FieldIcon className="h-4 w-4 text-gray-600" />;
                                })()}
                                <span className="font-medium">{field.label}</span>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">נדרש</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {fieldTypes.find(type => type.value === field.type)?.label}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingField(field)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>אין שדות עדיין</p>
                <p className="text-sm">הוסף שדות ליצירת התבנית</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>תצוגה מקדימה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  {renderFieldPreview(field)}
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>תצוגה מקדימה של השדות תופיע כאן</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Field Dialog */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>עריכת שדה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>תווית השדה</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>
              <div>
                <Label>טקסט עזר</Label>
                <Input
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                />
              </div>
              {editingField.type === "select" && (
                <div>
                  <Label>אפשרויות (מופרדות בפסיק)</Label>
                  <Textarea
                    value={editingField.options?.join(", ") || ""}
                    onChange={(e) => setEditingField({ 
                      ...editingField, 
                      options: e.target.value.split(",").map(opt => opt.trim()).filter(Boolean)
                    })}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                />
                <Label>שדה חובה</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingField(null)}>
                  ביטול
                </Button>
                <Button onClick={() => updateField(editingField)}>
                  שמור שינויים
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}