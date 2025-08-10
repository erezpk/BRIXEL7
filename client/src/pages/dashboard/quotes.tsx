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
import { Plus, FileText, Edit, Trash2, Send, Eye, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  clientId: string;
  clientType: 'client' | 'lead';
  validUntil?: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  items: QuoteItem[];
  terms?: string;
  notes?: string;
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  signedAt?: string;
  createdAt: string;
}

interface QuoteItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  priceType: 'fixed' | 'hourly' | 'monthly';
  total: number;
}

export default function QuotesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  // Fetch quotes
  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes']
  });

  // Fetch clients and leads for dropdown
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients']
  });

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ['/api/leads']
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/products']
  });

  // Create quote mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/quotes', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      setIsCreateOpen(false);
      toast({
        title: 'הצלחה',
        description: 'הצעת המחיר נוצרה בהצלחה',
      });
    },
  });

  // Update quote mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/quotes/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      setIsEditOpen(false);
      setSelectedQuote(null);
      toast({
        title: 'הצלחה',
        description: 'הצעת המחיר עודכנה בהצלחה',
      });
    },
  });

  // Delete quote mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quotes/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: 'הצלחה',
        description: 'הצעת המחיר נמחקה בהצלחה',
      });
    },
  });

  // Send quote mutation
  const sendMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quotes/${id}`, 'PUT', { 
      status: 'sent', 
      sentAt: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: 'הצלחה',
        description: 'הצעת המחיר נשלחה בהצלחה',
      });
    },
  });

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק הצעת מחיר זו?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSend = (id: string) => {
    sendMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      draft: { label: 'טיוטה', variant: 'secondary' },
      sent: { label: 'נשלח', variant: 'default' },
      approved: { label: 'אושר', variant: 'default' },
      rejected: { label: 'נדחה', variant: 'destructive' },
      expired: { label: 'פג תוקף', variant: 'secondary' }
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (amount: number) => {
    return `₪${(amount / 100).toLocaleString('he-IL')}`;
  };

  const filteredQuotes = quotes.filter((quote: Quote) => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <h1 className="text-3xl font-bold text-gray-900">הצעות מחיר</h1>
          <p className="text-gray-600 mt-1">נהל הצעות מחיר ופעל להמרתן לעסקאות</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הצעת מחיר חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת הצעת מחיר חדשה</DialogTitle>
            </DialogHeader>
            <QuoteForm 
              clients={clients}
              leads={leads}
              products={products}
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
            placeholder="חפש הצעות מחיר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="draft">טיוטות</SelectItem>
            <SelectItem value="sent">נשלחו</SelectItem>
            <SelectItem value="approved">אושרו</SelectItem>
            <SelectItem value="rejected">נדחו</SelectItem>
            <SelectItem value="expired">פג תוקף</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">סה"כ הצעות</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">ממתינות לתגובה</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quotes.filter((q: Quote) => q.status === 'sent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">אושרו</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quotes.filter((q: Quote) => q.status === 'approved').length}
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
                <p className="text-sm font-medium text-gray-600">ערך כולל</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(quotes.reduce((sum: number, q: Quote) => sum + q.totalAmount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuotes.map((quote: Quote) => (
          <Card key={quote.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{quote.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">מספר: {quote.quoteNumber}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(quote.status)}
                    {quote.validUntil && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 ml-1" />
                        תוקף עד: {new Date(quote.validUntil).toLocaleDateString('he-IL')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {quote.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSend(quote.id)}
                      disabled={sendMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(quote)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(quote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {quote.description || 'אין תיאור'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">סכום כולל:</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {formatPrice(quote.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">סכום לפני מע"ם:</span>
                  <span>{formatPrice(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">מע"ם:</span>
                  <span>{formatPrice(quote.vatAmount)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {quote.items.length} פריטים
                </div>
                {quote.sentAt && (
                  <div className="text-xs text-gray-500">
                    נשלח: {new Date(quote.sentAt).toLocaleDateString('he-IL')}
                  </div>
                )}
                {quote.approvedAt && (
                  <div className="text-xs text-green-600">
                    אושר: {new Date(quote.approvedAt).toLocaleDateString('he-IL')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין הצעות מחיר</h3>
          <p className="text-gray-600 mb-4">התחל ליצור הצעות מחיר חדשות</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הצעת מחיר ראשונה
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת הצעת מחיר</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <QuoteForm 
              quote={selectedQuote}
              clients={clients}
              leads={leads}
              products={products}
              onSubmit={(data) => updateMutation.mutate({ id: selectedQuote.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quote Form Component
function QuoteForm({ 
  quote, 
  clients,
  leads,
  products,
  onSubmit, 
  isLoading 
}: { 
  quote?: Quote | null; 
  clients: any[];
  leads: any[];
  products: any[];
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: quote?.title || '',
    description: quote?.description || '',
    clientId: quote?.clientId || '',
    clientType: quote?.clientType || 'client',
    validUntil: quote?.validUntil || '',
    terms: quote?.terms || '',
    notes: quote?.notes || '',
    items: quote?.items || [],
  });

  const addItem = () => {
    const newItem = {
      id: Math.random().toString(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      priceType: 'fixed' as const,
      total: 0
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = Math.round(subtotal * 0.17); // 17% VAT
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal, vatAmount, totalAmount };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { subtotal, vatAmount, totalAmount } = calculateTotals();
    
    onSubmit({
      ...formData,
      subtotal: Math.round(subtotal * 100), // Convert to agorot
      vatAmount: Math.round(vatAmount * 100),
      totalAmount: Math.round(totalAmount * 100),
      items: formData.items.map(item => ({
        ...item,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.total * 100),
      }))
    });
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">כותרת הצעת המחיר *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="validUntil">תוקף עד</Label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientType">סוג לקוח</Label>
          <Select value={formData.clientType} onValueChange={(value: 'client' | 'lead') => setFormData({ ...formData, clientType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">לקוח קיים</SelectItem>
              <SelectItem value="lead">ליד</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="clientId">בחר לקוח/ליד *</Label>
          <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="בחר לקוח" />
            </SelectTrigger>
            <SelectContent>
              {formData.clientType === 'client' 
                ? clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))
                : leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company || lead.email}
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">פריטי הצעת המחיר</h3>
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף פריט
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <Label>שם הפריט</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="שם הפריט"
                />
              </div>
              <div className="col-span-2">
                <Label>כמות</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-2">
                <Label>מחיר יחידה</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Label>סוג תמחור</Label>
                <Select 
                  value={item.priceType} 
                  onValueChange={(value) => updateItem(index, { priceType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">קבוע</SelectItem>
                    <SelectItem value="hourly">שעתי</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>סה"כ</Label>
                <div className="h-10 px-3 py-2 border rounded bg-gray-50 flex items-center">
                  ₪{item.total.toLocaleString('he-IL')}
                </div>
              </div>
              <div className="col-span-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="תיאור הפריט (אופציונלי)"
                rows={2}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Totals */}
      <Card className="p-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>סכום לפני מע"ם:</span>
            <span>₪{subtotal.toLocaleString('he-IL')}</span>
          </div>
          <div className="flex justify-between">
            <span>מע"ם (17%):</span>
            <span>₪{vatAmount.toLocaleString('he-IL')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>סה"כ לתשלום:</span>
            <span>₪{totalAmount.toLocaleString('he-IL')}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="terms">תנאים</Label>
          <Textarea
            id="terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={3}
            placeholder="תנאי התקשרות ותשלום"
          />
        </div>
        <div>
          <Label htmlFor="notes">הערות</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="הערות נוספות"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || formData.items.length === 0}>
          {isLoading ? 'שומר...' : quote ? 'עדכן' : 'צור'}
        </Button>
      </div>
    </form>
  );
}