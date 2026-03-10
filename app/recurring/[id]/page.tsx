import { notFound } from "next/navigation";
import { RecurringTaskForm } from "@/components/recurring/recurring-task-form";
import { getRecurringTask } from "@/app/actions/recurring";
import { getTags } from "@/app/actions/tags";

interface EditRecurringTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecurringTaskPage({
  params,
}: EditRecurringTaskPageProps) {
  const { id } = await params;
  const [task, tags] = await Promise.all([getRecurringTask(id), getTags()]);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Recurring Task</h1>
      <RecurringTaskForm tags={tags} task={task} />
    </div>
  );
}
