import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/internal") || pathname.startsWith("/supplier")) {
    const session = request.cookies.get("mecoflow_session")?.value;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
  }
  if (pathname === "/login" && request.cookies.get("mecoflow_session")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/internal/:path*", "/supplier/:path*", "/login"],
};
