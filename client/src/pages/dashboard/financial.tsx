import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, FileText, Receipt, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

interface FinancialStats {
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeQuotes: number;
  signedContracts: number;
}

interface Quote {
  id: string;
  title: string;
  client: { name: string };
  totalAmount: number;
  status: string;
  validUntil: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: { name: string };
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  issueDate: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  client: { name: string };
  status: string;
  totalValue: number;
  startDate: string;
  endDate: string;
}

interface Payment {
  id: string;
  client: { name: string };
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: statsLoading } = useQuery<FinancialStats>({
    queryKey: ['/api/financial/stats'],
  });

  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
    enabled: activeTab === 'quotes',
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    enabled: activeTab === 'invoices',
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    enabled: activeTab === 'contracts',
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
    enabled: activeTab === 'payments',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'bg-gray-500', text: 'טיוטה' },
      sent: { color: 'bg-blue-500', text: 'נשלח' },
      approved: { color: 'bg-green-500', text: 'אושר' },
      rejected: { color: 'bg-red-500', text: 'נדחה' },
      signed: { color: 'bg-green-600', text: 'חתום' },
      pending: { color: 'bg-yellow-500', text: 'ממתין' },
      paid: { color: 'bg-green-500', text: 'שולם' },
      overdue: { color: 'bg-red-500', text: 'באיחור' },
      partially_paid: { color: 'bg-orange-500', text: 'שולם חלקית' },
      completed: { color: 'bg-green-500', text: 'הושלם' },
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-500', text: status };
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.text}
      </Badge>
    );
  };

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול פיננסי</h1>
        <Link href="/dashboard/financial/quotes/new">
          <Button>הצעת מחיר חדשה</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">חשבוניות ממתינות</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInvoices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">חשבוניות באיחור</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overdueInvoices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הצעות מחיר פעילות</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeQuotes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">חוזים חתומים</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.signedContracts || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="quotes">הצעות מחיר</TabsTrigger>
          <TabsTrigger value="invoices">חשבוניות</TabsTrigger>
          <TabsTrigger value="contracts">חוזים</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Quotes */}
            <Card>
              <CardHeader>
                <CardTitle>הצעות מחיר אחרונות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotes?.slice(0, 5).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{quote.title}</p>
                        <p className="text-sm text-muted-foreground">{quote.client?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(quote.totalAmount / 100)}</span>
                        {getStatusBadge(quote.status)}
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-4">אין הצעות מחיר</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>חשבוניות אחרונות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices?.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.client?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(invoice.totalAmount / 100)}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-4">אין חשבוניות</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">הצעות מחיר</h2>
            <Link href="/dashboard/financial/quotes/new">
              <Button>הצעת מחיר חדשה</Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right p-4">כותרת</th>
                      <th className="text-right p-4">לקוח</th>
                      <th className="text-right p-4">סכום</th>
                      <th className="text-right p-4">סטטוס</th>
                      <th className="text-right p-4">בתוקף עד</th>
                      <th className="text-right p-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes?.map((quote) => (
                      <tr key={quote.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{quote.title}</td>
                        <td className="p-4">{quote.client?.name}</td>
                        <td className="p-4">{formatCurrency(quote.totalAmount / 100)}</td>
                        <td className="p-4">{getStatusBadge(quote.status)}</td>
                        <td className="p-4">{new Date(quote.validUntil).toLocaleDateString('he-IL')}</td>
                        <td className="p-4">
                          <Link href={`/dashboard/financial/quotes/${quote.id}`}>
                            <Button variant="outline" size="sm">צפה</Button>
                          </Link>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          אין הצעות מחיר
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">חשבוניות</h2>
            <Link href="/dashboard/financial/invoices/new">
              <Button>חשבונית חדשה</Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right p-4">מספר חשבונית</th>
                      <th className="text-right p-4">לקוח</th>
                      <th className="text-right p-4">סכום</th>
                      <th className="text-right p-4">שולם</th>
                      <th className="text-right p-4">סטטוס</th>
                      <th className="text-right p-4">תאריך פירעון</th>
                      <th className="text-right p-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices?.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                        <td className="p-4">{invoice.client?.name}</td>
                        <td className="p-4">{formatCurrency(invoice.totalAmount / 100)}</td>
                        <td className="p-4">{formatCurrency(invoice.paidAmount / 100)}</td>
                        <td className="p-4">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4">{new Date(invoice.dueDate).toLocaleDateString('he-IL')}</td>
                        <td className="p-4">
                          <Link href={`/dashboard/financial/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm">צפה</Button>
                          </Link>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          אין חשבוניות
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">חוזים</h2>
            <Link href="/dashboard/financial/contracts/new">
              <Button>חוזה חדש</Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right p-4">מספר חוזה</th>
                      <th className="text-right p-4">כותרת</th>
                      <th className="text-right p-4">לקוח</th>
                      <th className="text-right p-4">ערך</th>
                      <th className="text-right p-4">סטטוס</th>
                      <th className="text-right p-4">תקופה</th>
                      <th className="text-right p-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts?.map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{contract.contractNumber}</td>
                        <td className="p-4">{contract.title}</td>
                        <td className="p-4">{contract.client?.name}</td>
                        <td className="p-4">{contract.totalValue ? formatCurrency(contract.totalValue / 100) : '-'}</td>
                        <td className="p-4">{getStatusBadge(contract.status)}</td>
                        <td className="p-4">
                          {contract.startDate && contract.endDate && (
                            `${new Date(contract.startDate).toLocaleDateString('he-IL')} - ${new Date(contract.endDate).toLocaleDateString('he-IL')}`
                          )}
                        </td>
                        <td className="p-4">
                          <Link href={`/dashboard/financial/contracts/${contract.id}`}>
                            <Button variant="outline" size="sm">צפה</Button>
                          </Link>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          אין חוזים
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}