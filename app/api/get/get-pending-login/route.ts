import { cookies } from "next/headers";
import db from "../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { error } from "console";

export async function GET() {
  const cookieStore = await cookies();
  const pending = cookieStore.get("pendingLogin")?.value;

  if(pending) {
        const [rows] = await db.query<RowDataPacket[]>(
            "SELECT * FROM accounts WHERE email = ? OR user_name = ?",
            [pending, pending]
        );

        if(rows.length) {
            const user = rows[0];

            const resObj: TResponseObject<[{ email: string, userName: string, uid: string }]> = {
                data: [{ email: user.email, userName: user.user_name, uid: user.uid }]
            }

            return Response.json(resObj);

        } else {
            const resObj: TResponseObject<null> = {
                error: {
                    message: "No pending login",
                    code: "NO_PENLOG"
                },
                data: null
            }
            return Response.json(resObj);
        }
    } else {
        const resObj: TResponseObject<null> = {
            error: {
                message: "No pending login",
                code: "NO_PENLOG"
            },
            data: null
        }
        
        return Response.json(resObj);
    }
}