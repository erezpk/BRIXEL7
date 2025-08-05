import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  User,
  FileText,
  MessageSquare,
  Upload,
  Edit,
  Trash2
} from 'lucide-react';

export default function ProjectDetails() {
  const { projectId } = useParams();

  // Mock data for demonstration - replace with actual API call
  const project = {
    id: projectId,
    name: 'Project Alpha',
    description: 'This is a sample project description for Project Alpha. It involves developing a new feature for the main application.',
    status: 'In Progress',
    progress: 60,
    dueDate: '2023-12-31',
    team: [
      { id: 1, name: 'Alice', avatar: '/avatars/01.png' },
      { id: 2, name: 'Bob', avatar: '/avatars/02.png' },
    ],
    tasks: [
      { id: 1, title: 'Setup development environment', completed: true, deadline: '2023-11-01' },
      { id: 2, title: 'Implement user authentication', completed: false, deadline: '2023-11-15' },
      { id: 3, title: 'Develop project dashboard', completed: false, deadline: '2023-11-30' },
      { id: 4, title: 'Integrate payment gateway', completed: false, deadline: '2023-12-10' },
    ],
    comments: [
      { id: 1, user: 'Alice', text: 'Great progress on the setup!', timestamp: '2023-10-20T10:00:00Z' },
      { id: 2, user: 'Bob', text: 'Need to review the task assignments for the next phase.', timestamp: '2023-10-21T14:30:00Z' },
    ]
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            Project: {project.name}
            <Badge variant="outline" className="ml-2">{project.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Due Date
              </h3>
              <p>{project.dueDate}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <User className="mr-2 h-4 w-4" /> Team Members
              </h3>
              <div className="flex -space-x-2 overflow-hidden">
                {project.team.map(member => (
                  <img key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={member.avatar} alt={member.name} />
                ))}
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Progress className="mr-2 h-4 w-4" /> Project Progress
            </h3>
            <Progress value={project.progress} />
            <span className="text-sm text-muted-foreground">{project.progress}% Complete</span>
          </div>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <div className="space-y-4">
                {project.tasks.map((task) => (
                  <Card key={task.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> Deadline: {task.deadline}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.completed ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="comments">
              <div className="space-y-4">
                {project.comments.map((comment) => (
                  <Card key={comment.id} className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-semibold">{comment.user}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </Card>
                ))}
                <div className="flex items-center space-x-2 mt-4">
                  <textarea className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Add a comment..." />
                  <Button><MessageSquare className="mr-2 h-4 w-4" /> Comment</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="files">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No files uploaded yet.</p>
                <Button><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}