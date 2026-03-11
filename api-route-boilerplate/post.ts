import { NextRequest } from "next/server";
// import db from "../../../mysql/connectionPool";
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {

    try {
        const formData = await req.json();

        if(!(false)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

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