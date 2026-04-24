import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {;
    const token = await getToken({ req });

    try {
        const formData = await req.json();
        if(!(
            token?.companyId &&
            formData.limit &&
            formData.date_filter
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM timesheet WHERE company_id = ? AND date = ?`, [token?.companyId, formData.date_filter]);
        
        const total = result[0].total;

        const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM timesheet WHERE company_id = ? AND date = ? ORDER BY id DESC LIMIT ?`, [token?.companyId, formData.date_filter, formData.limit])
    
        const mappedData = rows.map((item) => {
            if(item.time_schedule == null) return item;
            return({...item, time_schedule: JSON.parse(item.time_schedule)});
        });

        const resObj: TResponseObject<any> = {
            data: {
                limit: formData.limit,
                total,
                pageData: mappedData,
            }
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