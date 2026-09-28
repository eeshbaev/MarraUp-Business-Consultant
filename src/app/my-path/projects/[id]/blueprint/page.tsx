import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/db";
import { writeBlueprintAction, proceedToDevelopAction } from "@/app/journey-actions";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const FIELDS: { key: string; labelKey: string; rows?: number }[] = [
  { key: "name", labelKey: "blueprint.field.name" },
  { key: "bp_problem", labelKey: "blueprint.field.problem" },
  { key: "bp_customer", labelKey: "blueprint.field.customer" },
  { key: "bp_offering", labelKey: "blueprint.field.offering" },
  { key: "bp_revenue_model", labelKey: "blueprint.field.revenueModel" },
  { key: "bp_pricing", labelKey: "blueprint.field.pricing" },
  { key: "bp_advantage", labelKey: "blueprint.field.advantage" },
  { key: "bp_location_scope", labelKey: "blueprint.field.locationScope" },
  { key: "bp_required_resources", labelKey: "blueprint.field.requiredResources", rows: 3 },
  { key: "bp_launch_ready_condition", labelKey: "blueprint.field.launchReadyCondition", rows: 2 },
];

export default async function BlueprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language: Language = await getLanguage();

  return (
    <div>
      <Link href={`/my-path/projects/${id}/find`} className="mb-3 inline-block text-xs text-neutral-500">
        {t("blueprint.backToFind", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{t("blueprint.title", language)}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("blueprint.subtitle", language)}</p>

      <form action={writeBlueprintAction} className="mt-4 space-y-3">
        <input type="hidden" name="project_id" value={id} />
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t(f.labelKey, language)}</label>
            {f.rows ? (
              <textarea name={f.key} rows={f.rows} defaultValue={(project as unknown as Record<string, string>)[f.key] ?? ""} className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
            ) : (
              <input name={f.key} defaultValue={(project as unknown as Record<string, string>)[f.key] ?? ""} className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
            )}
          </div>
        ))}
        <button type="submit" className="w-full rounded-md border border-neutral-300 py-2 text-xs font-semibold text-neutral-700">
          {t("journey.save", language)}
        </button>
      </form>

      <form action={proceedToDevelopAction} className="mt-3">
        <input type="hidden" name="project_id" value={id} />
        <button type="submit" className="w-full rounded-md bg-neutral-900 py-2.5 text-xs font-semibold text-white">
          {t("blueprint.proceedToDevelop", language)}
        </button>
      </form>
    </div>
  );
}
