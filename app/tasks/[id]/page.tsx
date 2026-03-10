import { notFound } from "next/navigation";
import { TaskForm } from "@/components/todos/task-form";
import { getTodo } from "@/app/actions/todos";
import { getTags } from "@/app/actions/tags";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const [todo, tags] = await Promise.all([getTodo(id), getTags()]);

  if (!todo) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Task</h1>
      <TaskForm tags={tags} todo={todo} />
    </div>
  );
}
