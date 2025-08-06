import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Eye, 
  Mail, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  totalAmount: number;
  status: string;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  viewCount?: number;
}

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/send-email`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: 'הצעת המחיר נשלחה בהצלחה למייל הלקוח!' });
    },
    onError: () => {
      toast({ title: 'שגיאה בשליחת המייל', variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      sent: { label: 'נשלח', variant: 'default' as const },
      viewed: { label: 'נצפה', variant: 'outline' as const },
      approved: { label: 'אושר', variant: 'default' as const },
      rejected: { label: 'נדחה', variant: 'destructive' as const },
      expired: { label: 'פג תוקף', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (quote: Quote) => {
    if (quote.status === 'approved') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (quote.status === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
    if (quote.status === 'expired') return <AlertCircle className="h-4 w-4 text-orange-500" />;
    if (quote.viewedAt) return <Eye className="h-4 w-4 text-blue-500" />;
    if (quote.sentAt) return <Mail className="h-4 w-4 text-gray-500" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const filteredQuotes = quotes?.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="text-center">טוען הצעות מחיר...</div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">הצעות מחיר</h1>
        <Link href="/dashboard/financial/quotes/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            הצעת מחיר חדשה
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש לפי כותרת, לקוח או מספר הצעה..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="sent">נשלח</SelectItem>
                <SelectItem value="viewed">נצפה</SelectItem>
                <SelectItem value="approved">אושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
                <SelectItem value="expired">פג תוקף</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת הצעות מחיר ({filteredQuotes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-right p-4">סטטוס</th>
                  <th className="text-right p-4">מספר הצעה</th>
                  <th className="text-right p-4">כותרת</th>
                  <th className="text-right p-4">לקוח</th>
                  <th className="text-right p-4">סכום</th>
                  <th className="text-right p-4">תוקף עד</th>
                  <th className="text-right p-4">מעקב</th>
                  <th className="text-right p-4">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(quote)}
                        {getStatusBadge(quote.status)}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{quote.quoteNumber}</td>
                    <td className="p-4 font-medium">{quote.title}</td>
                    <td className="p-4">{quote.client?.name || 'לקוח לא זמין'}</td>
                    <td className="p-4 font-medium">{formatCurrency(quote.totalAmount)}</td>
                    <td className="p-4">
                      {new Date(quote.validUntil).toLocaleDateString('he-IL')}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">
                        {quote.viewedAt ? (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>נצפה {quote.viewCount || 1} פעמים</span>
                          </div>
                        ) : quote.sentAt ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>נשלח</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">לא נשלח</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/quote-approval/${quote.id}`, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {quote.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendEmailMutation.mutate(quote.id)}
                            disabled={sendEmailMutation.isPending}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {quotes?.length === 0 ? 'אין הצעות מחיר' : 'לא נמצאו הצעות מחיר המתאימות לחיפוש'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}