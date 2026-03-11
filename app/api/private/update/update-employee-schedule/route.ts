import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
    type TBody = {
        day: string,
        time: {
            in: string,
            out: string
        } | "dayoff" | null,
        employee_id: string
    }

    try {
        const formData = await req.json() as TBody | null;
     
        if(!(formData?.employee_id && formData.day)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM employee_schedule WHERE employee_id = ?`, [formData.employee_id]);

        if(!rows.length) {
            const weekly_schedule:TWeeklySchedule = {
                monday: null,
                tuesday: null,
                wednesday: null,
                thursday: null,
                friday: null,
                saturday: null,
                sunday: null
            }

            weekly_schedule[formData.day as keyof TWeeklySchedule] = formData.time;

            await db.query("INSERT INTO employee_schedule(employee_id, weekly_schedule_json) VALUES(?, ?)", [formData.employee_id, JSON.stringify(weekly_schedule)]);

            const resObj: TResponseObject<TWeeklySchedule> = {
                data: weekly_schedule,
            }

            return Response.json(resObj);

        } else {
            const weekly_schedule = JSON.parse(rows[0].weekly_schedule_json);

            if (formData.time === "dayoff") {
            Object.entries(weekly_schedule as TWeeklySchedule).forEach(
                ([key, value]) => {
                if (value === "dayoff") {
                    weekly_schedule[key as keyof TWeeklySchedule] = null;
                }
                }
            );
            }

            weekly_schedule[formData.day as keyof TWeeklySchedule] = formData.time;

            await db.query(
            "UPDATE employee_schedule SET weekly_schedule_json = ? WHERE employee_id = ?",
            [JSON.stringify(weekly_schedule), formData.employee_id]
            );

            const resObj: TResponseObject<TWeeklySchedule> = {
            data: weekly_schedule,
            };

            return Response.json(resObj);
        }

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