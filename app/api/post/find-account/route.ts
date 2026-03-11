
import { NextRequest } from "next/server";
import db from "../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
    const formData = await req.json();

    try {
        if(formData.email) {
            const [rows] = await db.query<RowDataPacket[]>(
                "SELECT * FROM accounts WHERE email = ?",
                [formData.email]
            );
        
            if(rows.length) {
                const user = rows[0];
        
                const resObj: TResponseObject<{ email: string, userName: string, uid: string }> = {
                    data: { email: user.email, userName: user.user_name, uid: user.uid }
                }
        
                return Response.json(resObj);
        
            } else {
                throw "NO_ACCOUNT";
            }
        } else {
            throw "NO_ACCOUNT";
        }
    }
    catch(err) {
        const resObj: TResponseObject<null> = {
            error: {
                message: "No account is associated with this email address.",
                code: "NO_ACCOUNT"
            },
            data: null
        }
        return Response.json(resObj);
    }

}