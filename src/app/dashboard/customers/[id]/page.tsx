'use client';

import { useSession } from "@/lib/providers/session-provider";
import { CustomerDetailClient } from "./CustomerDetailClient";
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CustomerDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { session } = useSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }}
    >
      <CustomerDetailClient customerId={params.id} session={session} />
    </motion.div>
  );
}