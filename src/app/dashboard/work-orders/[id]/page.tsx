import { WorkOrderDetailClient } from "./WorkOrderDetailClient";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Work Order #${resolvedParams.id} | FixFlow`,
    description: `Details for work order #${resolvedParams.id}`,
  };
}

export default async function WorkOrderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.user) {
    redirect("/login");
  }

  return <WorkOrderDetailClient params={resolvedParams} session={session} />;
} 