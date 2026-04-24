import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

const days = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

export async function POST(req:NextRequest) {
   
    try {
        const formData = await req.json();

        if(!(formData.employee_id && formData.timesheet_id && formData.timesheet_date && formData.time_in && formData.time_out)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [query1] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM off_schedule_work_employees WHERE employee_id = ? AND timesheet_id = ?", [formData.employee_id, formData.timesheet_id]);
        
        if(Number(query1[0].count) > 0) {
            throw ({
                message: "The employee is already included in the Off-scheduled employees list.",
                code: "EMPLOYEE_IN_LIST"
            });
        }

        //Retrieve employee details
        const [query2] = await db.query<RowDataPacket[]>(`
            SELECT e.employment_status, es.weekly_schedule_json 
                FROM employees AS e JOIN employee_schedule AS es ON e.employee_id = es.employee_id 
            WHERE e.employee_id = ?`, [formData.employee_id]);

        const weeklySchedule = JSON.parse(query2[0].weekly_schedule_json);
        
        const scheduleForThisDate = weeklySchedule[`${days[new Date(formData.timesheet_date).getDay()]}`];
        
        if(!(scheduleForThisDate == null || scheduleForThisDate == "dayoff")) {
            throw ({
                message: "The selected employee already has an assigned schedule. There is no need to add them to off-schedule work.",
                code: "EMPLOYEE_HAS_SCHED"
            });
        }

        const [result] = await db.query<ResultSetHeader>("INSERT INTO off_schedule_work_employees (employee_id, timesheet_id, time_in, time_out, break_time_hours, work_hours) VALUES(?, ?, ?, ?, ?, ?)", [formData.employee_id, formData.timesheet_id, formData.time_in, formData.time_out, formData.break_time_hours, formData.work_hours]);

        if(!result.affectedRows) {
            throw ({
                message: "No Record Inserted",
                code: 500
            })
        }

        const resObj: TResponseObject<{id: number}> = {
            data: {id: result.insertId}
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