import ProfileIdentityForm from "@/components/ProfileIdentityForm";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

// First-launch step, kept deliberately small (per the "keep onboarding
// simple" decision): name + country + optional photo, nothing else. It does
// not lead into My Path or the Business Assessment questionnaire — those
// stay entirely opt-in from Profile, reached only when the user decides to
// use them.
export default async function OnboardingPage() {
  const language = await getLanguage();
  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{t("onboarding.title", language)}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{t("onboarding.subtitle", language)}</p>

      <div className="mt-8">
        <ProfileIdentityForm language={language} returnTo="/explore" />
      </div>
    </div>
  );
}
