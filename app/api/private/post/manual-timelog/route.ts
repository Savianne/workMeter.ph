import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

const socketUrl = process.env.EXPRESS_SOCKET_IO_SERVER_URL;

const days = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

export async function POST(req:NextRequest) {
    const token = await getToken({ req });
    try {
        const formData = await req.json();

        console.log(formData)

        if(!(token && token.companyId && formData.employee_id && formData.timesheet_id && formData.timesheet_date && formData.source && formData.timeIn)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        //Retrieve employe schedule details
        const [query1] = await db.query<RowDataPacket[]>(`
            SELECT e.employment_status, es.weekly_schedule_json 
                FROM employees AS e JOIN employee_schedule AS es ON e.employee_id = es.employee_id 
            WHERE e.employee_id = ?`, [formData.employee_id]);

        const employmentStatus = String(query1[0].employment_status).toLowerCase();
            
        if(
            employmentStatus == "inactive" || 
            employmentStatus == "resigned" ||
            employmentStatus == "ended" || 
            employmentStatus == "terminated"
        ) {
            throw ({
                message: "Time logging is not allowed for inactive employees.",
                code: "INACTIVE_EMPLOYEE"
            });
        }
        
        const [timesheetTimeSchedule] = await db.query<RowDataPacket[]>("SELECT time_schedule FROM timesheet WHERE id = ?", [formData.timesheet_id]);
        
        const timesheetDate = new Date(formData.timesheet_date)

        const weeklySchedule = JSON.parse(query1[0].weekly_schedule_json);
        
        const scheduleForThisDate = weeklySchedule[`${days[timesheetDate.getDay()]}`];

        let off_schedule_constraint = null;
        let isDayOff = false;
        const scheduledTime: {in: string, out: string, break_time_hours: number} = timesheetTimeSchedule.length && timesheetTimeSchedule[0].time_schedule? JSON.parse(timesheetTimeSchedule[0].time_schedule) : scheduleForThisDate && scheduleForThisDate !== "dayoff"? scheduleForThisDate : {in: "07:00:00", out: "16:00:00", break_time_hours: 0};
       
        if(scheduleForThisDate == null || scheduleForThisDate == "dayoff") {
            const [query] = await db.query<RowDataPacket[]>("SELECT id, break_time_hours, time_in, time_out FROM off_schedule_work_employees WHERE employee_id = ? AND timesheet_id = ?", [formData.employee_id, formData.timesheet_id]);

            if(query.length <= 0) {
                switch(scheduleForThisDate) {
                    case "dayoff":
                    throw ({
                        message: "The employee associated with this ID is set to Day Off for the selected date in the timesheet. Time logging is not permitted unless a mandatory work schedule is assigned by the administrator.",
                        code: "IS_DAYOFF"
                    });
                    case null:
                    throw ({
                        message: "Unable to add time log. No schedule is assigned for this date unless an administrator assigns a mandatory work schedule for this specific timesheet and employee.",
                        code: "NO_SCHED"
                    });
                }
            } else {
                off_schedule_constraint = query[0].id;
                isDayOff = scheduleForThisDate == "dayoff";
                scheduledTime.in = query[0].time_in;
                scheduledTime.out = query[0].time_out;
                scheduledTime.break_time_hours =query[0].break_time_hours;
                // if(!(timesheetTimeSchedule.length && timesheetTimeSchedule[0].time_schedule)) {
                //     scheduledTime.in = query[0].time_in;
                //     scheduledTime.out = query[0].time_out
                // }
            }
        } 

        const date = `${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()}`;

        const [query] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM employee_leave_request WHERE employee_id = ? AND date = ? AND status = ?", [formData.employee_id, date, "approved"]);

        if(Number(query[0].count) > 0) {
            throw ({
                message: "Time log not allowed. The employee is currently on approved leave.",
                code: "EMPLOYEE_ON_LEAVE"
            });
        }

        const dateTimeIn = new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${scheduledTime.in}`);
        const dateTimeOut = new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${scheduledTime.out}`);

        const dateTimeInHour = dateTimeIn.getHours();
        const dateTimeOutHour = dateTimeOut.getHours();

        if(dateTimeInHour >= 12 && dateTimeInHour <= 23 && dateTimeOutHour >= 0 && dateTimeOutHour <= 11) {
            const hour = dateTimeOutHour + 24;
            dateTimeOut.setHours(hour);
        }

        const [result] = await db.query<ResultSetHeader>("INSERT INTO attendance_time_log(company_id, employee_id, timesheet_id, source, time_in, time_out, is_dayoff, scheduled_time_in, scheduled_time_out, break_time_hours, off_sched_constraint) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [token.companyId, formData.employee_id, formData.timesheet_id, formData.source, formData.timeIn, formData.timeOut || null, isDayOff, dateTimeIn, dateTimeOut, scheduledTime.break_time_hours, off_schedule_constraint]);

        if(!result.affectedRows) {
            throw ({
                message: "No time log has been recorded.",
                code: "NO_TIMELOG_RECORDED"
            });
        }

        await fetch(
            `${socketUrl}/emit/timelog_created/${token.companyId}/${formData.timesheet_id}`,
            { method: "POST" }
        );

        const resObj: TResponseObject<{success: boolean, id: number}> = {
            data: { success: true, id: result.insertId},
        }

        return Response.json(resObj);

    }
    catch(err:any) {
        console.log(err)
        if(err.message && err.code) {
            let error:TResponseError;
            switch(err.code) {
                case "ER_DUP_ENTRY":
                    error = {
                        message: "Cannot record attendance. The selected employee already has a time log for this date.",
                        code: "EMPLOYEE_HAS_TIMELOG"
                    }
                    break;
                default:
                    error = {...err}
            }

            const resObj: TResponseObject<null> = {
                error: error,
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