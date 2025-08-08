import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";

const itemFormSchema = z.object({
  name: z.string().min(1, "שם הפריט נדרש"),
  description: z.string().optional(),
  price: z.number().min(0, "מחיר חייב להיות חיובי"),
  category: z.string().min(1, "קטגוריה נדרשת"),
  unit: z.string().default("יחידה"),
  isActive: z.boolean().default(true),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

export default function ItemsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEditingItem, setIsEditingItem] = useState<string | null>(null);

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

  // Fetch items
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
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
      setIsEditingItem(null);
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

  const onItemSubmit = (data: ItemFormData) => {
    if (isEditingItem) {
      updateItemMutation.mutate({ id: isEditingItem, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const startEditingItem = (item: any) => {
    setIsEditingItem(item.id);
    itemForm.reset({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      unit: item.unit || "יחידה",
      isActive: item.isActive,
    });
  };

  const cancelEditing = () => {
    setIsEditingItem(null);
    itemForm.reset();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק פריט זה?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Filter items based on search and category
  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(items.map((item: any) => item.category).filter(Boolean)));

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול פריטים</h1>
          <p className="text-muted-foreground">
            נהל פריטים לבניית מוצרים והצעות מחיר מורכבות
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* טופס הוספת/עריכת פריט */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {isEditingItem ? "עריכת פריט" : "הוספת פריט חדש"}
              </CardTitle>
              <CardDescription>
                {isEditingItem ? "ערוך את פרטי הפריט" : "הוסף פריט חדש למערכת"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>יחידה</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="יחידה" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createItemMutation.isPending || updateItemMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 ml-2" />
                      {isEditingItem ? "עדכן פריט" : "הוסף פריט"}
                    </Button>
                    
                    {isEditingItem && (
                      <Button type="button" variant="outline" onClick={cancelEditing}>
                        ביטול
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* רשימת פריטים */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>רשימת פריטים</CardTitle>
              <CardDescription>
                כל הפריטים הזמינים במערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* סינון וחיפוש */}
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

              {/* רשימת פריטים */}
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
                        isEditingItem === item.id && "border-blue-500 bg-blue-50"
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
                          disabled={isEditingItem === item.id}
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
        </div>
      </div>

      {/* הסבר על שימוש בפריטים */}
      <Card>
        <CardHeader>
          <CardTitle>איך להשתמש בפריטים?</CardTitle>
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
                בעמוד המוצרים, תוכל לבנות מוצרים מורכבים מכמה פריטים
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">3. השתמש בהצעות מחיר</h4>
              <p className="text-muted-foreground">
                הפריטים והמוצרים יהיו זמינים ליצירת הצעות מחיר מדויקות
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}