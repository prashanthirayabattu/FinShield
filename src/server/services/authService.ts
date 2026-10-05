import { hashPassword, comparePassword } from '../auth/password';
import { signAuthToken } from '../auth/jwt';
import { userService } from './userService';
import { RegisterInput, LoginInput } from '../schemas/authSchemas';
import { SafeUser } from '../types';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export const authService = {
  /**
   * Registers a new user account with bcrypt hashed password.
   * Rejects duplicate emails with a 409 status.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userService.findByEmail(input.email);
    if (existing) {
      throw new AuthError('An account with this email address already exists', 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userService.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const token = signAuthToken(user);

    return { user, token };
  },

  /**
   * Authenticates user credentials.
   * Returns generic 401 message for both non-existent users and wrong passwords to eliminate user enumeration.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userService.findByEmail(input.email);

    if (!user) {
      // Generic invalid credentials message
      throw new AuthError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(input.password, user.passwordHash);

    if (!isValid) {
      // Identical generic error message prevents password timing / account existence leakage
      throw new AuthError('Invalid email or password', 401);
    }

    const safeUser = await userService.findById(user.id);
    if (!safeUser) {
      throw new AuthError('User account not found', 401);
    }

    const token = signAuthToken(safeUser);

    return { user: safeUser, token };
  },
};
