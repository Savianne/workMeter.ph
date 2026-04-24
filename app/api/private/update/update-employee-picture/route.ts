import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";
import { customAlphabet, nanoid } from 'nanoid';
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import {numbers} from 'nanoid-dictionary';
import path from "path";
import fs from "fs/promises";

export async function POST(req:NextRequest) {
    
    try {
        const token = await getToken({ req });
        const data = await req.formData();
        const file = data.get("picture") as File;
        const employeeId = data.get("uid") as string;
        const conn = await db.getConnection();
        
        if(!(
            token?.companyId &&
            file && 
            employeeId
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
    
        const nanoid = customAlphabet(numbers, 10);

        const ext = path.extname(file.name); // .jpg, .png, etc.
        const newFileName = `${nanoid()}${ext}`;

        try {

            await conn.beginTransaction();

            const [employee] = await db.query<RowDataPacket[]>("SELECT display_picture FROM employees WHERE employee_id = ?", [employeeId]);

            const oldFile = employee[0].display_picture;

            if(oldFile) {
                const oldFilePath = path.join(
                    process.cwd(),
                    "public/images/avatar",
                    oldFile
                );

                try {
                    await fs.unlink(oldFilePath);
                } catch (err: any) {
                    // Ignore if file doesn't exist
                    if (err.code !== "ENOENT") {
                        throw err;
                    }
                }
            }

            const [res] = await db.query<ResultSetHeader>("UPDATE employees SET display_picture = ? WHERE employee_id = ?", [newFileName, employeeId]);

            if(!res.affectedRows) throw ({
                message: "No Record Updated",
                code: "NO_RECORD_UPDATED"
            });

            const filePath = path.join(process.cwd(), "public/images/avatar", newFileName);
        
            await fs.writeFile(filePath, buffer);

            await conn.commit();

            const resObj: TResponseObject<any> = {
                data: {
                    success: true,
                    fileInfo: {
                        name: newFileName,
                        path: "public/images/avatar",
                        employeeId
                    } 
                },
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