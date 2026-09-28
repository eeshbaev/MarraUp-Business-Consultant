import TabHeader from "@/components/TabHeader";
import MarketBody from "@/components/MarketBody";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

// Server component wrapper: TabHeader renders the notification bell, which
// reads real data via server-only db.ts (node:sqlite) — that can't be
// bundled into a client component, so the interactive horizon-filter part
// lives in the client child MarketBody instead.
export default async function MarketPage() {
  const language = await getLanguage();
  return (
    <div>
      <TabHeader title={t("header.market.title", language)} subtitle={t("header.market.subtitle", language)} language={language} />
      <MarketBody language={language} />
    </div>
  );
}
