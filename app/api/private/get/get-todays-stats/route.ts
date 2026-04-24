import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {;
    const token = await getToken({ req });

    try {

        if(!(token?.companyId)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        //get the total of all active employees in the company
        const [q1] = await db.query<RowDataPacket[]>(`
            SELECT COUNT(*) AS totalActiveEmployees FROM company_employees AS CE 
                JOIN employees AS E ON CE.employee_id = E.employee_id 
            WHERE CE.company_id = ? 
                AND (E.employment_status = 'Regular' 
                OR E.employment_status = 'Probationary' 
                OR E.employment_status = 'Contractual' 
                OR E.employment_status = 'Casual');
        `, [token?.companyId]);

        
        const dateToday = new Date();
        const date = `${dateToday.getFullYear()}-${dateToday.getMonth() + 1}-${dateToday.getDate()}`;

        //get on leave today
        const [q2] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS totalOnLeaveTodayEmployees FROM employee_leave_request WHERE company_id = ? AND date = ? AND status = ?", [token?.companyId, date, "approved"]);

        //Get pending leave request
        const [q3] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS totalPendingLeaveRequest FROM employee_leave_request WHERE company_id = ? AND status = ?", [token?.companyId, "pending"])
    
        //Get Present Today
        const [q4] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS totalPresentToday FROM attendance_time_log WHERE company_id = ? AND timelogged_date = ?`, [token?.companyId, date]);
        
        const resObj: TResponseObject<any> = {
            data: {
                totalActiveEmployees: q1[0].totalActiveEmployees,
                totalOnLeaveTodayEmployees: q2[0].totalOnLeaveTodayEmployees,
                totalPendingLeaveRequest: q3[0].totalPendingLeaveRequest,
                totalPresentToday: q4[0].totalPresentToday
            }
        }
    
        return NextResponse.json(resObj);
    } catch {
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