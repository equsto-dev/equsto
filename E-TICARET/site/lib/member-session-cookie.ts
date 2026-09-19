import { NextResponse } from "next/server";

export const MEMBER_COOKIE = "equsto_member";
export const OAUTH_STATE_COOKIE = "equsto_oauth";

const SESSION_MAX_AGE = 90 * 24 * 60 * 60;
const OAUTH_MAX_AGE = 10 * 60;

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function setMemberSessionCookie(
  res: NextResponse,
  token: string,
  expiresAt?: number,
) {
  if (!token) return;
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    expires: expiresAt && expiresAt > Date.now() ? new Date(expiresAt) : undefined,
  });
}

export function clearMemberSessionCookie(res: NextResponse) {
  res.cookies.set(MEMBER_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setOauthStateCookie(res: NextResponse, value: string) {
  res.cookies.set(OAUTH_STATE_COOKIE, value, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE,
  });
}

export function clearOauthStateCookie(res: NextResponse) {
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
