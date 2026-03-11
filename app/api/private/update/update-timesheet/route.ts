import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
     const token = await getToken({ req });
    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.id && formData.title)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        const [res] = await db.query<ResultSetHeader>("UPDATE timesheet SET title = ?, threshold_late = ?, threshold_absent = ?, timein_schedule = ? WHERE id = ? AND company_id = ?", [formData.title, formData.threshold_late || 0, formData.threshold_absent | 0, formData.timein_schedule, formData.id, token.companyId]);
        if(!res.affectedRows) throw "Failed to update"

        const resObj: TResponseObject<{done: boolean}> = {
            data: {
                done: true
            },
        }

        return Response.json(resObj);

    }
    catch(err:any) {
        console.log(err)
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