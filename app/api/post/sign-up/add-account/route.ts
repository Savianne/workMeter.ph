
import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { generateAccountUID } from "@/app/helpers/generateUID";

export async function POST(req:NextRequest) {
    
    try {
        const formData = await req.json();

        if(!(formData.accountDetails && formData.accountDetails.email && formData.accountDetails.password && formData.accountDetails.username && formData.token)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        const uid = generateAccountUID();
        const companyId = generateAccountUID();

        const [row] = await db.query<ResultSetHeader>("INSERT INTO accounts(uid, user_name, email, password, company, account_status) VALUES(?, ?, ?, ?, ?, ?)", [uid, formData.accountDetails.username, formData.accountDetails.email, formData.accountDetails.password, companyId, "pending"]);

        if(row.affectedRows) {
            await db.query("DELETE FROM validator_token WHERE token = ?", [formData.token]);

            const resObj: TResponseObject<{success: boolean}> = {
                data: {success: true}
            }

            return Response.json(resObj);
            
        } else {
            throw new Error("Something went wrong!");
        }
    }
    catch(err: any) {
        console.log(err)
        if(err.message && err.code) {
            const resObj: TResponseObject<null> = {
                error: {...err},
                data: null
            }
            return Response.json(resObj);
        } else {
            const resObj: TResponseObject<null> = {
                error: {
                    message: "Something went wrong internally. Please try again.",
                    code: 500
                },
                data: null
            }
            return Response.json(resObj);
        }  
    }

}