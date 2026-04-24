import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
    try {
        const formData = await req.json();
        console.log(formData)
        if(!(formData.id && formData.timesheet_id && formData.time_in)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<ResultSetHeader>("UPDATE attendance_time_log SET time_in = ?, time_out = ?, is_overtime_authorized = ? WHERE id = ? AND timesheet_id = ?", [formData.time_in, formData.time_out || null, Boolean(formData.is_overtime_authorized), formData.id, formData.timesheet_id]);

        if(!result.affectedRows) {
            throw ({
                message: "No Record Updated",
                code: 500
            })
        }

        const resObj: TResponseObject<any> = {
            data: {
                success: true
            },
        }

        return Response.json(resObj);

    }
    catch(err:any) {
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