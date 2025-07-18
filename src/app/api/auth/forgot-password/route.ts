import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/server/db'

// Schema for validation
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    })

    // Always return success for security (don't reveal if user exists)
    // But only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Hash the reset token before storing
      const hashedResetToken = await bcrypt.hash(resetToken, 12)

      // Store the reset token in the database
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedResetToken,
          resetTokenExpiry,
        },
      })

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

      // In a real application, you would send an email here
      // For now, we'll just log it to the console (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset link:', resetUrl)
        console.log('Reset token:', resetToken)
      }

      // TODO: Send actual email using your preferred email service
      // Example services: SendGrid, AWS SES, Nodemailer, Resend, etc.
      /*
      await sendEmail({
        to: email,
        subject: 'Reset Your FixFlow Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your FixFlow account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `,
      })
      */
    }

    // Always return success (security best practice)
    return NextResponse.json(
      { 
        message: 'If an account with that email exists, we have sent a password reset link.',
        success: true 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: error.errors[0]?.message || 'Invalid email address',
          success: false 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'An error occurred while processing your request. Please try again.',
        success: false 
      },
      { status: 500 }
    )
  }
} 