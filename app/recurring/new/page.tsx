import { RecurringTaskForm } from "@/components/recurring/recurring-task-form";
import { getTags } from "@/app/actions/tags";

export default async function NewRecurringTaskPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Recurring Task</h1>
      <RecurringTaskForm tags={tags} />
    </div>
  );
}
