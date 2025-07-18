import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock the Supabase createClient
const mockSignInWithPassword = jest.fn();
const mockSignInWithOAuth = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

// Mock the Prisma client
const mockPrismaUserUpsert = jest.fn();
const mockPrismaCompanyUpsert = jest.fn();

jest.mock('@/server/db', () => ({
  prisma: {
    user: {
      upsert: mockPrismaUserUpsert,
    },
    company: {
      upsert: mockPrismaCompanyUpsert,
    },
  },
}));

describe('Authentication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should validate hashed passwords correctly', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const plainPassword = 'password123';
      const hash1 = await bcrypt.hash(plainPassword, 12);
      const hash2 = await bcrypt.hash(plainPassword, 12);

      expect(hash1).not.toBe(hash2);

      // Both should still validate correctly
      expect(await bcrypt.compare(plainPassword, hash1)).toBe(true);
      expect(await bcrypt.compare(plainPassword, hash2)).toBe(true);
    });
  });

  describe('User Role Validation', () => {
    it('should validate user role enum values', () => {
      const validRoles = Object.values(UserRole);
      expect(validRoles).toContain(UserRole.OWNER);
      expect(validRoles).toContain(UserRole.MANAGER);
      expect(validRoles).toContain(UserRole.EMPLOYEE);
      expect(validRoles).toContain(UserRole.ADMIN);
      expect(validRoles).toContain(UserRole.TECHNICIAN);
      expect(validRoles).toContain(UserRole.CLIENT);
      expect(validRoles).toHaveLength(6);
    });

    it('should have correct default role assignment', () => {
      expect(UserRole.EMPLOYEE).toBe('EMPLOYEE'); // Default in config.ts is EMPLOYEE
    });
  });

  describe('Session Data Validation', () => {
    it('should validate session user structure', () => {
      const mockSessionUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      expect(mockSessionUser.id).toBeDefined();
      expect(typeof mockSessionUser.id).toBe('string');
      expect(mockSessionUser.email).toBeDefined();
      expect(typeof mockSessionUser.email).toBe('string');
      expect(mockSessionUser.role).toBeDefined();
      expect(Object.values(UserRole)).toContain(mockSessionUser.role);
    });

    it('should validate email format in session', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@fixflow.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  describe('Authorization Logic', () => {
    it('should validate admin permissions', () => {
      const adminUser = {
        id: 'admin-1',
        role: UserRole.ADMIN,
        email: 'admin@fixflow.com',
      };

      const canCreateCustomer = adminUser.role === UserRole.ADMIN;
      const canDeleteWorkOrder = adminUser.role === UserRole.ADMIN;
      const canViewAllInvoices = adminUser.role === UserRole.ADMIN;

      expect(canCreateCustomer).toBe(true);
      expect(canDeleteWorkOrder).toBe(true);
      expect(canViewAllInvoices).toBe(true);
    });

    it('should validate technician permissions', () => {
      const technicianUser = {
        id: 'tech-1',
        role: UserRole.TECHNICIAN,
        email: 'tech@fixflow.com',
      };

      const canUpdateWorkOrderStatus = technicianUser.role === UserRole.TECHNICIAN || technicianUser.role === UserRole.ADMIN;
      const canDeleteCustomer = technicianUser.role === UserRole.ADMIN;
      const canViewAssignedWorkOrders = technicianUser.role === UserRole.TECHNICIAN || technicianUser.role === UserRole.ADMIN;

      expect(canUpdateWorkOrderStatus).toBe(true);
      expect(canDeleteCustomer).toBe(false);
      expect(canViewAssignedWorkOrders).toBe(true);
    });

    it('should validate client permissions', () => {
      const clientUser = {
        id: 'client-1',
        role: UserRole.CLIENT,
        email: 'client@fixflow.com',
      };

      const canCreateWorkOrder = true; // Clients can create work orders for themselves
      const canDeleteWorkOrder = clientUser.role === UserRole.ADMIN;
      const canViewOtherCustomers = clientUser.role === UserRole.ADMIN || clientUser.role === UserRole.TECHNICIAN;

      expect(canCreateWorkOrder).toBe(true);
      expect(canDeleteWorkOrder).toBe(false);
      expect(canViewOtherCustomers).toBe(false);
    });
  });

  describe('User Data Validation', () => {
    it('should validate user creation data', () => {
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'securePassword123',
        role: UserRole.CLIENT,
        phone: '+1-555-0001',
        isActive: true,
      };

      expect(newUserData.name).toBeDefined();
      expect(newUserData.email).toBeDefined();
      expect(newUserData.password).toBeDefined();
      expect(newUserData.role).toBeDefined();

      expect(typeof newUserData.name).toBe('string');
      expect(typeof newUserData.email).toBe('string');
      expect(typeof newUserData.password).toBe('string');
      expect(typeof newUserData.isActive).toBe('boolean');

      expect(Object.values(UserRole)).toContain(newUserData.role);
    });

    it('should validate password strength requirements with full regex', () => {
      const isStrongPassword = (password: string): boolean => {
        const minLength = 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

        return (
          password.length >= minLength &&
          hasUppercase &&
          hasLowercase &&
          hasNumber &&
          hasSpecialChar
        );
      };

      expect(isStrongPassword('StrongPass123!')).toBe(true);
      expect(isStrongPassword('AnotherGood1@')).toBe(true);
      expect(isStrongPassword('ComplexPassword2024$')).toBe(true);

      expect(isStrongPassword('short1!')).toBe(false);
      expect(isStrongPassword('nouppercase1!')).toBe(false);
      expect(isStrongPassword('NOLOWERCASE1!')).toBe(false);
      expect(isStrongPassword('NoNumber!')).toBe(false);
      expect(isStrongPassword('NoSpecialChar1')).toBe(false);
      expect(isStrongPassword('weak')).toBe(false);
    });
  });
});

