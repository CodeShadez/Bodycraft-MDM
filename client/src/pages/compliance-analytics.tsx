import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChartIcon,
  Activity,
  Brain,
  Zap,
  Play,
  Shield,
  AlertTriangle,
  TrendingDown as TrendingDownIcon,
  Sparkles,
  HardDrive,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  overdue: "#ef4444",
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#84cc16",
};

interface UpcomingTask {
  taskName: string;
  taskType: string;
  priority: string;
  dueDate: string;
}

interface AnalyticsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    complianceRate: number;
  };
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  upcomingTasks: UpcomingTask[];
  trends: { date: string; completed: number }[];
}

interface AutomationSummary {
  totalRuns: number;
  tasksGenerated: number;
  signalsRaised: number;
  recommendationsGenerated: number;
  period: string;
}

interface RiskInsight {
  locationId: number;
  locationName: string;
  riskCount: number;
  averageRiskScore: number;
  criticalRisks: number;
}

interface PredictiveAlert {
  id: number;
  alertType: string;
  assetId: string;
  prediction: string;
  confidence: number;
  severity: string;
  createdAt: string;
}

interface AIRecommendation {
  id: number;
  targetType: string;
  targetId: string;
  recommendation: string;
  reasoning: string;
  confidenceScore: number;
  impactScore: number;
  status: string;
  createdAt: string;
}

interface BackupVerification {
  id: number;
  assetId: string;
  verificationDate: string;
  status: string;
  details: string;
  lastBackupDate: string | null;
}

interface BackupHealth {
  totalAssets: number;
  passed: number;
  failed: number;
  warning: number;
  healthScore: number;
}

