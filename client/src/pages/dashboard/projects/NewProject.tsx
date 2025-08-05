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

export default function NewProject() {
  return (
    <Card className="w-[350px] mx-auto mt-10">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="react">React.js</SelectItem>
                  <SelectItem value="vue">Vue.js</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A short description of your project" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="url">Project URL</Label>
              <Input id="url" placeholder="https://example.com" />
            </div>
            <Button type="submit" className="w-full flex items-center justify-center">
              Create Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}