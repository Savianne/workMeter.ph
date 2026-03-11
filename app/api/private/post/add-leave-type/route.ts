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

        if(!(token && token.companyId && formData.title && formData.yearly_credits && formData.paid)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const [result] = await db.query<ResultSetHeader>("INSERT INTO leave_types (company_id, title, yearly_credits, paid) VALUES(?, ?, ?, ?)", [token.companyId, formData.title, formData.yearly_credits, formData.paid]);

        if(!result.affectedRows) {
            throw ({
                message: "No Record Inserted",
                code: 500
            })
        }

        const resObj: TResponseObject<any> = {
            data: {
                id: result.insertId,
                ...formData,
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