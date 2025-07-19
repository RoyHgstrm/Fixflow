import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { db } from "@/server/db";
import { PlanType } from "@prisma/client";

const signupCompanySchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Password must contain at least one special character"
    ),
  phone: z.string().optional(),
  planType: z.nativeEnum(PlanType).default(PlanType.SOLO),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyName, 
      email, 
      password, 
      phone, 
      planType 
    } = signupCompanySchema.parse(body);

    // Verify Supabase URL and key are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration is missing" },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

    // First check if user exists in Supabase Auth
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      console.error('Error listing Supabase auth users:', listUsersError);
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 }
      );
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        plan_type: planType,
        role: 'OWNER'
      }
    });

    if (authError) {
      console.error('Supabase auth user creation error:', authError);
      return NextResponse.json(
        { error: "Failed to create user in authentication system" },
        { status: 500 }
      );
    }

    // Create company in database
    const company = await db.company.create({
      data: {
        name: companyName,
        email,
        phone,
        planType,
      }
    });

    // Create user in database
    const user = await db.user.create({
      data: {
        id: authData.user.id,
        email,
        name: companyName,
        role: 'OWNER',
        companyId: company.id,
      }
    });

    return NextResponse.json(
      { 
        message: "Company and user created successfully",
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        },
        company: { 
          id: company.id, 
          name: company.name, 
          planType: company.planType 
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup company error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 