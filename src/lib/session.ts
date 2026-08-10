import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { MoodleSessionData } from "@/types";

const COOKIE_NAME = "taskflow_session";
const SECRET_KEY_STR = process.env.SESSION_SECRET || "airlangga_taskflow_default_secret_key_32bytes_min!";
// Ensure the secret is at least 32 bytes for AES-GCM-256
const encodedKey = new TextEncoder().encode(
  SECRET_KEY_STR.padEnd(32, "0").slice(0, 32)
);

export async function createSession(data: MoodleSessionData): Promise<void> {
  const jwt = await new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(encodedKey);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<MoodleSessionData | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtDecrypt(sessionCookie, encodedKey);
    return payload as unknown as MoodleSessionData;
  } catch (error) {
    console.error("Failed to decrypt session cookie:", error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
