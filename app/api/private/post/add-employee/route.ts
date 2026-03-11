import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader } from "mysql2";
import { TResponseError, TResponseObject } from "@/app/types/TResponseObject";
import { customAlphabet, nanoid } from 'nanoid';
import { TWeeklySchedule } from "@/app/types/scheduler-table";
import {numbers} from 'nanoid-dictionary';

type TBody = {
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
    salary:             number
    address: {  
        region:         string;
        province:       string | null;
        city:           string;
        country:        string;
    }
}

export async function POST(req:NextRequest) {
    const token = await getToken({ req });
    const conn = await db.getConnection();

    try {
        const formData = await req.json() as TBody;
        
        if(!(
            token && 
            formData.first_name &&
            formData.surname &&
            formData.date_of_birth &&
            formData.sex &&
            formData.email &&
            formData.cp_number && 
            formData.marital_status && 
            formData.designation &&
            formData.citizenship &&
            formData.address && 
            formData.address.region &&
            formData.address.city && 
            formData.address.country &&
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
            
            const [address] = await conn.query<ResultSetHeader>("INSERT INTO address(country, region, province, city) VALUES(?, ?, ?, ?)", [formData.address.country, formData.address.region, formData.address.province, formData.address.city]);
            
            if(!(address.affectedRows && address.insertId)) throw new Error("Something went wrong!");
            
            const uid = customAlphabet(numbers, 8);
            const employeeUID = `EMP${new Date().getFullYear()}${uid()}`;

            const weekly_schedule:TWeeklySchedule = {
                monday: null,
                tuesday: null,
                wednesday: null,
                thursday: null,
                friday: null,
                saturday: null,
                sunday: null
            }

            const [schedule] = await conn.query<ResultSetHeader>("INSERT INTO employee_schedule(employee_id, weekly_schedule_json) VALUES(?, ?)", [employeeUID, JSON.stringify(weekly_schedule)]);
            
            if(!(schedule.affectedRows && schedule.insertId)) throw new Error("Something went wrong!");

            const [salary] = await conn.query<ResultSetHeader>("INSERT INTO employee_salary(employee_id, basis, salary) VALUES(?, ?, ?)", [employeeUID, formData.salary_basis, formData.salary]);

            if(!(salary.affectedRows && salary.insertId)) throw new Error("Something went wrong!");

            await conn.query(`
                INSERT INTO 
                    employees(employee_id, first_name, middle_name, surname, ext_name, sex, date_of_birth, cp_number, email, marital_status, citizenship, address, designation, employment_status, date_hired, schedule, salary)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [employeeUID, formData.first_name, formData.middle_name, formData.surname, formData.ext_name, formData.sex, formData.date_of_birth, formData.cp_number, formData.email, formData.marital_status, formData.citizenship, address.insertId, formData.designation, formData.employment_status, formData.date_hired, schedule.insertId, salary.insertId])
            
            await conn.query("INSERT INTO company_employees(company_id, employee_id) VALUES(?, ?)", [token.companyId, employeeUID]);

            await conn.query("INSERT INTO employee_salary(employee_id, basis, salary) VALUES(?, ?, ?)", [employeeUID, formData.salary_basis, formData.salary]);
            
            await conn.commit();
            
            const resObj: TResponseObject<{employee_id: string}> = {
                data: {employee_id: employeeUID}
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