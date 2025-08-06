import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  Mail, 
  Download, 
  Eye,
  Clock,
  User,
  Calendar,
  DollarSign,
  Edit,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  subtotalAmount: number;
  vatAmount: number;
  status: string;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  viewCount?: number;
  notes?: string;
}

export default function QuoteDetailPage() {
  const [location, navigate] = useLocation();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract quote ID from URL
  const quoteId = location.split('/').pop();

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ['/api/quotes', quoteId],
    enabled: !!quoteId,
  });

  // Get agency details for logo
  const { data: agency } = useQuery({
    queryKey: ['/api/agencies/current'],
    queryFn: async () => {
      const response = await fetch('/api/agencies/current', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch agency');
      return response.json();
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ senderName, senderEmail }: { senderName: string; senderEmail: string }) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/send-email`, 'POST', {
        senderName,
        senderEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    }).format(amount / 100);
  };

  const handleSendEmail = () => {
    if (!senderName || !senderEmail) {
      toast({ title: 'יש למלא שם ואימייל של השולח', variant: 'destructive' });
      return;
    }
    sendEmailMutation.mutate({ senderName, senderEmail });
  };

  if (isLoading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="text-center">טוען הצעת מחיר...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6" dir="rtl">
        <div className="text-center">הצעת מחיר לא נמצאה</div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/financial/quotes')}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">הצעת מחיר #{quote.quoteNumber}</h1>
          {getStatusBadge(quote.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>פרטי ההצעה</CardTitle>
                {agency?.logo && (
                  <img 
                    src={agency.logo} 
                    alt="לוגו סוכנות" 
                    className="h-12 object-contain"
                  />
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">כותרת</Label>
                    <p className="font-medium">{quote.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">לקוח</Label>
                    <p className="font-medium">{quote.client.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">תוקף עד</Label>
                    <p>{new Date(quote.validUntil).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">נוצר ב</Label>
                    <p>{new Date(quote.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>
                </div>
                {quote.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">תיאור</Label>
                    <p className="mt-1">{quote.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>פריטים</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-right p-4">תיאור</th>
                        <th className="text-right p-4">כמות</th>
                        <th className="text-right p-4">מחיר יחידה</th>
                        <th className="text-right p-4">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-4">{item.description}</td>
                          <td className="p-4">{item.quantity}</td>
                          <td className="p-4">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-4 font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>הערות</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>סיכום פיננסי</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>סכום חלקי:</span>
                  <span>{formatCurrency(quote.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>מע"מ (18%):</span>
                  <span>{formatCurrency(quote.vatAmount)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>סה"כ לתשלום:</span>
                  <span>{formatCurrency(quote.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Info */}
            <Card>
              <CardHeader>
                <CardTitle>מעקב</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote.sentAt ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm">נשלח ב: {new Date(quote.sentAt).toLocaleString('he-IL')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">לא נשלח עדיין</span>
                  </div>
                )}

                {quote.viewedAt ? (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">נצפה ב: {new Date(quote.viewedAt).toLocaleString('he-IL')}</span>
                    {quote.viewCount && quote.viewCount > 1 && (
                      <Badge variant="outline" className="text-xs">{quote.viewCount} צפיות</Badge>
                    )}
                  </div>
                ) : quote.sentAt ? (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">לא נצפה עדיין</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Send Email */}
            {quote.status === 'draft' && (
              <Card>
                <CardHeader>
                  <CardTitle>שליחת מייל</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="senderName">שם השולח</Label>
                    <Input
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="שם השולח"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senderEmail">אימייל השולח</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendEmail}
                    disabled={sendEmailMutation.isPending}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    שלח למייל
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/dashboard/financial/quotes/${quote.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    עריכה
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 ml-2" />
                    הורדת PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}