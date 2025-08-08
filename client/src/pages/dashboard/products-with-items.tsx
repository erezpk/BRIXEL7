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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Package, CheckSquare, X, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { rtlClass } from '@/lib/rtl';

// Schemas
const itemFormSchema = z.object({
  name: z.string().min(1, "שם הפריט נדרש"),
  description: z.string().optional(),
  price: z.number().min(0, "מחיר חייב להיות חיובי"),
  category: z.string().min(1, "קטגוריה נדרשת"),
  unit: z.string().default("יחידה"),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(1, 'שם המוצר/שירות נדרש'),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  price: z.number().min(0, 'המחיר חייב להיות גדול מ-0'),
  unit: z.string().default('project'),
  isActive: z.boolean().default(true),
  selectedItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
  })).default([]),
  predefinedTasks: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'כותרת המשימה נדרשת'),
    description: z.string().optional().default(''),
    estimatedHours: z.number().optional().default(1),
    order: z.number(),
  })).default([]),
});

type ItemFormData = z.infer<typeof itemFormSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsWithItemsPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{itemId: string, quantity: number}>>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      unit: "יחידה",
      isActive: true,
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      unit: 'project',
      isActive: true,
      selectedItems: [],
      predefinedTasks: [],
    },
  });

  // Fetch items
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("/api/items", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "פריט נוצר בהצלחה",
        description: "הפריט נוסף למערכת והוא זמין לשימוש במוצרים",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      itemForm.reset();
      setIsDialogOpen(false); // Close dialog after successful creation
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת פריט",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ItemFormData> }) => {
      return await apiRequest(`/api/items/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "פריט עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setEditingItem(null);
      itemForm.reset();
      setIsDialogOpen(false); // Close dialog after successful update
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון פריט",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/items/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "פריט נמחק בהצלחה",
        description: "הפריט הוסר מהמערכת",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    },
    onError: () => {
      toast({
        title: "שגיאה במחיקת פריט",
        description: "לא ניתן למחוק פריט הקשור למוצרים קיימים",
        variant: "destructive",
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        ...data,
        selectedItems,
        // Calculate total price from selected items
        price: selectedItems.reduce((total, selectedItem) => {
          const item = items.find(i => i.id === selectedItem.itemId);
          return total + (item ? item.price * selectedItem.quantity : 0);
        }, 0),
      };
      return await apiRequest("/api/products", "POST", productData);
    },
    onSuccess: () => {
      toast({
        title: "מוצר נוצר בהצלחה",
        description: "המוצר נוסף למערכת והוא זמין להצעות מחיר",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      productForm.reset();
      setSelectedItems([]);
      setIsProductDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת מוצר",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const onItemSubmit = (data: ItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const onProductSubmit = (data: ProductFormData) => {
    if (selectedItems.length === 0) {
      toast({
        title: "חובה לבחור פריטים",
        description: "בחר לפחות פריט אחד לבניית המוצר",
        variant: "destructive",
      });
      return;
    }
    createProductMutation.mutate(data);
  };

  const startEditingItem = (item: any) => {
    setEditingItem(item.id);
    itemForm.reset({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      unit: item.unit || "יחידה",
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    itemForm.reset();
    setIsDialogOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק פריט זה?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const addItemToProduct = (itemId: string) => {
    const existing = selectedItems.find(si => si.itemId === itemId);
    if (existing) {
      setSelectedItems(prev => 
        prev.map(si => si.itemId === itemId ? {...si, quantity: si.quantity + 1} : si)
      );
    } else {
      setSelectedItems(prev => [...prev, { itemId, quantity: 1 }]);
    }
  };

  const removeItemFromProduct = (itemId: string) => {
    setSelectedItems(prev => prev.filter(si => si.itemId !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromProduct(itemId);
    } else {
      setSelectedItems(prev => 
        prev.map(si => si.itemId === itemId ? {...si, quantity} : si)
      );
    }
  };

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(items.map((item: any) => item.category).filter(Boolean)));

  // Calculate total price for selected items
  const totalPrice = selectedItems.reduce((total, selectedItem) => {
    const item = items.find(i => i.id === selectedItem.itemId);
    return total + (item ? item.price * selectedItem.quantity : 0);
  }, 0);

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול פריטים ומוצרים</h1>
          <p className="text-muted-foreground">
            נהל פריטים בסיסיים ובנה מהם מוצרים מורכבים להצעות מחיר
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">ניהול פריטים</TabsTrigger>
          <TabsTrigger value="products">ניהול מוצרים</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">פריטים בסיסיים</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף פריט חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {editingItem ? "עריכת פריט" : "הוספת פריט חדש"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם הפריט</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="שם הפריט" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={itemForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>מחיר (₪)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={itemForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>קטגוריה</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="קטגוריה" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תיאור</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="תיאור הפריט" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        className="flex-1"
                      >
                        {editingItem ? "עדכן פריט" : "הוסף פריט"}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>רשימת פריטים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="חפש פריטים..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                {categories.length > 0 && (
                  <div className="sm:w-48">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">כל הקטגוריות</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Items List */}
              {isLoadingItems ? (
                <div className="text-center py-8">טוען פריטים...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedCategory ? "לא נמצאו פריטים התואמים לחיפוש" : "אין פריטים במערכת"}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item: any) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg transition-colors",
                        editingItem === item.id && "border-blue-500 bg-blue-50"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="font-mono">
                                ₪{item.price.toLocaleString()} / {item.unit}
                              </Badge>
                              <Badge variant="secondary">{item.category}</Badge>
                              <Badge variant={item.isActive ? "default" : "secondary"}>
                                {item.isActive ? "פעיל" : "לא פעיל"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mr-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditingItem(item)}
                          disabled={editingItem === item.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deleteItemMutation.isPending}
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">מוצרים מורכבים</h2>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  צור מוצר חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>יצירת מוצר חדש מפריטים קיימים</DialogTitle>
                </DialogHeader>
                
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם המוצר</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="שם המוצר/שירות" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>קטגוריה</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="קטגוריית המוצר" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תיאור המוצר</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="תיאור מפורט של המוצר" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Items Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">בחירת פריטים למוצר</h3>
                      
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          אין פריטים זמינים. יש ליצור פריטים תחילה בלשונית "ניהול פריטים"
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded-md bg-white">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">₪{item.price}</p>
                                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addItemToProduct(item.id)}
                                className="ml-2 flex-shrink-0"
                              >
                                הוסף
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected Items */}
                      {selectedItems.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">פריטים נבחרים:</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedItems.map((selectedItem) => {
                              const item = items.find(i => i.id === selectedItem.itemId);
                              if (!item) return null;
                              
                              return (
                                <div key={selectedItem.itemId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                  <div>
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-muted-foreground mr-2">
                                      (₪{item.price} × {selectedItem.quantity})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={selectedItem.quantity}
                                      onChange={(e) => updateItemQuantity(selectedItem.itemId, parseInt(e.target.value) || 1)}
                                      className="w-20"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeItemFromProduct(selectedItem.itemId)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">סה"כ מחיר המוצר:</span>
                              <span className="text-lg font-bold">₪{totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createProductMutation.isPending || selectedItems.length === 0}
                        className="flex-1"
                      >
                        צור מוצר
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsProductDialogOpen(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle>רשימת מוצרים</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="text-center py-8">טוען מוצרים...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין מוצרים במערכת. צור מוצר ראשון מפריטים קיימים
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="font-mono">
                            ₪{product.price?.toLocaleString() || 0}
                          </Badge>
                          {product.category && (
                            <Badge variant="secondary">{product.category}</Badge>
                          )}
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "פעיל" : "לא פעיל"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mr-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
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
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>איך המערכת עובדת?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">1. צור פריטים בסיסיים</h4>
              <p className="text-muted-foreground">
                הגדר פריטים בסיסיים כמו שעות עבודה, רישיונות, חומרים וכו'
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">2. בנה מוצרים מורכבים</h4>
              <p className="text-muted-foreground">
                צור מוצרים מורכבים על ידי שילוב של מספר פריטים עם כמויות
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">3. השתמש בהצעות מחיר</h4>
              <p className="text-muted-foreground">
                המוצרים יהיו זמינים ליצירת הצעות מחיר מדויקות עם המשימות המוגדרות
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}