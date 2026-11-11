import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "The Steward’s Hall · The Fellowship",
  robots: { index: false, follow: false },
};

export default async function PrivateStewardsHallEntry() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=%2Fthe-stewards-hall");
  }

  const { data: isActive, error: activeError } = await supabase.rpc("is_platform_user_active");
  if (activeError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_platform_admin");
  if (adminError || !isAdmin) {
    redirect("/workspaces");
  }

  redirect("/admin");
}
