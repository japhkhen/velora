import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { sessionSecret } from "@/lib/env";

const COOKIE = "velora_session";
const WEEK = 60 * 60 * 24 * 7;

type Payload = { uid: string; exp: number };

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function encodeSession(uid: string) {
  const body: Payload = { uid, exp: Date.now() + WEEK * 1000 };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null): Payload | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(mac);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (!data.uid || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function readSessionCookie() {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE)?.value);
}

export async function writeSessionCookie(uid: string) {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
