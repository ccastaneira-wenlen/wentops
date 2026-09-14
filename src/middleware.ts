import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

    if (isDashboard && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/my-wentops", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/create/:path*", "/my-wentops/:path*", "/dashboard/:path*"],
};
