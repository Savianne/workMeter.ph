import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { TResponseError } from "./app/types/TResponseObject";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;
  
  //Prevent access to login page if the user are already loged-in
  if (pathname.startsWith("/login") && token) {
    const pageNotFound = req.nextUrl.clone();
    pageNotFound.pathname = "/404";
    return NextResponse.redirect(pageNotFound);
  }

  // NOT authenticated
  if (pathname.startsWith("/admin") && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Wrong Account Type
  if (pathname.startsWith("/admin") && token && token.accountType == "employee") {
    const pageNotFound = req.nextUrl.clone();
    pageNotFound.pathname = "/404";
    return NextResponse.redirect(pageNotFound);
  }

   // Wrong Account Type
  if (pathname.startsWith("/employee") && token && token.accountType == "admin") {
    const pageNotFound = req.nextUrl.clone();
    pageNotFound.pathname = "/404";
    return NextResponse.redirect(pageNotFound);
  }

  //Account Pending
  if ((pathname.startsWith("/admin") || pathname.startsWith("/employee"))  && token && token.accountStatus == "pending") {
    const createOrgUrl = req.nextUrl.clone();
    createOrgUrl.pathname = "/complete-signup";
    return NextResponse.redirect(createOrgUrl);
  }

  //Account Pending
  if (pathname.startsWith("/complete-signup") && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  //Account Pending
  if (pathname.startsWith("/complete-signup") && token && token.accountStatus == "completed") {
    const pageNotFound = req.nextUrl.clone();
    pageNotFound.pathname = "/404";
    return NextResponse.redirect(pageNotFound);
  }

  //Protect API Private route
  if (pathname.startsWith("/api/private") && !token) {
    const responseError: TResponseError = {
      message: "Unauthorized request",
      code: 401
    }
    return NextResponse.json(responseError, {status: 401});
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/employee/:path*", "/complete-signup", "/api/private/:path*"],
};

