import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { TaskList } from "@/components/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { tasksApi } from "@/lib/api";
import { toast } from "sonner";

export default function MyTasks() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!user?.id) {
        console.log("No user ID found, user:", user);
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching tasks for user:", user.id);
        const tasks = await tasksApi.getAll({ assignedTo: user.id });
        console.log("Fetched tasks:", tasks);
        setMyTasks(tasks);
      } catch (error) {
        toast.error("Failed to load your tasks");
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user?.id]);

  const todoTasks = myTasks.filter(t => t.status === "todo");
  const inProgressTasks = myTasks.filter(t => t.status === "in-progress");
  const reviewTasks = myTasks.filter(t => t.status === "review");
  const doneTasks = myTasks.filter(t => t.status === "done");
  const overdueTasks = myTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== "done");

  const totalEstimated = myTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalActual = myTasks.reduce((sum, t) => sum + t.actualHours, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-1">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-1">All tasks assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActual}h</div>
            <p className="text-xs text-muted-foreground mt-1">of {totalEstimated}h estimated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Organized by status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({myTasks.length})</TabsTrigger>
              <TabsTrigger value="todo">To Do ({todoTasks.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="review">Review ({reviewTasks.length})</TabsTrigger>
              <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <TaskList tasks={myTasks} />
            </TabsContent>
            <TabsContent value="todo" className="mt-4">
              <TaskList tasks={todoTasks} />
            </TabsContent>
            <TabsContent value="in-progress" className="mt-4">
              <TaskList tasks={inProgressTasks} />
            </TabsContent>
            <TabsContent value="review" className="mt-4">
              <TaskList tasks={reviewTasks} />
            </TabsContent>
            <TabsContent value="done" className="mt-4">
              <TaskList tasks={doneTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
