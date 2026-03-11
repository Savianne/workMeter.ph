import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {;
    const token = await getToken({ req });
    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year");
    
    const startDate = `${year}-01-01`;
    const endDate = `${Number(year) + 1}-01-01`;

    try {
        if(!(
            token?.companyId
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                e.first_name, 
                e.middle_name, 
                e.surname, 
                e.ext_name, 
                e.display_picture, 
                e.designation, 
                e.employee_id, 
                elr.id,
                elr.date, 
                elr.paid, 
                elr.status, 
                lt.title,
                elr.leave_type 
            FROM employee_leave_request AS elr 
            JOIN employees AS e ON e.employee_id = elr.employee_id 
            JOIN leave_types AS lt ON lt.id = elr.leave_type 
                WHERE elr.company_id = ? AND elr.date >= ? AND elr.date < ?;
        `, [token?.companyId, startDate, endDate])
    
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