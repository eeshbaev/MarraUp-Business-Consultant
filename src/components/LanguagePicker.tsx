import { setLanguageAction } from "@/app/actions";
import type { Language } from "@/lib/types";
import { t } from "@/lib/ui-copy";

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "uz", label: "Uzbek", native: "Oʻzbekcha" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "fr", label: "French", native: "Français" },
];

export default function LanguagePicker({ current }: { current: Language }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-sm font-medium text-neutral-900">{t("common.language", current)}</div>
      <p className="mt-1 text-sm text-neutral-500">{t("languagePicker.body", current)}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <form key={l.code} action={setLanguageAction}>
            <input type="hidden" name="language" value={l.code} />
            <input type="hidden" name="return_to" value="/profile/settings" />
            <button
              type="submit"
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                current === l.code
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <div className="font-medium">{l.native}</div>
              <div className={`text-xs ${current === l.code ? "text-neutral-300" : "text-neutral-400"}`}>{l.label}</div>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