describe('Credentials Provider Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for invalid credentials (email not found)', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials', status: 400 },
    });

    const { authOptions } = await import('../config');
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
    const authorize = (credentialsProvider as any).authorize;

    const result = await authorize({ email: 'nonexistent@example.com', password: 'anypassword' });
    expect(result).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'nonexistent@example.com',
      password: 'anypassword',
    });
  });

  it('should return null for invalid credentials (wrong password)', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials', status: 400 },
    });

    const { authOptions } = await import('../config');
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
    const authorize = (credentialsProvider as any).authorize;

    const result = await authorize({ email: 'test@example.com', password: 'wrongpassword' });
    expect(result).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
  });

  it('should successfully authorize a user with valid credentials', async () => {
    const mockSupabaseUser = {
      id: 'auth-user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
      email_confirmed_at: new Date().toISOString(),
    };
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const mockPrismaUser = {
      id: 'auth-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.EMPLOYEE,
      companyId: null,
      jobTitle: null,
      image: null,
      emailVerified: new Date(),
    };
    mockPrismaUserUpsert.mockResolvedValueOnce(mockPrismaUser);

    const { authOptions } = await import('../config');
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
    const authorize = (credentialsProvider as any).authorize;

    const result = await authorize({ email: 'test@example.com', password: 'correctpassword' });

    expect(result).toBeDefined();
    expect(result?.id).toBe(mockSupabaseUser.id);
    expect(result?.email).toBe(mockSupabaseUser.email);
    expect(result?.name).toBe(mockSupabaseUser.user_metadata.name);
    expect(result?.role).toBe(mockPrismaUser.role);
    expect(mockPrismaUserUpsert).toHaveBeenCalled();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'correctpassword',
    });
  });

  it('should create a new company if companyName is provided and does not exist', async () => {
    const mockSupabaseUser = {
      id: 'auth-user-456',
      email: 'newuser@example.com',
      user_metadata: { name: 'New Company Owner' },
      email_confirmed_at: new Date().toISOString(),
    };
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const mockCompany = {
      id: 'new-company-id',
      name: 'Test Company',
      email: 'company@example.com',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
    mockPrismaCompanyUpsert.mockResolvedValueOnce(mockCompany);

    const mockPrismaUser = {
      id: 'auth-user-456',
      email: 'newuser@example.com',
      name: 'New Company Owner',
      role: UserRole.EMPLOYEE,
      companyId: mockCompany.id,
      jobTitle: null,
      image: null,
      emailVerified: new Date(),
    };
    mockPrismaUserUpsert.mockResolvedValueOnce(mockPrismaUser);

    const { authOptions } = await import('../config');
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
    const authorize = (credentialsProvider as any).authorize;

    const result = await authorize({
      email: 'newuser@example.com',
      password: 'securePass123!',
      companyName: 'Test Company',
      companyEmail: 'company@example.com',
    });

    expect(mockPrismaCompanyUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: 'Test Company',
        email: 'company@example.com',
      }),
    }));
    expect(result?.companyId).toBe(mockCompany.id);
  });

  it('should not create a new company if companyName is not provided', async () => {
    const mockSupabaseUser = {
      id: 'auth-user-789',
      email: 'anotheruser@example.com',
      user_metadata: { name: 'Another User' },
      email_confirmed_at: new Date().toISOString(),
    };
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const mockPrismaUser = {
      id: 'auth-user-789',
      email: 'anotheruser@example.com',
      name: 'Another User',
      role: UserRole.EMPLOYEE,
      companyId: null,
      jobTitle: null,
      image: null,
      emailVerified: new Date(),
    };
    mockPrismaUserUpsert.mockResolvedValueOnce(mockPrismaUser);

    const { authOptions } = await import('../config');
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
    const authorize = (credentialsProvider as any).authorize;

    const result = await authorize({
      email: 'anotheruser@example.com',
      password: 'securePass123!',
    });

    expect(mockPrismaCompanyUpsert).not.toHaveBeenCalled();
    expect(result?.companyId).toBeNull();
  });
});

