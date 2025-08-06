import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Trash2, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
}

interface SimpleQuoteItemProps {
  index: number;
  form: UseFormReturn<any>;
  remove: (index: number) => void;
  onItemChange: (index: number, field: string, value: any) => void;
}

export function SimpleQuoteItem({ index, form, remove, onItemChange }: SimpleQuoteItemProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomFields, setShowCustomFields] = useState(false);

  // Fetch products for autocomplete
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    searchValue && (
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (product.description?.toLowerCase() || '').includes(searchValue.toLowerCase())
    )
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    onItemChange(index, 'productId', product.id);
    onItemChange(index, 'name', product.name);
    onItemChange(index, 'description', product.description || product.name);
    onItemChange(index, 'unitPrice', product.price / 100);
    onItemChange(index, 'priceType', 'fixed');
    
    const quantity = form.watch(`items.${index}.quantity`) || 1;
    onItemChange(index, 'total', (product.price / 100) * quantity);
    
    setSearchValue(product.name);
    setShowResults(false);
    setShowCustomFields(false);
  };

  const handleCreateCustom = () => {
    setSelectedProduct(null);
    onItemChange(index, 'productId', '');
    onItemChange(index, 'name', searchValue);
    onItemChange(index, 'description', '');
    onItemChange(index, 'unitPrice', 0);
    onItemChange(index, 'priceType', 'fixed');
    setShowResults(false);
    setShowCustomFields(true);
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

  return (
    <Card className="p-4 relative">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg">פריט {index + 1}</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Search */}
        <div className="space-y-2 relative">
          <label className="text-sm font-medium">חיפוש מוצר</label>
          
          <div className="relative">
            <Input
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="הקלד שם מוצר לחיפוש או צור פריט חדש..."
              className="text-right pr-10"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Results */}
          {showResults && searchValue && (
            <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="p-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full text-right p-3 hover:bg-gray-50 rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600">{product.description}</div>
                        )}
                      </div>
                      <div className="text-green-600 font-medium">
                        ₪{(product.price / 100).toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
              
              <button
                type="button"
                onClick={handleCreateCustom}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border-t flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                צור פריט חדש: "{searchValue}"
              </button>
            </div>
          )}
        </div>

        {/* Selected Product Display */}
        {selectedProduct && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">נבחר: {selectedProduct.name}</span>
            </div>
            {selectedProduct.description && (
              <p className="text-sm text-green-700 mt-1">{selectedProduct.description}</p>
            )}
          </div>
        )}

        {/* Custom Fields */}
        {showCustomFields && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
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

            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור הפריט *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="תאר את הפריט או השירות..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        {/* Click outside to close results */}
        {showResults && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowResults(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}