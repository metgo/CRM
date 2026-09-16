import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { getRepository, Profile, Organization, AuthToken, AuthEvent } from "@/lib/db";
import type { AuthTokenPurpose, AuthEventType } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail, signupOtpEmail } from "@/lib/email/templates";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Refusing to start in production.");
}
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-do-not-use-in-production";
const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "auth_token";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
  tokenVersion: number;
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

/**
 * `payload.tokenVersion` must match the profile's current `tokenVersion` or
 * the token is treated as revoked — this is what makes logout, a password
 * reset, or an admin-forced sign-out actually invalidate a JWT that's
 * otherwise still cryptographically valid until its 7-day expiry.
 */
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
    if (user.tokenVersion !== payload.tokenVersion) return null;
    return { user, payload };
  } catch {
    return null;
  }
}

/** Like getCurrentUser(), but also requires the "superadmin" role (Settings). */
export async function requireSuperadmin(): Promise<{
  user: Profile;
  payload: JWTPayload;
} | null> {
  const auth = await getCurrentUser();
  if (!auth || auth.payload.role !== "superadmin") return null;
  return auth;
}

/** Bumps tokenVersion so every JWT issued before this call stops working. */
export async function invalidateSessions(userId: string): Promise<void> {
  const profileRepo = await getRepository(Profile);
  const user = await profileRepo.findOne({ where: { id: userId } });
  if (!user) return;
  user.tokenVersion += 1;
  await profileRepo.save(user);
}

// ------------------------------------------------------------------ audit log

