import { NextResponse } from "next/server";
import { supabaseAdmin, applyMigration } from "@/lib/supabase";
import type { PlanType} from "@/lib/types";
import { SubscriptionStatus, UserRole } from "@/lib/types";
import { db } from "@/server/db";
import cuid from 'cuid';


export async function POST(req: Request) {
  try {
    console.log('Starting signup process...');
    
    // Apply migration to make password field optional
    try {
      await applyMigration();
    } catch (error) {
      console.log('Migration already applied or failed:', error);
      // Continue with signup process even if migration fails
      // as it might already be applied
    }

    const { 
      name, 
      email, 
      password, 
      companyName,
      companyEmail,
      companyPhone,
      planType 
    } = (await req.json()) as { 
      name: string;
      email: string; 
      password: string;
      companyName: string;
      companyEmail?: string;
      companyPhone?: string;
      planType: PlanType;
    };

    console.log('Received signup data for:', email);

    // Validate required fields
    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('Checking for existing user in Supabase Auth...');
    
    // First check if user exists in Supabase Auth
    const { data: existingAuthUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error('Error listing Supabase auth users:', listUsersError);
      return NextResponse.json(
        { message: "Error checking existing auth user", error: listUsersError.message },
        { status: 500 }
      );
    }

    const authUserExists = existingAuthUsers.users.some(user => user.email === email);
    
    if (authUserExists) {
      return NextResponse.json(
        { message: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    // Check for existing company
    console.log('Checking for existing company...');
    const { data: existingCompany, error: checkCompanyError } = await supabaseAdmin
      .schema('public')
      .from('Company') // Changed from 'companies' to 'Company'
      .select('id')
      .or(`name.eq.${companyName},email.eq.${companyEmail}`) // Ensure companyEmail is used here
      .maybeSingle();

    if (checkCompanyError) {
      console.error('Error checking existing company:', checkCompanyError);
      return NextResponse.json(
        { message: "Error checking existing company", error: checkCompanyError.message },
        { status: 500 }
      );
    }

    if (existingCompany) {
      return NextResponse.json(
        { message: "A company with this name or email already exists" },
        { status: 409 }
      );
    }

    // Create auth user
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: UserRole.OWNER,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { 
          message: "Error creating auth user",
          error: authError.message
        },
        { status: 500 }
      );
    }

    // Create company
    console.log('Creating company...');
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 14); // Set to 14 days from start

    const companyData = {
      id: cuid(), // Generate unique ID
      name: companyName,
      email: companyEmail,
      phone: companyPhone,
      planType: planType, // Changed from plan_type to planType
      subscriptionStatus: SubscriptionStatus.TRIAL, // Changed from subscription_status to subscriptionStatus
      trialStartDate: trialStartDate.toISOString(), // Changed from trial_start_date to trialStartDate
      trialEndDate: trialEndDate.toISOString(), // Changed from trial_end_date to trialEndDate
      updatedAt: new Date().toISOString(), // Add this line
    };

    console.log('Company data to insert:', JSON.stringify(companyData)); // Log the data being inserted

    const { data: company, error: companyError } = await supabaseAdmin
      .schema('public')
      .from('Company') // Changed from 'companies' to 'Company'
      .insert([companyData])
      .select()
      .single();

    if (companyError) {
      console.error("Error creating company:", JSON.stringify(companyError, null, 2));
      return new Response(
        JSON.stringify({
          message: "Error creating company",
          error: companyError.message || JSON.stringify(companyError),
          details: companyError.details || null,
          hint: companyError.hint || null,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create user in our public.User table
    console.log('Creating public.User entry...');
    try {
      const publicUser = await db.user.create({
        data: {
          id: authUser.user.id,
          email: authUser.user.email!,
          name: name,
          role: UserRole.OWNER,
          companyId: company.id,
        },
      });
      console.log('Public user created:', publicUser.id);
    } catch (publicUserError) {
      console.error('Error creating public user entry:', publicUserError);
      // Rollback auth user and company creation if public user creation fails critically
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.schema('public').from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({
          message: "Error creating user profile",
          error: publicUserError instanceof Error ? publicUserError.message : String(publicUserError),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update auth user with company ID and other metadata
    await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
      user_metadata: {
        ...authUser.user.user_metadata,
        company_id: company.id,
        // Add other user profile data here if needed, directly to user_metadata
        // e.g., phone: companyPhone, jobTitle: 'Owner' 
      }
    });

    console.log('Signup successful!');
    return NextResponse.json(
      { message: "Signup successful!" },
      { status: 200 }
    );
  } catch (error) {
    console.error('An unexpected error occurred during signup:', error);
    return NextResponse.json(
      { message: "An unexpected error occurred", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 