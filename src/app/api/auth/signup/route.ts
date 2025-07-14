import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";

export async function POST(req: Request) {
  try {
    const { email, password, name } = (await req.json()) as { email: string; password: string; name: string };

    if (!email || !password || !name) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error during sign up:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}