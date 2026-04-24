import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

const days = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

export async function POST(req:NextRequest) {
    const token = await getToken({ req });
    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.employee_id && formData.date && formData.paid && formData.status && formData.leave_type)) throw ({
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
                message: "Leave request cannot be added because the employee is not active.",
                code: "INACTIVE_EMPLOYEE"
            });
        }

        const weeklySchedule = JSON.parse(query1[0].weekly_schedule_json);
        
        const scheduleForThisDate = weeklySchedule[`${days[new Date(formData.date).getDay()]}`];

        switch(scheduleForThisDate) {
            case "dayoff":
            throw ({
                message: "Leave cannot be filed because the employee is scheduled for a Day Off on the selected date.",
                code: "IS_DAYOFF"
            });
            case null:
            throw ({
                message: "Leave cannot be filed because the employee has no schedule for the selected date.",
                code: "NO_SCHED"
            });
        }

        if(formData.status == "approved") {
            const [query1] = await db.query<RowDataPacket[]>("SELECT yearly_credits FROM leave_types WHERE id = ?", [formData.leave_type]);
            
            const yearly_credits = query1[0].yearly_credits;
            const year = new Date().getFullYear();
            const startDate = `${year}-01-01`;
            const endDate = `${Number(year) + 1}-01-01`;
            
            const [query2] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM employee_leave_request AS elr WHERE elr.employee_id = ? AND elr.leave_type = ? AND status = ? AND elr.date >= ? AND elr.date < ?", [formData.employee_id, formData.leave_type, "approved", startDate, endDate]);
            const count = query2[0].count;
            
            if(count >= yearly_credits) throw ({
                message: "No available yearly leave credits for this leave type.",
                code: "NO_LEAVE_CREDITS_AVAILABLE"
            });
        }

        const [result] = await db.query<ResultSetHeader>("INSERT INTO employee_leave_request (company_id, employee_id, date, status, paid, leave_type) VALUES(?, ?, ?, ?, ?, ?)", [token.companyId, formData.employee_id, formData.date, formData.status, formData.paid, formData.leave_type]);

        if(!result.affectedRows) {
            throw ({
                message: "No Record Inserted",
                code: 500
            })
        }

        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                e.first_name, 
                e.middle_name, 
                e.surname, 
                e.ext_name, 
                e.display_picture, 
                e.designation, 
                e.employee_id, 
                elr.id,
                elr.date, 
                elr.paid, 
                elr.status, 
                lt.title,
                elr.leave_type
            FROM employee_leave_request AS elr 
            JOIN employees AS e ON e.employee_id = elr.employee_id 
            JOIN leave_types AS lt ON lt.id = elr.leave_type 
                WHERE elr.company_id = ? AND elr.id = ?;
        `, [token?.companyId, result.insertId]);

        const resObj: TResponseObject<any> = {
            data: rows[0],
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