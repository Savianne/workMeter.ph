import { NextRequest } from "next/server";
import { TResponseObject } from "@/app/types/TResponseObject";
import { ResultSetHeader } from "mysql2";
import { hash } from "bcrypt-ts";
import db from "../../mysql/connectionPool";

export async function POST(req:NextRequest) {
    const formData = await req.json();

    try {
        if(formData.email && formData.password) {
            const hashedPassword = await hash(formData.password, 10);

            const [result] = await db.query<ResultSetHeader>("UPDATE accounts SET password = ? WHERE email = ?", [hashedPassword, formData.email]);

            if(result.affectedRows) {

                const resObj: TResponseObject<{success: boolean}> = {
                    data: {success: true}
                }

                return Response.json(resObj);
            } else {
                throw ({
                    message: "Failed to change password",
                    code: "FAILED_CHANGE_PASS"
                })
            }
        } else {
            throw ({
                message: "Failed to change password",
                code: "FAILED_CHANGE_PASS"
            });
        }
    }
    catch(err: any) {
        const resObj: TResponseObject<null> = {
            error: {...err},
            data: null
        }
        return Response.json(resObj);
    }

}