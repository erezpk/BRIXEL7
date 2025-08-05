import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

export default function NewProject() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-right font-rubik">פרויקט חדש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right">שם הפרויקט</Label>
            <Input id="name" placeholder="הכנס שם הפרויקט" className="text-right" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">תיאור</Label>
            <Textarea id="description" placeholder="תיאור הפרויקט" className="text-right" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-right">לקוח</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client1">לקוח 1</SelectItem>
                <SelectItem value="client2">לקוח 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-reverse space-x-2">
            <Button variant="outline">ביטול</Button>
            <Button>
              צור פרויקט
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}