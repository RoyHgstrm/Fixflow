import { auth } from "@/server/auth";
import DashboardClientLayout from "./DashboardClientLayout";
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardClientLayout session={session}>
      {children}
    </DashboardClientLayout>
  );
}
