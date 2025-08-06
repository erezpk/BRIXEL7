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
import { Plus, Trash2, ArrowRight, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SimpleQuoteItem } from '@/components/simple-quote-item';

const quoteSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת'),
  clientId: z.string().min(1, 'לקוח או ליד נדרש'),
  clientType: z.enum(['client', 'lead']).default('client'),
  description: z.string().optional(),
  validUntil: z.string().min(1, 'תאריך תוקף נדרש'),
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string().min(1, 'שם פריט נדרש'),
    description: z.string().min(1, 'תיאור פריט נדרש'),
    quantity: z.number().min(1, 'כמות חייבת להיות גדולה מ-0'),
    unitPrice: z.number().min(0, 'מחיר יחידה לא יכול להיות שלילי'),
    priceType: z.enum(['fixed', 'hourly', 'monthly']).default('fixed'),
    total: z.number(),
  })).min(1, 'נדרש לפחות פריט אחד'),
  notes: z.string().optional(),
  emailMessage: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
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
      clientType: 'client' as const,
      description: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      items: [{ productId: '', name: '', description: '', quantity: 1, unitPrice: 0, priceType: 'fixed' as const, total: 0 }],
      notes: '',
      emailMessage: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Fetch clients and leads for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
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
        subtotal: Math.round(subtotal * 100), // Convert to agorot - matching schema field name
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
      navigate('/dashboard/sales/quotes');
    },
    onError: (error: any) => {
      console.error('Create quote error:', error);
      toast({ title: 'שגיאה ביצירת הצעת מחיר', description: error?.message || 'נסה שוב מאוחר יותר', variant: 'destructive' });
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
      productId: product.id,
      name: product.name,
      description: product.description || product.name,
      quantity: 1,
      unitPrice: product.price / 100, // Convert from agorot
      priceType: 'fixed' as const,
      total: product.price / 100,
    });
  };

  const sendEmailMutation = useMutation({
    mutationFn: async ({ quoteId, senderData }: { quoteId: string, senderData: { emailMessage: string } }) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/send-email`, 'POST', senderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: 'הצעת המחיר נשלחה בהצלחה למייל הלקוח!' });
      // Navigate to quotes table after successful email send
      navigate('/dashboard/sales/quotes');
    },
    onError: (error: any) => {
      console.error('Email send error:', error);
      toast({ title: 'שגיאה בשליחת המייל', description: error?.message || 'נסה שוב מאוחר יותר', variant: 'destructive' });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    createMutation.mutate(data);
  };

  const handleSendAndEmail = async (data: QuoteFormData) => {
    try {
      console.log('Creating quote with data:', data);
      const quote = await createMutation.mutateAsync(data);
      if (quote?.id) {
        // Get sender info from form or use default
        const senderData = {
          emailMessage: data.emailMessage || ''
        };
        console.log('Sending email with sender data:', senderData);
        await sendEmailMutation.mutateAsync({ quoteId: quote.id, senderData });
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
            onClick={() => navigate('/dashboard/sales/quotes')}
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

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="clientType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>סוג נמען</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="client">לקוח קיים</SelectItem>
                                  <SelectItem value="lead">ליד/פרוספקט</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch('clientType') === 'lead' ? 'ליד *' : 'לקוח *'}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={
                                      form.watch('clientType') === 'lead' ? 'בחר ליד' : 'בחר לקוח'
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {form.watch('clientType') === 'lead' ? (
                                    leads?.map((lead) => (
                                      <SelectItem key={lead.id} value={lead.id}>
                                        <div>
                                          <div className="font-medium">{lead.name}</div>
                                          {lead.email && (
                                            <div className="text-sm text-gray-600">{lead.email}</div>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    clients?.map((client) => (
                                      <SelectItem key={client.id} value={client.id}>
                                        <div>
                                          <div className="font-medium">{client.name}</div>
                                          {client.email && (
                                            <div className="text-sm text-gray-600">{client.email}</div>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}

                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                        <SimpleQuoteItem
                          key={field.id}
                          index={index}
                          form={form}
                          remove={remove}
                          onItemChange={(idx, fieldName, value) => {
                            form.setValue(`items.${idx}.${fieldName}` as any, value);
                          }}
                        />
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ 
                          productId: '', 
                          name: '', 
                          description: '', 
                          quantity: 1, 
                          unitPrice: 0, 
                          priceType: 'fixed' as const, 
                          total: 0 
                        })}
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

              {/* Sidebar - Email & Summary */}
              <div className="space-y-6">
                {/* Email Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      הודעה למייל
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="emailMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>הודעה אישית למייל (אופציונלי)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4} 
                              placeholder="הודעה אישית שתישלח עם הצעת המחיר למייל הלקוח..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>סיכום הצעת מחיר</CardTitle>
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

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? 'שומר...' : 'שמור הצעת מחיר'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        onClick={form.handleSubmit(handleSendAndEmail)}
                        disabled={createMutation.isPending || sendEmailMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                        {sendEmailMutation.isPending ? 'שולח...' : 'שמור ושלח במייל'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/dashboard/sales/quotes')}
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