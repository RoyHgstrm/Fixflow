import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import DashboardClientPage from "./DashboardClientPage";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/login");
  }

  return <DashboardClientPage session={session} />;
}
