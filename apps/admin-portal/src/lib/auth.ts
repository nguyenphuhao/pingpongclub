import { adminAuthApi } from './api-client';

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Verify admin credentials using username and password
 * Now calls API instead of accessing DB directly
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const result = await adminAuthApi.login(username, password);
    return result?.admin || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if admin user exists and is active
 * Now calls API instead of accessing DB directly
 */
export async function isAdmin(adminId: string): Promise<boolean> {
  try {
    const admin = await adminAuthApi.getCurrentAdmin();
    return admin !== null && admin.id === adminId;
  } catch (error) {
    return false;
  }
}

/**
 * Get admin user by ID
 * Now calls API instead of accessing DB directly
 */
export async function getAdminUser(adminId: string): Promise<AdminUser | null> {
  try {
    const admin = await adminAuthApi.getCurrentAdmin();
    if (!admin || admin.id !== adminId) {
      return null;
    }
    return admin;
  } catch (error) {
    return null;
  }
}

/**
 * Get current admin user from API
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    return await adminAuthApi.getCurrentAdmin();
  } catch (error) {
    return null;
  }
}

