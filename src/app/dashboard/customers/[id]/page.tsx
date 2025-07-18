import { CustomerDetailClient } from "./CustomerDetailClient";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Customer #${resolvedParams.id} | FixFlow`,
    description: `Details for customer #${resolvedParams.id}`,
  };
}

export default async function CustomerDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.user) {
    redirect("/login");
  }

  return <CustomerDetailClient customerId={resolvedParams.id} session={session} />;
} 