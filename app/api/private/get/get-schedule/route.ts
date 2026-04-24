import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = await getToken({ req });
   
    try {
        const formData = await req.json();

        if(!(
            formData.employee_id
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                ce.employee_id, first_name, middle_name, surname, ext_name, display_picture, weekly_schedule_json
            FROM company_employees AS ce 
                JOIN employees AS e ON ce.employee_id = e.employee_id 
                LEFT JOIN employee_schedule AS es ON es.employee_id = e.employee_id
            WHERE ce.company_id = ? 
            AND ce.employee_id = ?
            AND (e.employment_status = 'Regular' 
                OR e.employment_status = 'Probationary' 
                OR e.employment_status = 'Contractual' 
                OR e.employment_status = 'Casual');
        `, [token?.companyId, formData.employee_id])
    

        const resObj: TResponseObject<any> = {
            data: rows
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