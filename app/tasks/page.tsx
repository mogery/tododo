import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/todos/task-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTodos } from "@/app/actions/todos";
import type { TaskItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const todos = await getTodos();

  const activeTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);

  const activeItems: TaskItem[] = activeTodos.map((todo) => ({
    type: "todo",
    task: todo,
  }));

  const completedItems: TaskItem[] = completedTodos.map((todo) => ({
    type: "todo",
    task: todo,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 size-4" weight="bold" />
            Add task
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeTodos.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTodos.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <TaskList items={activeItems} emptyMessage="No active tasks" />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <TaskList items={completedItems} emptyMessage="No completed tasks" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
