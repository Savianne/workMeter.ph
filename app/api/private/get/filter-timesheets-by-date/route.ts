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
            formData.page,
            formData.date_filter
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM timesheet WHERE company_id = ? AND date = ?`, [token?.companyId, formData.date_filter]);
        
        const total = result[0].total;
        const limit = 10;
        const offset = (formData.page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM timesheet WHERE company_id = ? AND date = ? ORDER BY id LIMIT ? OFFSET ?`, [token?.companyId, formData.date_filter, limit, offset])
    
        const resObj: TResponseObject<any> = {
            data: {
                page: formData.page,
                limit: 10,
                total,
                dateFilter: formData.dateFilter,
                totalPages,
                hasNext: formData.page < totalPages,
                pageData: rows,
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