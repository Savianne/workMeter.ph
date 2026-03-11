import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    
    try {
        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                company_id, ce.employee_id, first_name, middle_name, surname, ext_name, e.display_picture, e.designation
            FROM company_employees AS ce 
                JOIN employees AS e ON ce.employee_id = e.employee_id  WHERE ce.company_id = ?
        `, [token?.companyId])
    
        const resObj: TResponseObject<any> = {
            data: rows
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