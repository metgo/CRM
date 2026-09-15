import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getRepository, Profile, Organization } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "auth_token";

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<{
  user: Profile;
  payload: JWTPayload;
} | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const profileRepo = await getRepository(Profile);
    const user = await profileRepo.findOne({
      where: { id: payload.userId },
    });

    if (!user) return null;
    return { user, payload };
  } catch {
    return null;
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const profileRepo = await getRepository(Profile);
    const user = await profileRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });

    return { success: true, token };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function signUp(
  fullName: string,
  email: string,
  password: string,
  organizationName?: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const profileRepo = await getRepository(Profile);
    const normalizedEmail = email.toLowerCase();

    const existing = await profileRepo.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return { success: false, error: "Email already in use" };
    }

    const orgRepo = await getRepository(Organization);
    const organization = orgRepo.create({
      name: organizationName?.trim() || `${fullName}'s Organization`,
    });
    await orgRepo.save(organization);

    const passwordHash = await hashPassword(password);
    const profile = profileRepo.create({
      organizationId: organization.id,
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });
    await profileRepo.save(profile);

    const token = createToken({
      userId: profile.id,
      email: profile.email,
      organizationId: profile.organizationId,
      role: profile.role,
    });

    return { success: true, token };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "Registration failed" };
  }
}
