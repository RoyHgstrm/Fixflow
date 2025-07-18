import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from "@/server/db";
import { supabaseAdmin } from "@/lib/supabase";

// Schema for validation
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const { token, email, password } = resetPasswordSchema.parse(body)

    // Find user with the provided email
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { 
          message: 'Invalid or expired reset token. Please request a new password reset.',
          success: false 
        },
        { status: 400 }
      )
    }

    // Check if reset token has expired
    if (new Date() > user.resetTokenExpiry) {
      // Clean up expired token
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      return NextResponse.json(
        { 
          message: 'Reset token has expired. Please request a new password reset.',
          success: false 
        },
        { status: 400 }
      )
    }

    // Verify the reset token
    const isValidToken = await bcrypt.compare(token, user.resetToken)
    
    if (!isValidToken) {
      return NextResponse.json(
        { 
          message: 'Invalid reset token. Please request a new password reset.',
          success: false 
        },
        { status: 400 }
      )
    }

    // Hash the new password (Supabase handles hashing internally when updating password)
    // const hashedPassword = await bcrypt.hash(password, 12)

    // Update password in Supabase Auth
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (authUpdateError) {
      console.error('Supabase password update error:', authUpdateError);
      return NextResponse.json(
        {
          message: authUpdateError.message || 'Failed to update password in authentication system.',
          success: false
        },
        { status: 500 }
      );
    }

    // Clear reset token and expiry in our database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
        emailVerified: user.emailVerified || new Date(),
      },
    });

    return NextResponse.json(
      { 
        message: 'Password has been successfully reset. You can now sign in with your new password.',
        success: true 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: error.errors[0]?.message || 'Invalid input data',
          success: false 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'An error occurred while resetting your password. Please try again.',
        success: false 
      },
      { status: 500 }
    )
  }
} 