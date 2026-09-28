import DiscoverQuestionnaire from "@/components/DiscoverQuestionnaire";
import { getDiscoverAnswers } from "@/lib/db";
import { getLanguage } from "@/lib/language";

export const dynamic = "force-dynamic";

export default async function DiscoverStartPage() {
  const language = await getLanguage();
  const existing = getDiscoverAnswers();
  const initialAnswers = existing?.answers ?? {};
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <DiscoverQuestionnaire language={language} initialAnswers={initialAnswers} />
    </div>
  );
}