async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    return { ip, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

async function logAuthEvent(params: {
  eventType: AuthEventType;
  profileId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const eventRepo = await getRepository(AuthEvent);
    const { ip, userAgent } = await requestMeta();
    const event = eventRepo.create({
      eventType: params.eventType,
      profileId: params.profileId ?? null,
      organizationId: params.organizationId ?? null,
      ip,
      userAgent,
      metadata: params.metadata ?? null,
    });
    await eventRepo.save(event);
  } catch (error) {
    console.error("Failed to log auth event:", error);
  }
}

// ------------------------------------------------------------- reset/verify tokens

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

function hashRawToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function issueAuthToken(profileId: string, purpose: AuthTokenPurpose, ttlMs: number): Promise<string> {
  const tokenRepo = await getRepository(AuthToken);
  const raw = randomBytes(32).toString("hex");
  const entity = tokenRepo.create({
    profileId,
    purpose,
    tokenHash: hashRawToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  await tokenRepo.save(entity);
  return raw;
}

/** Marks a matching, unused, unexpired token as used and returns it, or null. */
async function consumeAuthToken(raw: string, purpose: AuthTokenPurpose): Promise<AuthToken | null> {
  const tokenRepo = await getRepository(AuthToken);
  const record = await tokenRepo.findOne({ where: { tokenHash: hashRawToken(raw), purpose } });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;

  record.usedAt = new Date();
  await tokenRepo.save(record);
  return record;
}

/**
 * Always resolves the same way whether or not `email` matches an account, so
 * this can't be used to enumerate registered emails.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const profileRepo = await getRepository(Profile);
  const user = await profileRepo.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return;

  const raw = await issueAuthToken(user.id, "password_reset", RESET_TOKEN_TTL_MS);
  const { subject, html } = passwordResetEmail(`${appUrl()}/reset-password?token=${raw}`);
  await sendEmail({ to: user.email, subject, html });

  await logAuthEvent({
    eventType: "password_reset_requested",
    profileId: user.id,
    organizationId: user.organizationId,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const record = await consumeAuthToken(token, "password_reset");
  if (!record) return { success: false, error: "Invalid or expired reset link" };

  const profileRepo = await getRepository(Profile);
  const user = await profileRepo.findOne({ where: { id: record.profileId } });
  if (!user) return { success: false, error: "Invalid or expired reset link" };

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1; // invalidate any sessions issued before the reset
  user.failedLoginAttempts = 0;
  await profileRepo.save(user);

  await logAuthEvent({
    eventType: "password_reset_completed",
    profileId: user.id,
    organizationId: user.organizationId,
  });
  return { success: true };
}

// ------------------------------------------------------------------- sign in/up

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_PENDING_SECRET = (process.env.JWT_SECRET ?? "dev-only-secret-do-not-use-in-production") + ":otp";
const OTP_RESEND_INTERVAL_MS = 45 * 1000; //45 seconds

export interface PendingSignupPayload {
  email: string;
  fullName: string;
  passwordHash: string;
  organizationName: string;
  otpHash: string; // sha256 of the 6-digit code
  exp: number;
}

/*
 * Step 1 of OTP signup.
 */
export async function requestSignupOtp(
  fullName: string,
  email: string,
  password: string,
  organizationName?: string
): Promise<
  | { success: true; pendingToken: string }
  | { success: false; error: string; code?: "rate_limited" }
> {
  try {
    const profileRepo = await getRepository(Profile);
    const normalizedEmail = email.toLowerCase();

    const existing = await profileRepo.findOne({ where: { email: normalizedEmail } });
    if (existing) return { success: false, error: "Email already in use" };

    const eventRepo = await getRepository(AuthEvent);
    const lastRequest = await eventRepo
      .createQueryBuilder("e")
      .where("e.event_type = :type", { type: "signup_otp_requested" })
      .andWhere("e.metadata->>'email' = :email", { email: normalizedEmail })
      .orderBy("e.created_at", "DESC")
      .getOne();

    if (lastRequest) {
      const elapsedMs = Date.now() - lastRequest.createdAt.getTime();
      if (elapsedMs < OTP_RESEND_INTERVAL_MS) {
        const waitSec = Math.ceil((OTP_RESEND_INTERVAL_MS - elapsedMs) / 1000);
        return {
          success: false,
          error: `נא להמתין ${waitSec} שניות לפני שליחה חוזרת`,
          code: "rate_limited",
        };
      }
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const otpHash = createHash("sha256").update(otp).digest("hex");
    const passwordHash = await hashPassword(password);

    const payload: PendingSignupPayload = {
      email: normalizedEmail,
      fullName,
      passwordHash,
      organizationName: organizationName?.trim() || `${fullName}'s Organization`,
      otpHash,
      exp: Math.floor((Date.now() + OTP_TTL_MS) / 1000),
    };

    const pendingToken = jwt.sign(payload, OTP_PENDING_SECRET);

    const { subject, html } = signupOtpEmail(otp);
    await sendEmail({ to: normalizedEmail, subject, html });

    await logAuthEvent({
      eventType: "signup_otp_requested",
      metadata: { email: normalizedEmail },
    });

    return { success: true, pendingToken };
  } catch (error) {
    console.error("requestSignupOtp error:", error);
    return { success: false, error: "Failed to send OTP" };
  }
}

/*
 * Step 2 of OTP signup.
 * Verifies the pending token and the submitted OTP code
 */
export async function verifySignupOtp(
  pendingToken: string,
  otp: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  let pending: PendingSignupPayload;
  try {
    pending = jwt.verify(pendingToken, OTP_PENDING_SECRET) as PendingSignupPayload;
  } catch {
    return { success: false, error: "Verification session expired. Please sign up again." };
  }

  if (pending.exp < Math.floor(Date.now() / 1000)) {
    return { success: false, error: "OTP has expired. Please sign up again." };
  }

  const submittedHash = createHash("sha256").update(otp.trim()).digest("hex");
  if (submittedHash !== pending.otpHash) {
    return { success: false, error: "Incorrect code. Please try again." };
  }

  try {
    const profileRepo = await getRepository(Profile);

    // Guard against a race where the email was registered between step 1 and 2
    const existing = await profileRepo.findOne({ where: { email: pending.email } });
    if (existing) return { success: false, error: "Email already in use" };

    const orgRepo = await getRepository(Organization);
    const organization = orgRepo.create({ name: pending.organizationName });
    await orgRepo.save(organization);

    const profile = profileRepo.create({
      organizationId: organization.id,
      fullName: pending.fullName,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: "superadmin",
      emailVerified: true, // they proved inbox access via OTP
    });
    await profileRepo.save(profile);

    const token = createToken({
      userId: profile.id,
      email: profile.email,
      organizationId: profile.organizationId,
      role: profile.role,
      tokenVersion: profile.tokenVersion,
    });

    await logAuthEvent({ eventType: "signup", profileId: profile.id, organizationId: profile.organizationId });

    return { success: true, token };
  } catch (error) {
    console.error("verifySignupOtp error:", error);
    return { success: false, error: "Registration failed" };
  }
}



export async function signIn(
  email: string,
  password: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const profileRepo = await getRepository(Profile);
    const normalizedEmail = email.toLowerCase();
    const user = await profileRepo.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      await logAuthEvent({ eventType: "login_failed", metadata: { email: normalizedEmail, reason: "no_account" } });
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      user.failedLoginAttempts += 1;
      await profileRepo.save(user);
      await logAuthEvent({
        eventType: "login_failed",
        profileId: user.id,
        organizationId: user.organizationId,
        metadata: { reason: "bad_password", attempts: user.failedLoginAttempts },
      });
      return { success: false, error: "Invalid credentials" };
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await profileRepo.save(user);

    const token = createToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    await logAuthEvent({ eventType: "login_success", profileId: user.id, organizationId: user.organizationId });

    return { success: true, token };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

