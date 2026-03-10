import { TagManager } from "@/components/tags/tag-manager";
import { getTags } from "@/app/actions/tags";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tags</h1>
      <TagManager tags={tags} />
    </div>
  );
}
