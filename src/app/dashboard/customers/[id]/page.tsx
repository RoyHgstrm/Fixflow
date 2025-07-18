import { CustomerDetailClient } from "./CustomerDetailClient";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { NextPageProps } from "@/lib/types";

export async function generateMetadata({ params }: NextPageProps<{ id: string }>): Promise<Metadata> {
  return {
    title: `Customer #${params.id} | FixFlow`,
    description: `Details for customer #${params.id}`,
  };
}

export default async function CustomerDetailPage({ 
  params 
}: NextPageProps<{ id: string }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <CustomerDetailClient customerId={params.id} session={session} />;
} 