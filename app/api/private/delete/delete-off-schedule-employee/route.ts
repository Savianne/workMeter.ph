import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function DELETE(req:NextRequest) {
    const token = await getToken({ req });
   
    try {
        const formData = await req.json();

        if(!(token && formData.id && formData.employee_id && formData.timesheet_id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<ResultSetHeader>("DELETE FROM off_schedule_work_employees WHERE id = ? AND employee_id = ? AND timesheet_id = ?", [formData.id, formData.employee_id, formData.timesheet_id]);

        if(!result.affectedRows) {
            throw ({
                message: "No Record deleted",
                code: 500
            })
        }

        const resObj: TResponseObject<{success: boolean}> = {
            data: {
                success: true
            },
        }

        return Response.json(resObj);

    }
    catch(err:any) {
        console.log(err)
        if(err.message && err.code) {
            let error:TResponseError;
            switch(err.code) {
                case "ER_ROW_IS_REFERENCED_2":
                    error = {
                        message: "Cannot delete because a timelog exists for this employee. Please delete the employee's timelog before removing them from the off-work schedule.",
                        code: err.code
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