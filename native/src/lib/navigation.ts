import { router, type Href } from "expo-router";

/** Pop the stack when possible; otherwise replace so back never loops. */
export function popOrReplace(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
