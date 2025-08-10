import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, FileText, Clock, CheckCircle, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

interface FinanceDashboard {
  totalRevenue: number;
  pendingQuotes: number;
  approvedQuotes: number;
  totalQuoteValue: number;
  unpaidInvoicesCount: number;
  totalUnpaid: number;
  recentPayments: any[];
  recentQuotes: any[];
  cashFlow: {
    income: number;
    expenses: number;
    balance: number;
  };
}

export default function FinancePage() {
  const { data: dashboard, isLoading } = useQuery<FinanceDashboard>({
    queryKey: ['/api/finance/dashboard']
  });

  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ['/api/quotes']
  });

  const formatCurrency = (amount: number) => {
    return `₪${(amount / 100).toLocaleString('he-IL')}`;
  };

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

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">לא ניתן לטעון נתונים פיננסיים</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">דשבורד פיננסי</h1>
          <p className="text-gray-600 mt-1">מבט כללי על המצב הפיננסי של הסוכנות</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/quotes">
            <Button variant="outline">
              <FileText className="h-4 w-4 ml-2" />
              הצעות מחיר
            </Button>
          </Link>
          <Link href="/dashboard/products">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 ml-2" />
              מוצרים
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">סה"כ הכנסות</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">הצעות ממתינות</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.pendingQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">הצעות אושרו</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.approvedQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">חשבוניות לא שולמו</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.unpaidInvoicesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Quotes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              תזרים מזומנים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">הכנסות:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(dashboard.cashFlow.income)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">הוצאות:</span>
              <span className="text-lg font-semibold text-red-600">
                {formatCurrency(dashboard.cashFlow.expenses)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">יתרה:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(dashboard.cashFlow.balance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              סטטיסטיקות הצעות מחיר
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ערך כולל הצעות:</span>
              <span className="text-lg font-semibold">
                {formatCurrency(dashboard.totalQuoteValue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">סכום לא שולם:</span>
              <span className="text-lg font-semibold text-orange-600">
                {formatCurrency(dashboard.totalUnpaid)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">אחוז אישור:</span>
              <span className="text-lg font-semibold text-green-600">
                {quotes.length > 0 
                  ? Math.round((dashboard.approvedQuotes / quotes.length) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              תשלומים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentPayments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <Badge variant="default">שולם</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">אין תשלומים אחרונים</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              הצעות מחיר אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentQuotes.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentQuotes.slice(0, 5).map((quote: any) => (
                  <div key={quote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{quote.title}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(quote.totalAmount)}
                      </p>
                    </div>
                    <Badge variant={
                      quote.status === 'approved' ? 'default' :
                      quote.status === 'sent' ? 'secondary' :
                      quote.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {getStatusLabel(quote.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">אין הצעות מחיר אחרונות</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/quotes">
              <Button className="w-full h-16 flex flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                צור הצעת מחיר חדשה
              </Button>
            </Link>
            <Link href="/dashboard/products">
              <Button className="w-full h-16 flex flex-col gap-2" variant="outline">
                <DollarSign className="h-6 w-6" />
                נהל מוצרים ושירותים
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button className="w-full h-16 flex flex-col gap-2" variant="outline">
                <CreditCard className="h-6 w-6" />
                עקוב אחרי תשלומים
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    sent: 'נשלח',
    approved: 'אושר',
    rejected: 'נדחה',
    expired: 'פג תוקף'
  };
  return statusLabels[status] || status;
}