
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

export default function NewProject() {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle project creation logic here
    console.log({ projectName, projectDescription, projectType });
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-right">פרויקט חדש</CardTitle>
          <CardDescription className="text-right">
            צור פרויקט חדש עבור הלקוח שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-right block">
                שם הפרויקט
              </Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="הכנס שם פרויקט"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-right block">
                תיאור הפרויקט
              </Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="תאר את הפרויקט"
                className="text-right min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-right block">
                סוג הפרויקט
              </Label>
              <Select value={projectType} onValueChange={setProjectType} required>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סוג פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">אתר אינטרנט</SelectItem>
                  <SelectItem value="mobile-app">אפליקציית מובייל</SelectItem>
                  <SelectItem value="web-app">אפליקציית ווב</SelectItem>
                  <SelectItem value="ecommerce">חנות מקוונת</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              צור פרויקט
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
