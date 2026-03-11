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
    const token = await getToken({ req });
    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.employee_id && formData.timesheet_id && formData.timesheet_date && formData.source && formData.time)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        //Retrieve employe schedule details
        const [query1] = await db.query<RowDataPacket[]>(`
            SELECT e.employment_status, es.weekly_schedule_json 
                FROM employees AS e JOIN employee_schedule AS es ON e.employee_id = es.employee_id 
            WHERE e.employee_id = ?`, [formData.employee_id]);

            
        if(
            String(query1[0].employment_status).toLowerCase() == "inactive" || 
            String(query1[0].employment_status).toLowerCase() == "resigned" ||
            String(query1[0].employment_status).toLowerCase() == "ended" || 
            String(query1[0].employment_status).toLowerCase() == "terminated"
        ) {
            throw ({
                message: "Time logging is not allowed for inactive employees.",
                code: "INACTIVE_EMPLOYEE"
            });
        }
            
        const weeklySchedule = JSON.parse(query1[0].weekly_schedule_json);
        
        const scheduleForThisDate = weeklySchedule[`${days[new Date(formData.timesheet_date).getDay()]}`];

        if(scheduleForThisDate == null || scheduleForThisDate == "dayoff") {
            const [query] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM off_schedule_work_employees WHERE employee_id = ? AND timesheet_id = ?", [formData.employee_id, formData.timesheet_id]);

            if(scheduleForThisDate == "dayoff" && Number(query[0].count) <= 0) {
                throw ({
                    message: "The employee associated with this ID is set to Day Off for the selected date in the timesheet. Time logging is not permitted unless a mandatory work schedule is assigned by the administrator.",
                    code: "IS_DAYOFF"
                });
            }

            if(scheduleForThisDate == null && Number(query[0].count) <= 0) {
                throw ({
                    message: "Unable to add time log. No schedule is assigned for this date unless an administrator assigns a mandatory work schedule for this specific timesheet and employee.",
                    code: "NO_SCHED"
                });
            }
        } else {
            const date = new Date(formData.timesheet_date).toISOString().split('T')[0];

            const [query] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM employee_leave_requests WHERE employee_id = ? AND date = ? AND status = ?", [formData.employee_id, date, "approved"]);

            if(Number(query[0].count) > 0) {
                throw ({
                    message: "Time log not allowed. The employee is currently on approved leave.",
                    code: "EMPLOYEE_ON_LEAVE"
                });
            }
        }

        const resObj: TResponseObject<any> = {
            data: {},
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