// Server-side language resolution — reads the "marraup_lang" cookie set from
// Settings, defaulting to English. Client components that need the current
// language receive it as a prop from their server parent (see LanguagePicker).

import { cookies } from "next/headers";
import type { Language } from "./types";

const VALID: Language[] = ["en", "uz", "ru", "zh", "fr"];
const COOKIE_NAME = "marraup_lang";

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  return VALID.includes(raw as Language) ? (raw as Language) : "en";
}

export { COOKIE_NAME as LANGUAGE_COOKIE };
