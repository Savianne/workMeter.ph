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

        if(!(token && token.companyId && formData.title && formData.date && formData.threshold_late && formData.threshold_absent)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const schedule = formData.schedule? JSON.stringify(formData.schedule) : null;

        const [result] = await db.query<ResultSetHeader>("INSERT INTO timesheet (company_id, title, date, time_schedule, threshold_late, threshold_absent) VALUES(?, ?, ?, ?, ?, ?)", [token.companyId, formData.title, formData.date, schedule, formData.threshold_late, formData.threshold_absent]);

        const resObj: TResponseObject<any> = {
            data: {
                id: result.insertId,
                ...formData,
                company_id: token.companyId,
                time_schedule: formData.schedule,
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