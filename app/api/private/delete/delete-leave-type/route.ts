import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function DELETE(req:NextRequest) {
    const token = await getToken({ req });
   
    try {
        const formData = await req.json();

        if(!(token && formData.id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        try {
            const [result] = await db.query<ResultSetHeader>("DELETE FROM leave_types WHERE id = ? AND company_id = ?", [formData.id, token.companyId]);
    
            if(!result.affectedRows) {
                throw ({
                    message: "No Record deleted",
                    code: 500
                })
            }
        }
        catch(err:any) {
            if(err.code && (err.code as string).includes("ER_ROW_IS_REFERENCED")) {
                const [result] = await db.query<ResultSetHeader>("UPDATE leave_types SET is_deleted = ? WHERE id = ? AND company_id = ?", [1, formData.id, token.companyId]);

                if(!result.affectedRows) {
                    throw ({
                        message: "No Record deleted",
                        code: 500
                    })
                }
            } else {
                throw ({
                    message: "Internal server error",
                    code: "500"
                });
            }
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