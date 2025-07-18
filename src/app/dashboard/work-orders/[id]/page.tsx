import { WorkOrderDetailClient } from "./WorkOrderDetailClient";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { NextPageProps } from "@/lib/types";

export async function generateMetadata({ params }: NextPageProps<{ id: string }>): Promise<Metadata> {
  return {
    title: `Work Order #${params.id} | FixFlow`,
    description: `Details for work order #${params.id}`,
  };
}

export default async function WorkOrderDetailPage({ 
  params 
}: NextPageProps<{ id: string }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <WorkOrderDetailClient params={params} session={session} />;
} 