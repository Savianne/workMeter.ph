import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {;
    const token = await getToken({ req });

    try {
        if(!(
            token?.companyId
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM leave_types WHERE company_id = ? AND is_deleted = ?`, [token?.companyId, "0"])
    
        const resObj: TResponseObject<any> = {
            data: rows
        }
    
        return NextResponse.json(resObj);
    } catch (err) {
        console.log(err)
        const resObj: TResponseObject<null> = {
            data: null,
            error: {
                message: "Internal Server Error",
                code: 500
            }
        }
    
        return NextResponse.json(resObj, {
            status: 500
        });
    }
    
}