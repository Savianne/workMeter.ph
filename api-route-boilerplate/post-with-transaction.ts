import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import db from "../app/api/mysql/connectionPool";
import { ResultSetHeader } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";
import { customAlphabet, nanoid } from 'nanoid';
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import {numbers} from 'nanoid-dictionary';

export async function POST(req:NextRequest) {
    const token = await getToken({ req });
    const conn = await db.getConnection();

    try {
        const formData = await req.json();
        
        if(!(
            false
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        try {

            await conn.beginTransaction();

            

            await conn.commit();
            
            const resObj: TResponseObject<any> = {
                data: {}
            }

            return Response.json(resObj);
        }
        catch(err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    catch(err: any) {
        console.log(err)
        if(err.message && err.code) {
            let error:TResponseError;
            switch(err.code) {
                case "ER_DUP_ENTRY":
                    error = {
                        code: err.code,
                        message: err.message.includes("email")? `Duplicate Entry on email` :  err.message.includes("cp_number")? `Duplicate Entry on CP Number` : "Duplicate entry"
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