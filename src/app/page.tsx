import { redirect } from "next/navigation";

// The app now lands on the Explore tab (bottom nav: Explore / Market /
// Profile) rather than a standalone landing page.
export default function RootRedirect() {
  redirect("/explore");
}
