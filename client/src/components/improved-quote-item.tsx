import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Trash2, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
}

interface ImprovedQuoteItemProps {
  index: number;
  form: UseFormReturn<any>;
  remove: (index: number) => void;
  onItemChange: (index: number, field: string, value: any) => void;
}

export function ImprovedQuoteItem({ index, form, remove, onItemChange }: ImprovedQuoteItemProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomFields, setShowCustomFields] = useState(false);

  // Fetch products for autocomplete
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (product.description?.toLowerCase() || '').includes(searchValue.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    onItemChange(index, 'productId', product.id);
    onItemChange(index, 'name', product.name);
    onItemChange(index, 'description', product.description || product.name);
    onItemChange(index, 'unitPrice', product.price / 100); // Convert from agorot
    onItemChange(index, 'priceType', 'fixed');
    
    // Calculate total based on quantity
    const quantity = form.watch(`items.${index}.quantity`) || 1;
    onItemChange(index, 'total', (product.price / 100) * quantity);
    
    setSearchValue(product.name);
    setShowCustomFields(false); // Hide custom fields when product is selected
    setOpen(false);
  };

  const handleCustomProduct = () => {
    setSelectedProduct(null);
    onItemChange(index, 'productId', '');
    onItemChange(index, 'name', searchValue || '');
    onItemChange(index, 'description', '');
    onItemChange(index, 'unitPrice', 0);
    onItemChange(index, 'priceType', 'fixed');
    onItemChange(index, 'total', 0);
    setShowCustomFields(true); // Show custom fields for manual input
    setOpen(false);
  };

  const calculateTotal = () => {
    const quantity = form.watch(`items.${index}.quantity`) || 0;
    const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
    const total = quantity * unitPrice;
    onItemChange(index, 'total', total);
  };

  useEffect(() => {
    calculateTotal();
  }, [form.watch(`items.${index}.quantity`), form.watch(`items.${index}.unitPrice`)]);

  const priceTypeLabel = (type: string) => {
    switch (type) {
      case 'hourly': return 'שעתי';
      case 'monthly': return 'חודשי';
      default: return 'קבוע';
    }
  };

  return (
    <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg">פריט {index + 1}</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Search - Simplified and Improved */}
        <div className="space-y-2">
          <label className="text-sm font-medium">חיפוש מוצר</label>
          <div className="relative">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={selectedProduct ? selectedProduct.name : "הקלד שם מוצר לחיפוש או צור חדש..."}
              className={cn(
                "text-right pr-10",
                selectedProduct ? "border-green-200 bg-green-50" : "border-gray-200"
              )}
              onFocus={() => setOpen(true)}
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Search Results Dropdown */}
          {open && (
            <div className="relative z-50">
              <div className="absolute top-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchValue && filteredProducts.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">לא נמצאו מוצרים</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCustomProduct}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      צור פריט חדש: "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-right p-3 hover:bg-gray-50 rounded border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {product.description}
                              </div>
                            )}
                          </div>
                          <div className="text-left mr-4">
                            <div className="font-medium text-green-600">
                              ₪{(product.price / 100).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchValue && (
                      <button
                        onClick={handleCustomProduct}
                        className="w-full text-center p-3 bg-blue-50 hover:bg-blue-100 rounded border-t text-blue-600"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Plus className="h-4 w-4" />
                          צור פריט חדש: "{searchValue}"
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Click outside to close */}
          {open && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
          )}
        </div>

        {/* Custom Fields - Show only when needed */}
        {(showCustomFields || !selectedProduct) && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Plus className="h-4 w-4" />
              <span>פרטי פריט מותאם אישית</span>
            </div>
            
            {/* Custom Product Name */}
            <FormField
              control={form.control}
              name={`items.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הפריט *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הקלד שם הפריט..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Description */}
            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור הפריט *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={2} 
                      placeholder="תאר את הפריט, השירות או המוצר..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Type */}
            <FormField
              control={form.control}
              name={`items.${index}.priceType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג תמחור</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">מחיר קבוע</SelectItem>
                      <SelectItem value="hourly">מחיר שעתי</SelectItem>
                      <SelectItem value="monthly">מחיר חודשי</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Quantity and Price */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>כמות</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`items.${index}.unitPrice`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>מחיר יחידה (₪)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`items.${index}.total`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>סה"כ (₪)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value?.toFixed(2) || '0.00'}
                    disabled
                    className="bg-gray-100 font-medium"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Show selected product info */}
        {selectedProduct && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Package className="h-4 w-4" />
              <span className="font-medium">מוצר נבחר: {selectedProduct.name}</span>
            </div>
            {selectedProduct.description && (
              <p className="text-sm text-green-700 mt-1">{selectedProduct.description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}