export default function ComplianceAnalyticsPage() {
  const { toast } = useToast();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/compliance/analytics"],
  });

  const { data: automationSummary } = useQuery<AutomationSummary>({
    queryKey: ["/api/compliance/automation/summary"],
  });

  const { data: riskInsights } = useQuery<RiskInsight[]>({
    queryKey: ["/api/compliance/risk-insights"],
  });

  const { data: predictiveAlerts } = useQuery<PredictiveAlert[]>({
    queryKey: ["/api/compliance/predictive-alerts"],
  });

  const { data: aiRecommendations } = useQuery<AIRecommendation[]>({
    queryKey: ["/api/ai/recommendations"],
  });

  const { data: backupVerifications } = useQuery<BackupVerification[]>({
    queryKey: ["/api/backups/verification"],
  });

  const { data: backupHealth } = useQuery<BackupHealth>({
    queryKey: ["/api/backups/health"],
  });

  const triggerAutomation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/compliance/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to trigger automation");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "AI Automation triggered successfully" });
      queryClient.invalidateQueries({
        queryKey: ["/api/compliance/automation/summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/compliance/risk-insights"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/compliance/predictive-alerts"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/backups/verification"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/compliance/analytics"],
      });
    },
    onError: () => {
      toast({ title: "Failed to trigger automation", variant: "destructive" });
    },
  });

  const triggerBackupVerification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backups/verification/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok)
        throw new Error("Failed to trigger backup verification");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Backup verification triggered successfully" });
      queryClient.invalidateQueries({
        queryKey: ["/api/backups/verification"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/tasks"] });
    },
    onError: () => {
      toast({
        title: "Failed to trigger backup verification",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const {
    summary,
    statusDistribution,
    priorityDistribution,
    typeDistribution,
    upcomingTasks,
    trends,
  } = analytics;

  // Prepare chart data
  const statusData = Object.entries(statusDistribution).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }),
  );

  const priorityData = Object.entries(priorityDistribution).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }),
  );

  const typeData = Object.entries(typeDistribution).map(([name, value]) => ({
    name: name
      .replace("_", " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    tasks: value,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Compliance Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and AI-powered automation
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Brain className="h-4 w-4 mr-2" />
            AI Automation
          </TabsTrigger>
          <TabsTrigger value="backups" data-testid="tab-backups">
            <HardDrive className="h-4 w-4 mr-2" />
            Backup Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card data-testid="card-total-tasks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  All compliance tasks
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-completed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.completedTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully done
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.pendingTasks}
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card data-testid="card-overdue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {summary.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card data-testid="card-compliance-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compliance Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {summary.complianceRate}%
                </div>
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
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              entry.name.toLowerCase() as keyof typeof COLORS
                            ]
                          }
                        />
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
            <Card
              data-testid="card-type-distribution"
              className="md:col-span-2"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Task Type Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown by compliance task type
                </CardDescription>
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
            <Card
              data-testid="card-compliance-trends"
              className="md:col-span-2"
            >
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
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
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
                          {task.taskType
                            .replace("_", " ")
                            .split(" ")
                            .map(
                              (w: string) =>
                                w.charAt(0).toUpperCase() + w.slice(1),
                            )
                            .join(" ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            task.priority === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming deadlines in the next 7 days
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              AI-powered automation for predictive compliance management
            </p>
            <Button
              onClick={() => triggerAutomation.mutate()}
              disabled={triggerAutomation.isPending}
              data-testid="button-trigger-automation"
              className="gap-2"
            >
              {triggerAutomation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Trigger AI Automation
                </>
              )}
            </Button>
          </div>

          {/* Automation Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-automation-runs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Runs
                </CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automationSummary?.totalRuns || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card data-testid="card-auto-generated-tasks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Auto-Generated Tasks
                </CardTitle>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automationSummary?.tasksGenerated || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI-created compliance tasks
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-risk-signals">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Risk Signals
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automationSummary?.signalsRaised || 0}
                </div>
                <p className="text-xs text-muted-foreground">Detected issues</p>
              </CardContent>
            </Card>

            <Card data-testid="card-ai-recommendations">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  AI Recommendations
                </CardTitle>
                <Brain className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aiRecommendations?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active suggestions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Insights by Location */}
          {riskInsights && riskInsights.length > 0 && (
            <Card data-testid="card-risk-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Insights by Location
                </CardTitle>
                <CardDescription>
                  AI-identified compliance risks across outlets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      data-testid={`risk-insight-${index}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{insight.locationName}</p>
                        <p className="text-sm text-muted-foreground">
                          {insight.riskCount} risk factors identified
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            insight.averageRiskScore >= 80
                              ? "destructive"
                              : insight.averageRiskScore >= 50
                                ? "default"
                                : "secondary"
                          }
                        >
                          Risk Score: {insight.averageRiskScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predictive Alerts Timeline */}
          {predictiveAlerts && predictiveAlerts.length > 0 && (
            <Card data-testid="card-predictive-alerts-timeline">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDownIcon className="h-5 w-5" />
                  Predictive Alerts Timeline
                </CardTitle>
                <CardDescription>
                  Chronological view of AI-predicted compliance issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {predictiveAlerts.slice(0, 8).map((alert, index) => (
                      <div
                        key={index}
                        className="relative pl-14"
                        data-testid={`predictive-alert-timeline-${index}`}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-3 top-3 w-5 h-5 rounded-full border-4 ${
                            alert.severity === "high"
                              ? "bg-red-500 border-red-200"
                              : alert.severity === "medium"
                                ? "bg-amber-500 border-amber-200"
                                : "bg-blue-500 border-blue-200"
                          }`}
                        />

                        {/* Timeline content */}
                        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{alert.alertType}</p>
                              <Badge
                                variant={
                                  alert.severity === "high"
                                    ? "destructive"
                                    : alert.severity === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Asset: {alert.assetId}
                            </p>
                            <p className="text-sm mt-2">{alert.prediction}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Confidence: {alert.confidence}%
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alert.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations Drawer */}
          {aiRecommendations && aiRecommendations.length > 0 && (
            <Card data-testid="card-ai-recommendations-drawer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Intelligent suggestions for compliance improvement
                    </CardDescription>
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2"
                        data-testid="button-open-recommendations"
                      >
                        <Brain className="h-4 w-4" />
                        View All ({aiRecommendations.length})
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          AI Recommendations
                        </SheetTitle>
                        <SheetDescription>
                          Detailed AI-generated recommendations for compliance
                          optimization
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        {aiRecommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg border bg-card space-y-3"
                            data-testid={`drawer-recommendation-${index}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {rec.recommendation}
                                  </h4>
                                  <Badge
                                    variant={
                                      rec.status === "applied"
                                        ? "default"
                                        : rec.status === "pending"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {rec.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>
                                    <span className="font-medium">Target:</span>{" "}
                                    {rec.targetType} - {rec.targetId}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Reasoning:
                                    </span>{" "}
                                    {rec.reasoning}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 pt-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="text-muted-foreground">
                                        Confidence:
                                      </span>
                                      <span className="font-medium">
                                        {rec.confidenceScore}%
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-4 w-4 text-blue-500" />
                                      <span className="text-muted-foreground">
                                        Impact:
                                      </span>
                                      <span className="font-medium">
                                        {rec.impactScore}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                    <Clock className="h-3 w-3" />
                                    {new Date(rec.createdAt).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                      },
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {rec.status === "pending" && (
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="flex-1"
                                  data-testid={`apply-recommendation-${index}`}
                                >
                                  Apply Recommendation
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  data-testid={`dismiss-recommendation-${index}`}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      data-testid={`ai-recommendation-preview-${index}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {rec.recommendation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.targetType}: {rec.targetId}
                        </p>
                      </div>
                      <Badge
                        variant={
                          rec.status === "applied" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {rec.status}
                      </Badge>
                    </div>
                  ))}
                  {aiRecommendations.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      +{aiRecommendations.length - 3} more recommendations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Automated backup verification for all assets with compliance task
              creation
            </p>
            <Button
              onClick={() => triggerBackupVerification.mutate()}
              disabled={triggerBackupVerification.isPending}
              data-testid="button-trigger-backup-verification"
              className="gap-2"
            >
              {triggerBackupVerification.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Trigger Verification
                </>
              )}
            </Button>
          </div>

          {/* Backup Health Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-total-assets">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assets
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupHealth?.totalAssets || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  With backup requirements
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-backup-passed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Passed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {backupHealth?.passed || 0}
                </div>
                <p className="text-xs text-muted-foreground">Healthy backups</p>
              </CardContent>
            </Card>

            <Card data-testid="card-backup-failed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {backupHealth?.failed || 0}
                </div>
                <p className="text-xs text-muted-foreground">Critical issues</p>
              </CardContent>
            </Card>

            <Card data-testid="card-backup-warning">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warning</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {backupHealth?.warning || 0}
                </div>
                <p className="text-xs text-muted-foreground">Missing backups</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification History */}
          {backupVerifications && backupVerifications.length > 0 && (
            <Card data-testid="card-verification-history">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Verification History
                </CardTitle>
                <CardDescription>
                  Latest automated backup checks and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupVerifications
                    .slice(0, 10)
                    .map((verification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        data-testid={`verification-${index}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            Asset: {verification.assetId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {verification.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last Backup:{" "}
                            {verification.lastBackupDate
                              ? new Date(
                                  verification.lastBackupDate,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              verification.status === "passed"
                                ? "default"
                                : verification.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {verification.status === "passed" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : verification.status === "failed" ? (
                              <XCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {verification.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              verification.verificationDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!backupVerifications || backupVerifications.length === 0) && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No backup verifications found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Trigger Verification" to start automated backup
                    checks
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
