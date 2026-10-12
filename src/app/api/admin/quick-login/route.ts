import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, COOKIE_OPTIONS, DEFAULT_ADMIN } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = await createSessionToken({
    id: DEFAULT_ADMIN.id,
    username: process.env.ADMIN_USERNAME || "admin123",
    role: "super_admin",
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_OPTIONS.name,
    value: token,
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
    maxAge: COOKIE_OPTIONS.maxAge,
  });

  const redirectUrl = new URL("/admin/overview", request.url);
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  const token = await createSessionToken({
    id: DEFAULT_ADMIN.id,
    username: process.env.ADMIN_USERNAME || "admin123",
    role: "super_admin",
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_OPTIONS.name,
    value: token,
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
    maxAge: COOKIE_OPTIONS.maxAge,
  });

  return NextResponse.json({ success: true, message: "Logged in as Super Admin" });
}
