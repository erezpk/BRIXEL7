import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt, Search, Filter, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockTransactions = [
  {
    id: '1',
    clientName: 'טכנולוגיות אלפא',
    amount: 15000,
    type: 'income',
    status: 'completed',
    date: '2025-01-06',
    description: 'תשלום עבור פיתוח אתר',
    invoiceId: 'INV-001'
  },
  {
    id: '2',
    clientName: 'חברת בטא',
    amount: 8500,
    type: 'income',
    status: 'pending',
    date: '2025-01-05',
    description: 'תשלום עבור עיצוב לוגו',
    invoiceId: 'INV-002'
  },
  {
    id: '3',
    clientName: 'גמא פרויקטים',
    amount: 12000,
    type: 'income',
    status: 'completed',
    date: '2025-01-04',
    description: 'ניהול מדיה חברתית - חודש ינואר',
    invoiceId: 'INV-003'
  }
];

const transactionStatuses = [
  { value: 'pending', label: 'ממתין', color: 'yellow' },
  { value: 'completed', label: 'הושלם', color: 'green' },
  { value: 'cancelled', label: 'בוטל', color: 'red' }
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    clientName: '',
    amount: '',
    description: '',
    type: 'income'
  });
  const { toast } = useToast();

  const handleCreateTransaction = () => {
    if (!formData.clientName || !formData.amount || !formData.description) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      amount: parseInt(formData.amount),
      type: formData.type,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      description: formData.description,
      invoiceId: `INV-${String(transactions.length + 1).padStart(3, '0')}`
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({ clientName: '', amount: '', description: '', type: 'income' });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "הצלחה",
      description: "העסקה נוצרה בהצלחה"
    });
  };

  const handleGenerateInvoice = (transaction: any) => {
    toast({
      title: "חשבונית נוצרה",
      description: `חשבונית ${transaction.invoiceId} נוצרה ונשלחה ללקוח`
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusObj = transactionStatuses.find(s => s.value === status);
    return (
      <Badge variant={statusObj?.color === 'green' ? 'default' : 'secondary'}>
        {statusObj?.label || status}
      </Badge>
    );
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול עסקאות</h1>
          <p className="text-muted-foreground">
            ניהול עסקאות והכנת חשבוניות ללקוחות
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              עסקה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת עסקה חדשה</DialogTitle>
              <DialogDescription>
                הוסף עסקה חדשה והכן חשבונית ללקוח
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">שם הלקוח</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="הכנס שם הלקוח"
                />
              </div>
              <div>
                <Label htmlFor="amount">סכום (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="description">תיאור</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תיאור השירות או המוצר"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreateTransaction}>
                  יצירת עסקה
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">הכנסות השלמות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₪{totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">הכנסות ממתינות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₪{pendingIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">סה"כ עסקאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש עסקאות..."
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
            {transactionStatuses.map(status => (
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>עסקאות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.clientName}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="font-medium">
                    ₪{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateInvoice(transaction)}
                    >
                      <Receipt className="h-4 w-4" />
                      חשבונית
                    </Button>
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