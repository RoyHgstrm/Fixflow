import { CustomerDetailClient } from "./CustomerDetailClient";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { type Metadata, type ResolvingMetadata } from 'next';
import { CustomSession } from '@/lib/types';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  return {
    title: `Customer ${id}`,
  };
}

export default async function CustomerDetailPage({
  params
}: PageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <CustomerDetailClient customerId={params.id} session={session as CustomSession} />
  );
}