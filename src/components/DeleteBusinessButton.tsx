"use client";

import { deleteBusinessAction } from "@/app/actions";
import type { Language } from "@/lib/types";
import { t, tf } from "@/lib/ui-copy";

export default function DeleteBusinessButton({
  businessId,
  businessName,
  language,
}: {
  businessId: string;
  businessName: string;
  language: Language;
}) {
  return (
    <form
      action={deleteBusinessAction}
      onSubmit={(e) => {
        if (!confirm(tf("deleteConfirm.confirm", language, { name: businessName }))) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="business_id" value={businessId} />
      <button type="submit" className="text-xs font-medium text-red-700 hover:text-red-900">
        {t("common.delete", language)}
      </button>
    </form>
  );
}
