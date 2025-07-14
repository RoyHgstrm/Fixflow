import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import DashboardClientPage from "./DashboardClientPage";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <DashboardClientPage session={session} />;
}
