import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Package, CheckSquare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const productSchema = z.object({
  name: z.string().min(1, 'שם המוצר/שירות נדרש'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'המחיר חייב להיות גדול מ-0'),
  unit: z.string().default('project'),
  isActive: z.boolean().default(true),
  predefinedTasks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    estimatedHours: z.number().optional(),
    assignedTo: z.string().optional(),
  })).default([]),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  unit: string;
  isActive: boolean;
  predefinedTasks: Array<{
    title: string;
    description?: string;
    estimatedHours?: number;
    assignedTo?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      unit: 'project',
      isActive: true,
      predefinedTasks: [],
    },
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      return apiRequest('/api/products', {
        method: 'POST',
        body: {
          ...data,
          price: Math.round(data.price * 100), // Convert to agorot
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'המוצר/שירות נוצר בהצלחה' });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'שגיאה ביצירת מוצר/שירות', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => {
      return apiRequest(`/api/products/${id}`, {
        method: 'PUT',
        body: {
          ...data,
          price: Math.round(data.price * 100), // Convert to agorot
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'המוצר/שירות עודכן בהצלחה' });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון מוצר/שירות', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'המוצר/שירות נמחק בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה במחיקת מוצר/שירות', variant: 'destructive' });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: product.price / 100, // Convert from agorot
      unit: product.unit,
      isActive: product.isActive,
      predefinedTasks: product.predefinedTasks || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המוצר/שירות הזה?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount / 100);
  };

  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean))) as string[];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">מוצרים ושירותים</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduct(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 ml-2" />
              מוצר/שירות חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'עריכת מוצר/שירות' : 'מוצר/שירות חדש'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם המוצר/שירות</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>קטגוריה</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="לדוגמה: עיצוב, פיתוח, שיווק" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר (₪)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>יחידת מדידה</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר יחידה" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="project">פרויקט</SelectItem>
                            <SelectItem value="hour">שעה</SelectItem>
                            <SelectItem value="month">חודש</SelectItem>
                            <SelectItem value="year">שנה</SelectItem>
                            <SelectItem value="page">עמוד</SelectItem>
                            <SelectItem value="design">עיצוב</SelectItem>
                            <SelectItem value="video">סרטון</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Task Template Section */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">תבנית משימות</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        משימות שיתווספו אוטומטית כשלקוח רוכש את המוצר/שירות הזה
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTasks = form.getValues('predefinedTasks') || [];
                        form.setValue('predefinedTasks', [...currentTasks, {
                          id: Date.now().toString(),
                          title: '',
                          description: '',
                          estimatedHours: 1,
                          order: currentTasks.length
                        }]);
                      }}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף משימה
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="predefinedTasks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            {(field.value || []).map((task, index) => (
                              <div key={task.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      placeholder="כותרת המשימה"
                                      value={task.title}
                                      onChange={(e) => {
                                        const newTasks = [...(field.value || [])];
                                        newTasks[index] = { ...task, title: e.target.value };
                                        field.onChange(newTasks);
                                      }}
                                    />
                                    <Textarea
                                      placeholder="תיאור המשימה (אופציונלי)"
                                      value={task.description || ''}
                                      rows={2}
                                      onChange={(e) => {
                                        const newTasks = [...(field.value || [])];
                                        newTasks[index] = { ...task, description: e.target.value };
                                        field.onChange(newTasks);
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`hours-${index}`} className="text-sm">
                                        שעות משוערות:
                                      </Label>
                                      <Input
                                        id={`hours-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-20"
                                        value={task.estimatedHours || 1}
                                        onChange={(e) => {
                                          const newTasks = [...(field.value || [])];
                                          newTasks[index] = { 
                                            ...task, 
                                            estimatedHours: parseFloat(e.target.value) || 1 
                                          };
                                          field.onChange(newTasks);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newTasks = (field.value || []).filter((_, i) => i !== index);
                                      field.onChange(newTasks);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(!field.value || field.value.length === 0) && (
                              <div className="text-center text-muted-foreground py-4">
                                <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>לא הוגדרו משימות עדיין</p>
                                <p className="text-xs">לחץ על "הוסף משימה" כדי להתחיל</p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">פעיל</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          המוצר/שירות זמין לשימוש בהצעות מחיר וחשבוניות
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingProduct(null);
                      form.reset();
                    }}
                  >
                    ביטול
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingProduct ? 'עדכן' : 'צור'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.category && (
                    <Badge variant="secondary">{product.category}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{product.unit === 'project' ? 'פרויקט' : 
                      product.unit === 'hour' ? 'שעה' :
                      product.unit === 'month' ? 'חודש' :
                      product.unit === 'year' ? 'שנה' :
                      product.unit}
                  </span>
                </div>

                {product.predefinedTasks && product.predefinedTasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">משימות מוגדרות מראש:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {product.predefinedTasks.slice(0, 3).map((task, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          {task.title}
                        </li>
                      ))}
                      {product.predefinedTasks.length > 3 && (
                        <li className="text-xs">
                          ועוד {product.predefinedTasks.length - 3} משימות...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4 ml-1" />
                    ערוך
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    מחק
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">אין מוצרים או שירותים</h3>
                <p className="text-muted-foreground text-center mb-6">
                  התחל ביצירת מוצרים ושירותים שישמשו אותך בהצעות מחיר וחשבוניות
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  צור מוצר/שירות ראשון
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}