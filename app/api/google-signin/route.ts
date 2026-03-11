import { NextRequest } from "next/server";
import { cookies } from 'next/headers';
import { TResponseObject } from "@/app/types/TResponseObject";
import db from "../mysql/connectionPool";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Session } from "next-auth";
import { generateAccountUID } from "@/app/helpers/generateUID";
import jwt from "jsonwebtoken";

const access_token_secret = process.env.ACCESS_TOKEN_SECRET as string;

export async function POST(req:NextRequest) {
    const formData = await req.json();

    try {

        if(!(formData && formData.email && formData.name)) throw ({
            message: "",
            code: ""
        });

        const [googleAuthAccounts] = await db.query<RowDataPacket[]>(
            "SELECT * FROM google_auth_accounts WHERE email = ?",
            [formData.email]
        );

        let session = {user: {}} as Session;

        if (googleAuthAccounts.length) {//Check if the email exist 
            session.user.companyId = googleAuthAccounts[0].company;
            session.user.accountStatus = googleAuthAccounts[0].account_status;
            session.user.uid = googleAuthAccounts[0].uid;
            session.user.id = googleAuthAccounts[0].id;
            session.user.email = formData.email;
            session.user.userName = formData.name;
            session.user.loginType = "google-auth"
        } else {//if the email does not exist then add it to the database as new user
            const uid = generateAccountUID();
            const companyId = generateAccountUID();

            try {
                const [result] = await db.query<ResultSetHeader>("INSERT INTO google_auth_accounts(uid, email, company, account_status) VALUES(? ,?, ?, ?)", [uid, formData.email, companyId, "pending"]);
                
                if(result.affectedRows) {
                    session.user.id = String(result.insertId);
                    session.user.uid = uid;
                    session.user.companyId = companyId;
                    session.user.accountStatus = "pending";
                    session.user.email = formData.email;
                    session.user.userName = formData.name;
                    session.user.loginType = "google-auth"
                } else  {
                    throw "Registration failed"
                }
            } catch(err) {
                throw err
            }
        }

        const token = jwt.sign(session.user, access_token_secret, { expiresIn: '1h' });

        const cookieStore = await cookies();
    
        cookieStore.set({
            name: 'google_auth_token',
            value: token,
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60,
        });

        const resObj: TResponseObject<{logedin: boolean}> = {
            data: {logedin: true}
        }

        return Response.json(resObj);

    }
    catch(err:any) {
        console.log(err);
        const resObj: TResponseObject<null> = {
            data: null,
            error: {message: "Internal Server Error", code: 500}
        }

        return Response.json(resObj);
    }

}