import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { TaskList } from "@/components/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { tasksApi } from "@/lib/api";
import { toast } from "sonner";

export default function MyTasks() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortingTasks, setSortingTasks] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

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
      setIsSorted(false);
    } catch (error) {
      toast.error("Failed to load your tasks");
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSort = async () => {
    if (!user?.id) return;

    setSortingTasks(true);
    try {
      const result = await tasksApi.smartSort(user.id);
      
      // Reorder tasks based on AI suggestion
      const sortedTasks = [...myTasks];
      const sortedTaskIds = result.sortedTaskIds;
      
      // Sort the tasks array according to the AI-provided order
      sortedTasks.sort((a, b) => {
        const indexA = sortedTaskIds.indexOf(a.id);
        const indexB = sortedTaskIds.indexOf(b.id);
        
        // Tasks not in sortedTaskIds (completed ones) go to the end
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });

      setMyTasks(sortedTasks);
      setIsSorted(true);
      
      toast.success("Tasks sorted successfully!", {
        description: result.reasoning,
      });
    } catch (error) {
      toast.error("Failed to sort tasks");
      console.error("Error sorting tasks:", error);
    } finally {
      setSortingTasks(false);
    }
  };

  useEffect(() => {
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Organized by status</CardDescription>
            </div>
            <Button 
              onClick={handleSmartSort} 
              disabled={sortingTasks || myTasks.filter(t => t.status !== 'done').length === 0}
              variant={isSorted ? "secondary" : "default"}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {sortingTasks ? "Sorting..." : isSorted ? "Re-sort Tasks" : "Smart Sort Tasks"}
            </Button>
          </div>
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
              <TaskList tasks={myTasks} onTaskUpdate={fetchMyTasks} />
            </TabsContent>
            <TabsContent value="todo" className="mt-4">
              <TaskList tasks={todoTasks} onTaskUpdate={fetchMyTasks} />
            </TabsContent>
            <TabsContent value="in-progress" className="mt-4">
              <TaskList tasks={inProgressTasks} onTaskUpdate={fetchMyTasks} />
            </TabsContent>
            <TabsContent value="review" className="mt-4">
              <TaskList tasks={reviewTasks} onTaskUpdate={fetchMyTasks} />
            </TabsContent>
            <TabsContent value="done" className="mt-4">
              <TaskList tasks={doneTasks} onTaskUpdate={fetchMyTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
