import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Edit,
  Trash2
} from 'lucide-react';

export default function ProjectDetails() {
  const { projectId } = useParams();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-right">
          <h1 className="text-3xl font-bold font-rubik">פרטי פרויקט</h1>
          <p className="text-gray-600">מידע מפורט על הפרויקט</p>
        </div>
        <div className="flex space-x-reverse space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="ml-2 h-4 w-4" />
            ערוך
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="ml-2 h-4 w-4" />
            מחק
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-right font-rubik">פרטי הפרויקט</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-right">שם הפרויקט</h3>
                  <p className="text-gray-600 text-right">פרויקט דוגמה</p>
                </div>
                <div>
                  <h3 className="font-semibold text-right">תיאור</h3>
                  <p className="text-gray-600 text-right">תיאור מפורט של הפרויקט</p>
                </div>
                <div>
                  <h3 className="font-semibold text-right">התקדמות</h3>
                  <Progress value={65} className="mt-2" />
                  <p className="text-sm text-gray-600 text-right mt-1">65% הושלם</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-right font-rubik">מידע כללי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge>פעיל</Badge>
                <span className="text-sm text-gray-600">סטטוס</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">01/01/2024</span>
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="ml-1 h-4 w-4" />
                  תאריך התחלה
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">31/03/2024</span>
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="ml-1 h-4 w-4" />
                  תאריך סיום
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}