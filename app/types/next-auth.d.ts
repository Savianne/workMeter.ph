import NextAuth from "next-auth";

declare module "next-auth" {
  export interface Session {
    user: {
      id: string;
      uid: string;
      userName: string;
      email: string;
      companyId: string | null;
      accountStatus: "completed" | "pending";
      loginType: "credentials" | "google-auth";
      accountType: 'admin' | 'employee' | null
    };
  }

  interface User {
    id: string;
    uid: string;
    userName: string;
    email: string;
    companyId: string | null;
    accountStatus: "completed" | "pending";
    loginType: "credentials" | "google-auth";
    accountType: 'admin' | 'employee' | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    uid: string;
    userName: string;
    email: string;
    companyId: string | null;
    accountStatus: "completed" | "pending";
    loginType: "credentials" | "google-auth";
    accountType: 'admin' | 'employee' | null
  }
}