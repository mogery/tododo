import { TaskForm } from "@/components/todos/task-form";
import { getTags } from "@/app/actions/tags";

export default async function NewTaskPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Task</h1>
      <TaskForm tags={tags} />
    </div>
  );
}
