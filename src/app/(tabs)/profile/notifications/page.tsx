import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const language = await getLanguage();
  const notifications = getNotifications(language);

  return (
    <div>
      <Link href="/profile" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {t("common.backToProfile", language)}
      </Link>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-neutral-900">{t("notifications.title", language)}</h1>
      <p className="mb-6 text-sm text-neutral-500">{t("notifications.subtitle", language)}</p>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          {t("notifications.empty", language)}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className="block px-4 py-3 text-sm text-neutral-800 hover:bg-neutral-50">
                {n.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