describe('Google OAuth Provider Profile Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create or update user in Prisma from Google profile', async () => {
    const mockGoogleProfile = {
      id: 'google-id-123',
      email: 'googleuser@example.com',
      name: 'Google User',
      picture: 'http://example.com/pic.jpg',
      email_verified: true,
    };
    const mockTokens = {};

    const mockSupabaseAuthData = { user: { id: 'supabase-user-google-123' } };
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: mockSupabaseAuthData,
      error: null,
    });

    const mockPrismaUser = {
      id: 'supabase-user-google-123',
      email: 'googleuser@example.com',
      name: 'Google User',
      image: 'http://example.com/pic.jpg',
      role: UserRole.EMPLOYEE,
      emailVerified: new Date(),
    };
    mockPrismaUserUpsert.mockResolvedValueOnce(mockPrismaUser);

    const { authOptions } = await import('../config');
    const googleProvider = authOptions.providers.find(p => p.id === 'google');
    const profileFn = (googleProvider as any).profile;

    const result = await profileFn(mockGoogleProfile, mockTokens);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
    }));
    expect(mockPrismaUserUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: mockGoogleProfile.email },
      create: expect.objectContaining({
        id: mockSupabaseAuthData.user.id,
        email: mockGoogleProfile.email,
        name: mockGoogleProfile.name,
      }),
      update: expect.objectContaining({
        name: mockGoogleProfile.name,
      }),
    }));
    expect(result).toBeDefined();
    expect(result?.id).toBe(mockSupabaseAuthData.user.id);
    expect(result?.email).toBe(mockGoogleProfile.email);
    expect(result?.name).toBe(mockGoogleProfile.name);
  });

  it('should handle Supabase OAuth error gracefully', async () => {
    const mockGoogleProfile = {
      id: 'google-id-456',
      email: 'erroruser@example.com',
      name: 'Error User',
      picture: 'http://example.com/pic.jpg',
      email_verified: true,
    };
    const mockTokens = {};

    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Supabase OAuth failed', status: 500 },
    });

    const { authOptions } = await import('../config');
    const googleProvider = authOptions.providers.find(p => p.id === 'google');
    const profileFn = (googleProvider as any).profile;

    await expect(profileFn(mockGoogleProfile, mockTokens)).rejects.toThrow('Google OAuth authentication failed');
    expect(mockSignInWithOAuth).toHaveBeenCalled();
  });
}); 