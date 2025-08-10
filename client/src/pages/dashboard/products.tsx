import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, Edit, Trash2, Eye, ShoppingCart, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  priceType: 'fixed' | 'hourly' | 'monthly';
  unit: string;
  isActive: boolean;
  predefinedTasks: { id: string; title: string; estimatedHours?: number; }[];
  createdAt: string;
}

export default function ProductsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/products', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsCreateOpen(false);
      toast({
        title: 'הצלחה',
        description: 'המוצר נוצר בהצלחה',
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/products/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditOpen(false);
      setSelectedProduct(null);
      toast({
        title: 'הצלחה',
        description: 'המוצר עודכן בהצלחה',
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/products/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'הצלחה',
        description: 'המוצר נמחק בהצלחה',
      });
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (price: number, priceType: string) => {
    const formattedPrice = (price / 100).toLocaleString('he-IL');
    switch (priceType) {
      case 'hourly':
        return `₪${formattedPrice} לשעה`;
      case 'monthly':
        return `₪${formattedPrice} לחודש`;
      default:
        return `₪${formattedPrice}`;
    }
  };

  const categories = ['website', 'design', 'marketing', 'video', 'development', 'consultation'];

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">מוצרים ושירותים</h1>
          <p className="text-gray-600 mt-1">נהל את המוצרים והשירותים של הסוכנות</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף מוצר
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת מוצר חדש</DialogTitle>
            </DialogHeader>
            <ProductForm 
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="חפש מוצרים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">סה"כ מוצרים</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">מוצרים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter((p: Product) => p.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">ממוצע מחיר</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₪{products.length > 0 ? Math.round(products.reduce((sum: number, p: Product) => sum + p.price, 0) / products.length / 100).toLocaleString('he-IL') : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product: Product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {product.category && (
                      <Badge variant="secondary">{getCategoryName(product.category)}</Badge>
                    )}
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description || 'אין תיאור'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">מחיר:</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {formatPrice(product.price, product.priceType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">יחידה:</span>
                  <span className="text-sm">{product.unit}</span>
                </div>
                {product.predefinedTasks.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {product.predefinedTasks.length} משימות מוגדרות מראש
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין מוצרים</h3>
          <p className="text-gray-600 mb-4">התחל ליצור מוצרים ושירותים חדשים</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף מוצר ראשון
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת מוצר</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm 
              product={selectedProduct}
              onSubmit={(data) => updateMutation.mutate({ id: selectedProduct.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Form Component
function ProductForm({ 
  product, 
  onSubmit, 
  isLoading 
}: { 
  product?: Product | null; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product ? product.price / 100 : 0,
    priceType: product?.priceType || 'fixed',
    unit: product?.unit || 'project',
    isActive: product?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Math.round(formData.price * 100), // Convert to agorot
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">שם המוצר *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">קטגוריה</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">אתרי אינטרנט</SelectItem>
              <SelectItem value="design">עיצוב גרפי</SelectItem>
              <SelectItem value="marketing">שיווק דיגיטלי</SelectItem>
              <SelectItem value="video">עריכת וידאו</SelectItem>
              <SelectItem value="development">פיתוח</SelectItem>
              <SelectItem value="consultation">ייעוץ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">מחיר (₪) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="priceType">סוג תמחור</Label>
          <Select value={formData.priceType} onValueChange={(value: 'fixed' | 'hourly' | 'monthly') => setFormData({ ...formData, priceType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">מחיר קבוע</SelectItem>
              <SelectItem value="hourly">לפי שעה</SelectItem>
              <SelectItem value="monthly">חודשי</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit">יחידה</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">מוצר פעיל</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'שומר...' : product ? 'עדכן' : 'צור'}
        </Button>
      </div>
    </form>
  );
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    website: 'אתרי אינטרנט',
    design: 'עיצוב גרפי',
    marketing: 'שיווק דיגיטלי',
    video: 'עריכת וידאו',
    development: 'פיתוח',
    consultation: 'ייעוץ',
  };
  return names[category] || category;
}