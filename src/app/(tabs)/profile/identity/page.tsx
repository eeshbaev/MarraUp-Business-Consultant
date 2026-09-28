import Link from "next/link";
import ProfileIdentityForm from "@/components/ProfileIdentityForm";
import { getUserProfile } from "@/lib/db";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function EditIdentityPage() {
  const language = await getLanguage();
  const profile = getUserProfile();

  return (
    <div>
      <Link href="/profile" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {t("common.backToProfile", language)}
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-neutral-900">{t("profile.editIdentity", language)}</h1>

      <ProfileIdentityForm
        language={language}
        returnTo="/profile"
        initial={
          profile
            ? { display_name: profile.display_name, country: profile.country, photo_data_url: profile.photo_data_url }
            : undefined
        }
      />
    </div>
  );
}
