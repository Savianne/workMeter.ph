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
           SELECT 
                ce.employee_id,
                e.first_name,
                e.middle_name,
                e.surname,
                e.ext_name,
                e.display_picture,
                es.weekly_schedule_json->>'$.monday' AS schedule
            FROM company_employees AS ce
            JOIN employees AS e ON ce.employee_id = e.employee_id
            LEFT JOIN employee_schedule AS es ON es.employee_id = e.employee_id
            WHERE ce.company_id = ?
                AND es.weekly_schedule_json->>'$.monday' IS NOT NULL
                AND es.weekly_schedule_json->>'$.monday' <> 'dayoff'
                AND e.employment_status IN ('Regular', 'Probationary', 'Contractual', 'Casual')
        `, ["9540314140"]);


        
        const resObj: TResponseObject<any> = {
            data: q1
        }
    
        return NextResponse.json(resObj);
    } catch(err) {
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