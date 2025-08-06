import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  Building,
  User,
  Pen
} from 'lucide-react';
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
  agency: {
    id: string;
    name: string;
    logo?: string;
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
  notes?: string;
}

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
}

function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - responsive
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(400, rect.width);
    canvas.height = 200;
    
    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.type.includes('touch')) {
      const touchEvent = e as React.TouchEvent;
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      const mouseEvent = e as React.MouseEvent;
      x = mouseEvent.clientX - rect.left;
      y = mouseEvent.clientY - rect.top;
    }

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL();
    onSave(signature);
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-200 rounded cursor-crosshair bg-white touch-none"
          style={{ touchAction: 'none', maxWidth: '100%', height: '200px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={clearSignature} size="sm" className="w-full sm:w-auto">
          נקה חתימה
        </Button>
        <Button onClick={saveSignature} size="sm" className="w-full sm:w-auto">
          <Pen className="h-4 w-4 ml-2" />
          שמור חתימה
        </Button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        חתום באמצעות העכבר במחשב או באמצעות האצבע במכשיר נייד
      </p>
    </div>
  );
}

export default function QuoteApprovalPage() {
  const [location] = useLocation();
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract quote ID from URL
  const quoteId = location.split('/').pop();

  // Track page view when component mounts
  useEffect(() => {
    if (quoteId) {
      // Track that the quote was viewed
      apiRequest(`/api/quotes/${quoteId}/track-view`, 'POST').catch(console.error);
    }
  }, [quoteId]);

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ['/api/quotes', quoteId, 'public'],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/${quoteId}/public`);
      if (!response.ok) throw new Error('Quote not found');
      return response.json();
    },
    enabled: !!quoteId,
  });

  // Get agency details for logo
  const { data: agency } = useQuery({
    queryKey: ['/api/agencies/current'],
    queryFn: async () => {
      const response = await fetch('/api/agencies/current', {
        credentials: 'include'
      });
      if (!response.ok) return null; // Public page might not have agency access
      return response.json();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/approve`, 'POST', {
        signature,
        ipAddress: 'client-ip', // In real app, get from server
        userAgent: navigator.userAgent,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      // Show success popup
      const popup = document.createElement('div');
      popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      popup.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center" dir="rtl">
          <div class="text-green-500 text-6xl mb-4">✓</div>
          <h2 class="text-2xl font-bold mb-4 text-gray-900">המסמך נחתם בהצלחה!</h2>
          <p class="text-gray-600 mb-6">הצעת המחיר אושרה ונשלחה לעסק</p>
          <button onclick="this.closest('.fixed').remove()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
            סגור
          </button>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 3000);
    },
    onError: () => {
      setIsSubmitting(false);
      alert('שגיאה באישור הצעת המחיר. אנא נסה שוב.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/quotes/${quoteId}/reject`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      alert('הצעת המחיר נדחתה.');
    },
    onError: () => {
      alert('שגיאה בדחיית הצעת המחיר.');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    }).format(amount / 100);
  };

  const handleApprove = () => {
    if (!signature) {
      alert('יש לחתום על ההצעה כדי לאשר אותה');
      return;
    }
    setIsSubmitting(true);
    approveMutation.mutate({ signature });
  };

  const handleSignatureSave = (sig: string) => {
    setSignature(sig);
  };

  const handleSignatureClear = () => {
    setSignature(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>טוען הצעת מחיר...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">הצעת מחיר לא נמצאה</h2>
            <p className="text-gray-600">ייתכן שהקישור פג תוקף או שההצעה כבר לא זמינה.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(quote.validUntil) < new Date();
  const isAlreadyProcessed = ['approved', 'rejected'].includes(quote.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {quote.agency.logo && (
                <img 
                  src={quote.agency.logo} 
                  alt={quote.agency.name}
                  className="h-16 w-auto"
                />
              )}
              <div>
                <CardTitle className="text-2xl">{quote.agency.name}</CardTitle>
                <p className="text-gray-600">הצעת מחיר #{quote.quoteNumber}</p>
              </div>
            </div>
            <Badge 
              variant={isExpired ? "destructive" : isAlreadyProcessed ? "default" : "secondary"}
              className="mx-auto"
            >
              {isExpired ? 'פג תוקף' : 
               quote.status === 'approved' ? 'אושר' :
               quote.status === 'rejected' ? 'נדחה' :
               'ממתין לאישור'}
            </Badge>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  פרטי ההצעה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{quote.title}</h3>
                  {quote.description && (
                    <p className="text-gray-600 mt-2">{quote.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>לקוח: {quote.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>תוקף עד: {new Date(quote.validUntil).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>פריטים ושירותים</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-right p-4 font-medium">תיאור</th>
                        <th className="text-right p-4 font-medium">כמות</th>
                        <th className="text-right p-4 font-medium">מחיר יחידה</th>
                        <th className="text-right p-4 font-medium">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, index) => (
                        <tr key={item.id || index} className="border-b">
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
                  <CardTitle>הערות נוספות</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  סיכום פיננסי
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>סכום חלקי:</span>
                  <span>{formatCurrency(quote.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>מע"מ (18%):</span>
                  <span>{formatCurrency(quote.vatAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>סה"כ לתשלום:</span>
                  <span className="text-green-600">{formatCurrency(quote.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Approval Actions */}
            {!isExpired && !isAlreadyProcessed && (
              <Card>
                <CardHeader>
                  <CardTitle>אישור הצעת המחיר</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">חתימה דיגיטלית:</label>
                    <SignaturePad 
                      onSave={handleSignatureSave}
                      onClear={handleSignatureClear}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleApprove}
                      disabled={!signature || isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      {isSubmitting ? 'מאשר...' : 'אשר הצעת מחיר'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                    >
                      דחה הצעת מחיר
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    החתימה הדיגיטלית מהווה אישור משפטי להצעת המחיר
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Message */}
            {(isExpired || isAlreadyProcessed) && (
              <Card>
                <CardContent className="pt-6 text-center">
                  {isExpired ? (
                    <>
                      <Calendar className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                      <p className="font-medium text-orange-600">הצעת המחיר פגה תוקף</p>
                      <p className="text-sm text-gray-600 mt-1">
                        אנא צור קשר עם {quote.agency.name} לקבלת הצעה מעודכנת
                      </p>
                    </>
                  ) : quote.status === 'approved' ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-600">הצעת המחיר אושרה</p>
                      <p className="text-sm text-gray-600 mt-1">תודה על האישור!</p>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="font-medium text-gray-600">הצעת המחיר נדחתה</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}