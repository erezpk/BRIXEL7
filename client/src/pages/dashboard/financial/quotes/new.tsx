import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const quoteSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת'),
  clientId: z.string().min(1, 'לקוח נדרש'),
  description: z.string().optional(),
  validUntil: z.string().min(1, 'תאריך תוקף נדרש'),
  items: z.array(z.object({
    description: z.string().min(1, 'תיאור פריט נדרש'),
    quantity: z.number().min(1, 'כמות חייבת להיות גדולה מ-0'),
    unitPrice: z.number().min(0, 'מחיר יחידה לא יכול להיות שלילי'),
    total: z.number(),
  })).min(1, 'נדרש לפחות פריט אחד'),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
}

export default function NewQuotePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      title: '',
      clientId: '',
      description: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const vatAmount = subtotal * 0.18; // 18% VAT
      const totalAmount = subtotal + vatAmount;

      const response = await apiRequest('/api/quotes', 'POST', {
        ...data,
        subtotalAmount: Math.round(subtotal * 100), // Convert to agorot
        vatAmount: Math.round(vatAmount * 100), // Convert to agorot
        totalAmount: Math.round(totalAmount * 100), // Convert to agorot
        status: 'draft',
        items: data.items.map(item => ({
          ...item,
          unitPrice: Math.round(item.unitPrice * 100), // Convert to agorot
          total: Math.round(item.total * 100), // Convert to agorot
        })),
      });
      
      return response.json();
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: 'הצעת מחיר נוצרה בהצלחה' });
      navigate(`/dashboard/financial/quotes/${quote.id}`);
    },
    onError: () => {
      toast({ title: 'שגיאה ביצירת הצעת מחיר', variant: 'destructive' });
    },
  });

  const calculateItemTotal = (index: number) => {
    const quantity = form.watch(`items.${index}.quantity`);
    const unitPrice = form.watch(`items.${index}.unitPrice`);
    const total = quantity * unitPrice;
    form.setValue(`items.${index}.total`, total);
  };

  const addProductToQuote = (product: Product) => {
    append({
      description: product.name + (product.description ? ` - ${product.description}` : ''),
      quantity: 1,
      unitPrice: product.price / 100, // Convert from agorot
      total: product.price / 100,
    });
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/send-email`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'הצעת המחיר נשלחה בהצלחה למייל הלקוח!' });
    },
    onError: () => {
      toast({ title: 'שגיאה בשליחת המייל', variant: 'destructive' });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    createMutation.mutate(data);
  };

  const handleSendAndEmail = async (data: QuoteFormData) => {
    try {
      const quote = await createMutation.mutateAsync(data);
      if (quote?.id) {
        await sendEmailMutation.mutateAsync(quote.id);
      }
    } catch (error) {
      console.error('Error creating and sending quote:', error);
    }
  };

  const watchedItems = form.watch('items');
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/financial')}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">הצעת מחיר חדשה</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-3 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>פרטים כלליים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>כותרת הצעת מחיר</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="לדוגמה: פיתוח אתר אינטרנט" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>לקוח</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר לקוח" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients?.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <Textarea {...field} rows={3} placeholder="תיאור כללי של הצעת המחיר..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תוקף הצעת המחיר</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>פריטים</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">פריט {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>תיאור</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="תיאור הפריט או השירות" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>כמות</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseInt(e.target.value) || 1);
                                        setTimeout(() => calculateItemTotal(index), 0);
                                      }}
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
                                      step="0.01"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                        setTimeout(() => calculateItemTotal(index), 0);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="mt-2 text-left">
                            <span className="text-sm text-muted-foreground">סה"כ: </span>
                            <span className="font-bold">
                              {new Intl.NumberFormat('he-IL', {
                                style: 'currency',
                                currency: 'ILS'
                              }).format(watchedItems[index]?.total || 0)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0 })}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף פריט
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>הערות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea {...field} rows={4} placeholder="הערות נוספות, תנאים מיוחדים..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>סיכום</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>סכום חלקי:</span>
                      <span>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע"מ (18%):</span>
                      <span>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(subtotal * 0.18)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>סה"כ לתשלום:</span>
                      <span>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(subtotal * 1.18)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Add Products */}
                {products && products.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>מוצרים ושירותים</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {products.slice(0, 5).map((product) => (
                          <div key={product.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-muted-foreground">
                                {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(product.price / 100)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addProductToQuote(product)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createMutation.isPending}
                      >
                        צור הצעת מחיר
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        disabled={createMutation.isPending || sendEmailMutation.isPending}
                        onClick={form.handleSubmit(handleSendAndEmail)}
                      >
                        צור ושלח במייל
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/dashboard/financial')}
                      >
                        ביטול
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}