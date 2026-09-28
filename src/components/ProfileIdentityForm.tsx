"use client";

// Shared form for both first-launch onboarding and later "edit identity"
// from Profile. Photo handling happens entirely client-side: the file is
// drawn onto a canvas, downscaled to a small square, and re-encoded as a
// JPEG data URL before it ever touches a hidden form field — the server
// action just stores whatever string it's given (see saveProfileAction in
// app/actions.ts), it never processes image bytes itself. This keeps
// storage small (a few hundred KB at most) since it all lives as a single
// TEXT column in the local SQLite file.

import { useRef, useState } from "react";
import { saveProfileAction } from "@/app/actions";
import type { Language } from "@/lib/types";
import { COUNTRIES, type CountryCode } from "@/lib/market-copy";
import { t } from "@/lib/ui-copy";

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;

function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Could not decode image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileIdentityForm({
  language,
  initial,
  returnTo,
}: {
  language: Language;
  initial?: { display_name: string; country: string; photo_data_url: string | null };
  returnTo: string;
}) {
  const [photo, setPhoto] = useState<string | null>(initial?.photo_data_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const dataUrl = await downscaleImage(file);
      setPhoto(dataUrl);
    } catch {
      setError("Could not process that photo — try a different file.");
    }
  }

  return (
    <form action={saveProfileAction} className="space-y-6">
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="photo_data_url" value={photo ?? ""} />

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {t("onboarding.photoLabel", language)}
        </label>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-neutral-300">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-400"
            >
              {t("onboarding.choosePhoto", language)}
            </button>
            {photo && (
              <button type="button" onClick={() => setPhoto(null)} className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
                {t("onboarding.removePhoto", language)}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
        <p className="mt-1 text-xs text-neutral-400">{t("onboarding.photoHint", language)}</p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {t("onboarding.nameLabel", language)}
        </label>
        <input
          name="display_name"
          required
          defaultValue={initial?.display_name ?? ""}
          placeholder={t("onboarding.namePlaceholder", language)}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {t("onboarding.countryLabel", language)}
        </label>
        <select
          name="country"
          required
          defaultValue={initial?.country ?? ""}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            {t("onboarding.selectCountry", language)}
          </option>
          {COUNTRIES.map((c: { code: CountryCode; label: Record<Language, string> }) => (
            <option key={c.code} value={c.code}>
              {c.label[language] || c.label.en}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-400">{t("onboarding.countryHint", language)}</p>
      </div>

      <button type="submit" className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
        {t("onboarding.continue", language)}
      </button>
    </form>
  );
}
