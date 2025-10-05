import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts"
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, 
  BarChart3, PieChart as PieChartIcon, Activity
} from "lucide-react"

const COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#84cc16',
}

interface AnalyticsData {
  summary: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    complianceRate: number
  }
  statusDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  typeDistribution: Record<string, number>
  upcomingTasks: any[]
  trends: { date: string; completed: number }[]
}

export default function ComplianceAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/compliance/analytics"],
  })

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const { summary, statusDistribution, priorityDistribution, typeDistribution, upcomingTasks, trends } = analytics

  // Prepare chart data
  const statusData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const priorityData = Object.entries(priorityDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const typeData = Object.entries(typeDistribution).map(([name, value]) => ({
    name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    tasks: value,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and trends for compliance management
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="card-total-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All compliance tasks</p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successfully done</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card data-testid="card-overdue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-compliance-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.complianceRate >= 80 ? (
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" /> Excellent
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-3 w-3" /> Needs improvement
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card data-testid="card-status-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>Task breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card data-testid="card-priority-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Type Distribution */}
        <Card data-testid="card-type-distribution" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Task Type Distribution
            </CardTitle>
            <CardDescription>Breakdown by compliance task type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Trends */}
        <Card data-testid="card-compliance-trends" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Compliance Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>Task completion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card data-testid="card-upcoming-tasks">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Deadlines (Next 7 Days)
          </CardTitle>
          <CardDescription>Tasks requiring attention soon</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  data-testid={`upcoming-task-${index}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{task.taskName}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.taskType.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No upcoming deadlines in the next 7 days</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
