import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";


type TBody = {
    employee_id:        string,
    first_name:         string,
    middle_name:        string | null,
    surname:            string,
    ext_name:           string | null,
    date_of_birth:      string,
    sex:                string,
    email:              string,
    cp_number:          string,
    marital_status:     string,
    citizenship:         string,
    designation:        string,
    employment_status:  string,
    date_hired:         string,
    salary_basis:       string,
    salary:             number,
    address_id:         string,
    region:             string;
    province:           string | null;
    city:               string;
    country:            string;
    barangay:           string | null;
    street:             string | null;
    building:           string | null;
    zip_code:           string | null
}

export async function POST(req:NextRequest) {
    const conn = await db.getConnection();

    try {
        const formData = await req.json() as TBody;

        if(!(
            formData.employee_id &&
            formData.first_name &&
            formData.surname &&
            formData.date_of_birth &&
            formData.sex &&
            formData.email &&
            formData.cp_number && 
            formData.marital_status && 
            formData.citizenship &&
            formData.designation &&
            formData.address_id &&
            formData.region &&
            formData.city && 
            formData.country &&
            formData.employment_status &&
            formData.date_hired &&
            formData.salary_basis &&
            formData.salary
        )) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        try {

            await conn.beginTransaction();

            const [address] = await conn.query<ResultSetHeader>(`
                UPDATE address 
                    SET 
                        country = ?, 
                        region = ?, 
                        province = ?, 
                        city = ?, 
                        barangay = ?, 
                        street = ?, 
                        building = ?, 
                        zip_code = ? 
                WHERE id = ?`, 
                [
                    formData.country, 
                    formData.region, 
                    formData.province, 
                    formData.city, 
                    formData.barangay, 
                    formData.street, 
                    formData.building, 
                    formData.zip_code, 
                    formData.address_id
                ]);
    
            if(!(address.affectedRows)) throw new Error("Something went wrong!");

            await conn.query(`
                UPDATE
                    employees
                        SET 
                            first_name = ?, 
                            middle_name = ?, 
                            surname = ?, 
                            ext_name = ?, 
                            sex = ?, 
                            date_of_birth = ?, 
                            cp_number = ?, 
                            email = ?, 
                            marital_status = ?, 
                            citizenship = ?, 
                            designation = ?, 
                            employment_status = ?, 
                            date_hired = ?
                WHERE employee_id = ?
            `, [
                formData.first_name, 
                formData.middle_name, 
                formData.surname, 
                formData.ext_name, 
                formData.sex, 
                formData.date_of_birth, 
                formData.cp_number, 
                formData.email, 
                formData.marital_status, 
                formData.citizenship, 
                formData.designation, 
                formData.employment_status, 
                formData.date_hired,
                formData.employee_id
            ])
            
            await conn.query("UPDATE employee_salary SET basis = ?, salary = ? WHERE employee_id = ?", [formData.salary_basis, formData.salary, formData.employee_id]);
            
            await conn.commit();
            
            const resObj: TResponseObject<{success: boolean}> = {
                data: {success: true}
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