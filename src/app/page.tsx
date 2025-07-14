import { auth } from "~/server/auth";
import HomePageClient from "./_components/HomePageClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

    return <HomePageClient />;

}

