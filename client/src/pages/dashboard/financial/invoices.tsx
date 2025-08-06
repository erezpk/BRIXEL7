import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Search, Download, Eye, Send, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockInvoices = [
  {
    id: 'INV-001',
    clientName: 'טכנולוגיות אלפא',
    clientEmail: 'contact@alpha-tech.co.il',
    amount: 15000,
    status: 'paid',
    dueDate: '2025-01-20',
    issueDate: '2025-01-06',
    description: 'פיתוח אתר אינטרנט',
    items: [
      { description: 'עיצוב UI/UX', quantity: 1, unitPrice: 8000, total: 8000 },
      { description: 'פיתוח Frontend', quantity: 1, unitPrice: 7000, total: 7000 }
    ]
  },
  {
    id: 'INV-002',
    clientName: 'חברת בטא',
    clientEmail: 'info@beta.co.il',
    amount: 8500,
    status: 'sent',
    dueDate: '2025-01-25',
    issueDate: '2025-01-05',
    description: 'עיצוב לוגו ומיתוג',
    items: [
      { description: 'עיצוב לוגו', quantity: 1, unitPrice: 5000, total: 5000 },
      { description: 'חבילת מיתוג', quantity: 1, unitPrice: 3500, total: 3500 }
    ]
  },
  {
    id: 'INV-003',
    clientName: 'גמא פרויקטים',
    clientEmail: 'contact@gamma.co.il',
    amount: 12000,
    status: 'overdue',
    dueDate: '2025-01-01',
    issueDate: '2024-12-15',
    description: 'ניהול מדיה חברתית',
    items: [
      { description: 'ניהול מדיה חברתית - חודש דצמבר', quantity: 1, unitPrice: 12000, total: 12000 }
    ]
  }
];

const invoiceStatuses = [
  { value: 'draft', label: 'טיוטה', color: 'gray' },
  { value: 'sent', label: 'נשלח', color: 'blue' },
  { value: 'paid', label: 'שולם', color: 'green' },
  { value: 'overdue', label: 'באיחור', color: 'red' },
  { value: 'cancelled', label: 'בוטל', color: 'red' }
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const handleSendInvoice = (invoice: any) => {
    // Update invoice status to sent
    setInvoices(invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'sent' } : inv
    ));
    
    toast({
      title: "חשבונית נשלחה",
      description: `חשבונית ${invoice.id} נשלחה ללקוח בהצלחה`
    });
  };

  const handleMarkAsPaid = (invoice: any) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
    ));
    
    toast({
      title: "חשבונית סומנה כשולמה",
      description: `חשבונית ${invoice.id} סומנה כשולמה`
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusObj = invoiceStatuses.find(s => s.value === status);
    const variant = status === 'paid' ? 'default' : 
                   status === 'overdue' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant}>
        {statusObj?.label || status}
      </Badge>
    );
  };

  const totalAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול חשבוניות</h1>
          <p className="text-muted-foreground">
            יצירה וניהול של חשבוניות ללקוחות
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          חשבונית חדשה
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">הכנסות שולמו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₪{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ממתין לתשלום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₪{pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">חשבוניות באיחור</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">סה"כ חשבוניות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש חשבוניות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="סינון לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {invoiceStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          ייצא לאקסל
        </Button>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>חשבוניות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר חשבונית</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>תאריך הנפקה</TableHead>
                <TableHead>תאריך תשלום</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.id}
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>
                    {new Date(invoice.issueDate).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₪{invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {['sent', 'overdue'].includes(invoice.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice)}
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}