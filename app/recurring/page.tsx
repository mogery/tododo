import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { RecurringTaskList } from "@/components/recurring/recurring-task-list";
import { getRecurringTasks } from "@/app/actions/recurring";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const tasks = await getRecurringTasks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring Tasks</h1>
        <Button asChild>
          <Link href="/recurring/new">
            <Plus className="mr-2 size-4" weight="bold" />
            Add recurring task
          </Link>
        </Button>
      </div>

      <RecurringTaskList tasks={tasks} />
    </div>
  );
}
