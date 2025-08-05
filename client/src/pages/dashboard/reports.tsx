import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  Projector, 
  CheckSquare, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  teamMembers: number;
  completedProjects: number;
  pendingTasks: number;
  revenue: number;
  growth: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [filterType, setFilterType] = useState("all");

  // Mock data - replace with real API calls
  const stats: DashboardStats = {
    totalClients: 24,
    totalProjects: 45,
    totalTasks: 127,
    teamMembers: 6,
    completedProjects: 38,
    pendingTasks: 23,
    revenue: 124500,
    growth: 12.5
  };

  const clientsData = [
    { name: 'ינואר', clients: 4, projects: 8, revenue: 15000 },
    { name: 'פברואר', clients: 3, projects: 6, revenue: 12000 },
    { name: 'מרץ', clients: 6, projects: 12, revenue: 22000 },
    { name: 'אפריל', clients: 8, projects: 15, revenue: 28000 },
    { name: 'מאי', clients: 5, projects: 9, revenue: 18000 },
    { name: 'יוני', clients: 7, projects: 13, revenue: 25000 },
  ];

  const projectsStatusData = [
    { name: 'הושלמו', value: 38, color: '#10B981' },
    { name: 'בתהליך', value: 12, color: '#F59E0B' },
    { name: 'ממתינים', value: 8, color: '#6B7280' },
    { name: 'מושהים', value: 3, color: '#EF4444' },
  ];

  const tasksData = [
    { name: 'ממתינות', count: 23, percentage: 35 },
    { name: 'בתהליך', count: 45, percentage: 40 },
    { name: 'הושלמו', count: 59, percentage: 25 },
  ];

  const teamPerformanceData = [
    { name: 'אבי כהן', completed: 24, pending: 8, efficiency: 85 },
    { name: 'שרה לוי', completed: 19, pending: 5, efficiency: 92 },
    { name: 'יוסי ישראל', completed: 16, pending: 12, efficiency: 75 },
    { name: 'רחל דוד', completed: 21, pending: 6, efficiency: 88 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">דוחות ואנליטיקה</h1>
          <p className="text-muted-foreground">
            תובנות מפורטות על הביצועים העסקיים שלך
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ימים</SelectItem>
              <SelectItem value="30">30 ימים</SelectItem>
              <SelectItem value="90">3 חודשים</SelectItem>
              <SelectItem value="365">שנה</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="clients">לקוחות</SelectItem>
              <SelectItem value="projects">פרויקטים</SelectItem>
              <SelectItem value="tasks">משימות</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ לקוחות</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" />
              +{stats.growth}% מהחודש הקודם
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פרויקטים פעילים</CardTitle>
            <Projector className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedProjects} הושלמו השנה
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות פתוחות</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              מתוך {stats.totalTasks} סה"כ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" />
              +15% מהרבעון הקודם
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="clients">לקוחות</TabsTrigger>
          <TabsTrigger value="projects">פרויקטים</TabsTrigger>
          <TabsTrigger value="team">צוות</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>מגמות חודשיות</CardTitle>
                <CardDescription>לקוחות ופרויקטים חדשים</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clientsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clients" fill="#8884d8" name="לקוחות חדשים" />
                    <Bar dataKey="projects" fill="#82ca9d" name="פרויקטים חדשים" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>סטטוס פרויקטים</CardTitle>
                <CardDescription>התפלגות לפי מצב</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectsStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectsStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הכנסות מלקוחות</CardTitle>
              <CardDescription>מגמת הכנסות לפי חודש</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={clientsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₪${value.toLocaleString()}`, 'הכנסות']} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="space-y-4">
            {projectsStatusData.map((status) => (
              <Card key={status.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-reverse space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{status.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {status.value} פרויקטים
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((status.value / projectsStatusData.reduce((sum, item) => sum + item.value, 0)) * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ביצועי צוות</CardTitle>
              <CardDescription>משימות שהושלמו ויעילות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformanceData.map((member) => (
                  <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{member.name}</p>
                        <Badge variant={member.efficiency >= 85 ? "default" : "secondary"}>
                          {member.efficiency}% יעילות
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>הושלמו: {member.completed}</span>
                        <span>ממתינות: {member.pending}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}