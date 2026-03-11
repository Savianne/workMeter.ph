import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

interface ITimeLogFromDb {
    id: number;
    company_id: string,
    employee_id: string,
    timesheet_id: number;
    first_name: string;
    middle_name: string | null;
    surname: string;
    ext_name: string | null;
    display_picture: string | null;
    designation: string;
    source: string,
    time_in: string,
    time_out: string,
}

export async function POST(req: NextRequest) {;
    const token = await getToken({ req });

    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.timesheet_id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [employeeSchedule] = await db.query<RowDataPacket[]>(`
            SELECT 
                atl.employee_id,
                es.weekly_schedule_json
            FROM attendance_time_log AS atl 
            JOIN employee_schedule AS es ON atl.employee_id = es.employee_id
            WHERE atl.company_id = ? AND atl.timesheet_id = ?
        `, [token.companyId, formData.timesheet_id]);

        const [employeeOffScheduleWork] = await db.query<RowDataPacket[]>(`
            SELECT *   
            FROM off_schedule_work_employees AS oe
            WHERE oe.timesheet_id = ?
        `, [formData.timesheet_id]);

        const resObj: TResponseObject<any> = {
            data: {
                employeeSchedule,
                employeeOffScheduleWork
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