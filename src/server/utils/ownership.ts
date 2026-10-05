/**
 * FinShield User-Data Isolation Foundation
 *
 * Core Principle:
 * Authenticated session identity
 *         ↓
 * Server verifies ownership
 *         ↓
 * Only that user's data is returned / mutated
 */

export class AuthorizationError extends Error {
  statusCode: number;

  constructor(message = 'Forbidden: Access denied to requested tenant resource') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

/**
 * Asserts that the authenticated user strictly owns the specified resource.
 * Throws 403 AuthorizationError if ownership does not match.
 *
 * @param resourceUserId - The userId foreign key on the target resource
 * @param authenticatedUserId - The server-derived verified session userId
 */
export function assertUserOwnership(
  resourceUserId: string,
  authenticatedUserId: string
): void {
  if (!resourceUserId || !authenticatedUserId || resourceUserId !== authenticatedUserId) {
    throw new AuthorizationError();
  }
}

/**
 * Helper to enforce mandatory tenant filtering on database query clauses.
 * Guarantees that where conditions always bind the authenticated userId.
 *
 * @param authenticatedUserId - The server-derived verified session userId
 * @param additionalWhere - Additional resource-specific filter conditions
 */
export function scopeQueryToUser<T extends Record<string, unknown>>(
  authenticatedUserId: string,
  additionalWhere: T = {} as T
): T & { userId: string } {
  if (!authenticatedUserId) {
    throw new AuthorizationError('Authentication required to scope resource query');
  }

  return {
    ...additionalWhere,
    userId: authenticatedUserId,
  };
}
