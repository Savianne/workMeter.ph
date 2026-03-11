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
       console.log(formData)
        if(!(token && token.companyId && formData.paid && formData.employee && formData.status && formData.id && formData.leave_type)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        if(formData.status == "approved") {
            const [query1] = await db.query<RowDataPacket[]>("SELECT yearly_credits FROM leave_types WHERE id = ?", [formData.leave_type]);

            const yearly_credits = query1[0].yearly_credits;
            const year = new Date().getFullYear();
            const startDate = `${year}-01-01`;
            const endDate = `${Number(year) + 1}-01-01`;
    
            const [query2] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM employee_leave_request AS elr WHERE elr.employee_id = ? AND elr.leave_type = ? AND status = ? AND elr.date >= ? AND elr.date < ?", [formData.employee, formData.leave_type, "approved", startDate, endDate]);
            const count = query2[0].count;
            
            if(count >= yearly_credits) throw ({
                message: "Leave request cannot be approved because the employee has no remaining yearly credits for this leave type.",
                code: "NO_LEAVE_CREDITS_AVAILABLE"
            });
        }


        const [result] = await db.query<ResultSetHeader>("UPDATE employee_leave_request SET paid = ?, status = ? WHERE id = ? AND company_id = ?", [formData.paid, formData.status, formData.id, token.companyId]);

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