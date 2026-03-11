import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";
import { error } from "console";

export async function POST(req:NextRequest) {
    
    try {
        const formData = await req.json();

        if(!(formData.timesheet_id)) throw ({
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
                oe.id,
                oe.time_in,
                oe.time_out
            FROM off_schedule_work_employees AS oe
            JOIN employees AS e ON e.employee_id = oe.employee_id 
                WHERE oe.timesheet_id = ?;
        `, [formData.timesheet_id]);

        const resObj: TResponseObject<any> = {
            data: rows
        }

        return Response.json(resObj);

    }
    catch(err:any) {
        console.log(error)
        if(err.message && err.code) {
            const resObj: TResponseObject<null> = {
                error: err,
                data: null
            }
            return Response.json(resObj);
        } else {
            const resObj: TResponseObject<null> = {
                error: {
                    message: "Something went wrong internally. Please try again.",
                    code: 500
                },
                data: null
            }
            return Response.json(resObj);
        }
    }
}