/**
 * Member Permissions System
 * 
 * Defines permission rules for member operations based on user roles
 */

import { RequestContext } from './member.types';

export class MemberPermissions {
  /**
   * Check if user can view member details
   */
  static canViewMember(ctx: RequestContext): boolean {
    // Admin and Moderator can view all
    if (ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR') {
      return true;
    }
    
    // User can view their own profile
    if (ctx.targetUserId === ctx.user.id) {
      return true;
    }
    
    // Regular users can view public profiles (will be filtered by service)
    return true;
  }
  
  /**
   * Check if user can view sensitive fields (phone, email, admin notes)
   */
  static canViewSensitiveFields(ctx: RequestContext): boolean {
    // Admin and Moderator can view all
    if (ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR') {
      return true;
    }
    
    // User can view their own sensitive data
    if (ctx.targetUserId === ctx.user.id) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if user can edit member profile
   */
  static canEditMember(ctx: RequestContext): boolean {
    // Admin and Moderator can edit all
    if (ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR') {
      return true;
    }
    
    // User can edit their own profile (limited fields)
    if (ctx.targetUserId === ctx.user.id) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if user can adjust rating manually
   */
  static canAdjustRating(ctx: RequestContext): boolean {
    return ctx.user.role === 'ADMIN';
  }
  
  /**
   * Check if user can delete member
   */
  static canDeleteMember(ctx: RequestContext): boolean {
    return ctx.user.role === 'ADMIN';
  }
  
  /**
   * Check if user can create new members
   */
  static canCreateMember(ctx: RequestContext): boolean {
    return ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR';
  }
  
  /**
   * Check if user can view all members (including inactive)
   */
  static canViewAllMembers(ctx: RequestContext): boolean {
    return ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR';
  }
  
  /**
   * Check if user can view admin notes
   */
  static canViewAdminNotes(ctx: RequestContext): boolean {
    return ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR';
  }
  
  /**
   * Get allowed fields for editing based on role
   * Returns list of field names that the user can edit
   */
  static getAllowedEditFields(ctx: RequestContext): string[] {
    // Admin and Moderator can edit most fields
    if (ctx.user.role === 'ADMIN' || ctx.user.role === 'MODERATOR') {
      return [
        'email',
        'phone',
        'nickname',
        'displayName',
        'firstName',
        'lastName',
        'gender',
        'dateOfBirth',
        'startedPlayingAt',
        'tags',
        'playStyle',
        'bio',
        'adminNotes',
        'status',
        'profileVisibility',
        'showPhone',
        'showEmail',
        'showRating',
        // Admin can edit rating fields (but should use adjustRating method)
        'ratingPoints',
        'peakRating',
      ];
    }
    
    // Regular users can only edit their own limited fields
    if (ctx.targetUserId === ctx.user.id) {
      return [
        'nickname',
        'displayName',
        'gender',
        'dateOfBirth',
        'tags',
        'playStyle',
        'bio',
        'profileVisibility',
        'showPhone',
        'showEmail',
        'showRating',
      ];
    }
    
    return [];
  }
  
  /**
   * Filter object to only include allowed fields
   */
  static filterAllowedFields<T extends Record<string, any>>(
    data: T,
    ctx: RequestContext
  ): Partial<T> {
    const allowedFields = this.getAllowedEditFields(ctx);
    const filtered: Partial<T> = {};
    
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        filtered[key as keyof T] = data[key];
      }
    }
    
    return filtered;
  }
}

