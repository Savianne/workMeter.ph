import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function DELETE(req:NextRequest) {
    const token = await getToken({ req });
   
    try {
        const formData = await req.json();

        if(!(token && token.companyId && formData.timesheet_id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<ResultSetHeader>("DELETE FROM timesheet WHERE id = ? AND company_id = ?", [formData.timesheet_id, token.companyId]);

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
        if(err.message && err.code) {
            let error:TResponseError;
            switch(err.code) {
                case "ER_ROW_IS_REFERENCED_2":
                    error = {
                        message: "Deletion failed. This timesheet has existing timelog entries. Please remove them first.",
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