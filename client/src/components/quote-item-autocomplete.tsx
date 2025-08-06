import { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Package } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';
import { cn } from '@/lib/utils';

interface QuoteItemProps {
  index: number;
  form: any;
  remove: (index: number) => void;
  onItemChange: (index: number, field: string, value: any) => void;
}

export function QuoteItemAutocomplete({ index, form, remove, onItemChange }: QuoteItemProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    onItemChange(index, 'priceType', (product as any).priceType || 'fixed');
    
    // Calculate total based on quantity
    const quantity = form.watch(`items.${index}.quantity`) || 1;
    onItemChange(index, 'total', (product.price / 100) * quantity);
    
    setSearchValue(product.name);
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
    <Card className="p-4">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">פריט {index + 1}</h4>
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
        <FormField
          control={form.control}
          name={`items.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם הפריט</FormLabel>
              <FormControl>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {selectedProduct ? (
                          <>
                            <Package className="h-4 w-4" />
                            <span>{selectedProduct.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {priceTypeLabel((selectedProduct as any).priceType || 'fixed')}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            <span>חפש מוצר או הקלד שם חדש...</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="חפש מוצרים..." 
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">לא נמצאו מוצרים</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                onItemChange(index, 'name', searchValue);
                                onItemChange(index, 'description', '');
                                onItemChange(index, 'productId', '');
                                setSelectedProduct(null);
                                setOpen(false);
                              }}
                            >
                              צור פריט חדש: "{searchValue}"
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => handleProductSelect(product)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  {product.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {product.description}
                                    </div>
                                  )}
                                </div>
                                <div className="text-left">
                                  <div className="font-medium">
                                    ₪{(product.price / 100).toLocaleString()}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {priceTypeLabel((product as any).priceType || 'fixed')}
                                  </Badge>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name={`items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור</FormLabel>
              <FormControl>
                <Input {...field} placeholder="תיאור מפורט של הפריט..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantity */}
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
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Price */}
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

          {/* Price Type */}
          <FormField
            control={form.control}
            name={`items.${index}.priceType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>סוג מחיר</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג מחיר" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed">קבוע</SelectItem>
                    <SelectItem value="hourly">שעתי</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total */}
          <FormField
            control={form.control}
            name={`items.${index}.total`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>סה"כ (₪)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" readOnly className="bg-gray-50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}