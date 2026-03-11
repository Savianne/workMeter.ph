import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import db from "../../mysql/connectionPool";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { compare } from "bcrypt-ts";
import { cookies } from "next/headers";
import { generateAccountUID } from "@/app/helpers/generateUID";

export const options: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username:", type: "text" },
                password: { label: "Password:", type: "password" },
            },

            async authorize(credentials) {
                if (!credentials) return null;

                const { username, password } = credentials as {
                    username: string;
                    password: string;
                };

                const [rows] = await db.query<RowDataPacket[]>(
                    "SELECT * FROM accounts WHERE email = ? OR user_name = ?",
                    [username, username]
                );

                if (rows.length === 0) throw new Error("LOGIN_NO_USER");

                const user = rows[0];       

                const match = await compare(password, user.password);
                
                if (!match) {
                    const cookie = await cookies();
                    cookie.set({
                        name: "pendingLogin",
                        value: username,          // email or username
                        path: "/",
                        maxAge: 60 * 30,           // expires in 30 minutes
                    });

                    throw new Error("LOGIN_WRONG_PASS");
                }

                return {
                    id: user.uid.toString(),
                    uid: user.uid.toString(),
                    companyId: user.company,
                    userName: user.user_name,
                    email: user.email,
                    accountStatus: user.account_status,
                    loginType: "credentials",
                    accountType: null
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            if (account?.provider === "google" && profile && profile.email && profile.name ) {

                const [googleAuthAccounts] = await db.query<RowDataPacket[]>(
                    "SELECT * FROM google_auth_accounts WHERE email = ?",
                    [profile.email]
                );

                if (googleAuthAccounts.length) {//Check if the email exist 
                    user.companyId = googleAuthAccounts[0].company;
                    user.accountStatus = googleAuthAccounts[0].account_status;
                    user.uid = googleAuthAccounts[0].uid;
                    user.id = googleAuthAccounts[0].id;
                    user.email = profile.email;
                    user.userName = profile.name;
                    user.loginType = "google-auth";
                    user.accountType = googleAuthAccounts[0].account_type
                } else {//if the email does not exist then add it to the database as new user
                    const uid = generateAccountUID();
                    // const companyId = generateAccountUID();

                    try {
                        const [result] = await db.query<ResultSetHeader>("INSERT INTO google_auth_accounts(uid, email, account_status) VALUES(?, ?, ?)", [uid, profile.email, "pending"]);
                        
                        if(result.affectedRows) {
                            user.id = String(result.insertId);
                            user.uid = uid;
                            user.companyId = null;
                            user.accountStatus = "pending";
                            user.email = profile.email;
                            user.userName = profile.name;
                            user.loginType = "google-auth",
                            user.accountType = null
                        } else  throw "Registration failed"
                    } catch(err) {
                        console.log(err);
                        return false;
                    }
                }
            }

            return true;
        },

        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.uid = user.uid;
                token.userName = user.userName;
                token.email = user.email;
                token.companyId = user.companyId;
                token.accountStatus = user.accountStatus;
                token.loginType = user.loginType,
                token.accountType = user.accountType
            }

            // When session.update() is called
            if (trigger === "update" && session && session.reason) {
                switch(session.reason) {
                    case "UPDATE_ACC_STATUS":
                        token.accountStatus = session.accountStatus;
                        break;
                    case "UPDATE_COMPANY":
                        token.companyId = session.companyId;
                        break;
                    case "UPDATE_ACC_TYPE":
                        token.accountType = session.accountType;
                        break;
                }
                
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.uid = token.uid;
                session.user.userName = token.userName;
                session.user.email = token.email;
                session.user.companyId = token.companyId;
                session.user.accountStatus = token.accountStatus;
                session.user.loginType = token.loginType;
                session.user.accountType = token.accountType
            }
            return session;
        }
    },

    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
};
