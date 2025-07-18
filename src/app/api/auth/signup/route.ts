import { NextResponse } from 'next/server';

import { db } from '@/server/db';
import { supabase } from '@/lib/supabase';

type SignupRequestBody = {
  email: string;
  password: string;
  name: string;
};

export async function POST(req: Request) {
  try {
    const { email, password, name }: SignupRequestBody = await req.json();

    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User not created in Supabase Auth' }, { status: 500 });
    }

    // 2. Create user in Prisma DB using the ID from Supabase Auth
    const user = await db.user.create({
      data: {
        id: authData.user.id, // Use the ID from Supabase Auth
        email,
        name,
        // Do not store password here, Supabase handles it
      },
    });

    return NextResponse.json({ 
      message: 'User registered successfully', 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Signup Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error 
        ? error.message 
        : 'Something went wrong' 
    }, { status: 500 });
  }
}