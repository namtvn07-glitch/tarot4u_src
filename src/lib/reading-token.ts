import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { Draw, OrientationMode } from "@/lib/reading";

const TTL_MS = 15 * 60_000; // 15 phút hiệu lực

export interface DrawTokenPayload {
  userId: string;
  topic: string;
  question: string;
  orientationMode: OrientationMode;
  cards: Draw[];
  exp: number;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function signDrawToken(
  payload: Omit<DrawTokenPayload, "exp">,
): string {
  const full: DrawTokenPayload = { ...payload, exp: Date.now() + TTL_MS };
  const body = base64url(Buffer.from(JSON.stringify(full), "utf8"));
  const signature = createHmac("sha256", env.READING_TOKEN_SECRET)
    .update(body)
    .digest("hex");
  return `${body}.${signature}`;
}

export function verifyDrawToken(token: string): DrawTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = createHmac("sha256", env.READING_TOKEN_SECRET)
    .update(body)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: DrawTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}
