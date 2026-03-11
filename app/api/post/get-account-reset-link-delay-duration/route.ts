
import { NextRequest } from "next/server";
import db from "../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
    const formData = await req.json();

    try {
        if(formData.uid) {
            const [rows] = await db.query<RowDataPacket[]>(
                "SELECT * FROM next_reset_password_link_datetime_request WHERE uid = ?",
                [formData.uid]
            );
        
            if(rows.length) {
                const resObj: TResponseObject<[{date: Date}]> = {
                    data: [{date: rows[0].next_req_datetime}]
                }
        
                return Response.json(resObj);
        
            } else {
                const resObj: TResponseObject<[]> = {
                    data: []
                }
        
                return Response.json(resObj);
            }
        } else {
            throw ({
                message: "Request Error",
                code: "REQ_ERR"
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