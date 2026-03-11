import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import db from "../../../mysql/connectionPool";
import { ResultSetHeader } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";
import { generateAccountUID } from "@/app/helpers/generateUID";

export async function POST(req:NextRequest) {
    const token = await getToken({ req });
    const conn = await db.getConnection();

    try {
        const formData = await req.json();

        if(!(token && formData.companyName && formData.natureOfBusiness && formData.address)) throw ({
            message: "Missing required data",
            code: "MISSING_DATA"
        })

        try {

            await conn.beginTransaction();

            const [address] = await conn.query<ResultSetHeader>("INSERT INTO address(country, region, province, city) VALUES(?, ?, ?, ?)", [formData.address.country, formData.address.region, formData.address.province, formData.address.city]);
    
            if(!(address.affectedRows && address.insertId)) throw new Error("Something went wrong!");

            const companyId = generateAccountUID();

            await conn.query("INSERT INTO company(company_id, company_name, nature_of_business, address) VALUES(?, ?, ?, ?)", [companyId, formData.companyName, formData.natureOfBusiness, address.insertId]);

            
            if(token.loginType == "credentials") {
                await conn.query("UPDATE accounts SET account_status = ?, company = ?, account_type = ? WHERE uid = ?", ["completed", companyId, "admin", token.uid]);
            } else {
                await conn.query("UPDATE google_auth_accounts SET account_status = ?, company = ?, account_type = ? WHERE uid = ?", ["completed", companyId, "admin", token.uid]);
            }

            await conn.commit();
            
            const resObj: TResponseObject<{success: boolean, companyId: string}> = {
                data: {success: true, companyId }
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