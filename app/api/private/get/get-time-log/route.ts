import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {;
    const token = await getToken({ req });

    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.timesheet_id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                atl.break_time_hours, atl.is_overtime_authorized, atl.id, atl.time_in, atl.time_out, atl.source, atl.company_id, atl.timesheet_id, atl.is_dayoff, atl.scheduled_time_in, atl.scheduled_time_out,
                e.first_name, e.middle_name, e.surname, e.ext_name, e.employee_id, e.designation, e.display_picture
            FROM attendance_time_log AS atl
                JOIN employees AS e ON atl.employee_id = e.employee_id
            WHERE atl.company_id = ? AND atl.timesheet_id = ?
        `, [token.companyId, formData.timesheet_id]);

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