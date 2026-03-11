import { getToken } from "next-auth/jwt";
import db from "../../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";
import { TResponseObject, TResponseError } from "@/app/types/TResponseObject";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = await getToken({ req });
    
    try {
        const formData = await req.json();

        if(!(formData.employee_id)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        const [rows] = await db.query<RowDataPacket[]>(`
            SELECT 
                company_id, ce.employee_id, first_name, middle_name, surname, ext_name, sex, employment_status, date_hired, date_of_birth, cp_number, email, marital_status, citizenship, designation, basis AS salary_basis, es.salary, display_picture, a.id AS address_id, country, region, province, city, barangay, street, building, zip_code 
            FROM company_employees AS ce 
                JOIN employees AS e ON ce.employee_id = e.employee_id 
                JOIN address AS a ON e.address = a.id 
                JOIN employee_salary AS es ON es.employee_id = e.employee_id
            WHERE ce.company_id = ? AND e.employee_id = ?
        `, [token?.companyId, formData.employee_id]);
    
        const resObj: TResponseObject<any> = {
            data: rows[0]
        }
    
        return NextResponse.json(resObj);
    } 
    catch(err: any) {
        console.log(err)
        if(err.message && err.code) {
            const resObj: TResponseObject<null> = {
                error: {...err},
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