import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { TResponseObject } from "@/app/types/TResponseObject";
import db from "../../mysql/connectionPool";
import { RowDataPacket } from "mysql2";

type TTokenData = {
    accountDetails: {
        email: string,
        username: string,
        password: string
    },
    expDate: Date,
    iat: number,
    exp: number
}

export async function POST(req:NextRequest) {
    try {
        const formData = await req.json();
    
        if(formData.token) {
            const [rows] = await db.query<RowDataPacket[]>(
                "SELECT * FROM validator_token WHERE token = ?",
                [formData.token]
            );

            if(!(rows.length)) throw({
                message: "Invalid Token",
                code: "INVALID_TOKEN"
            });

            const access_token_secret = process.env.ACCESS_TOKEN_SECRET as string;

            try {
                const data = jwt.verify(formData.token, access_token_secret);
                
                const resObj: TResponseObject<TTokenData> = {
                    data: data as TTokenData
                }

                return Response.json(resObj);
            }
            catch(err) {
                throw ({
                    message: "Invalid token or token expired!",
                    code: "INVALID_TOKEN"
                })
            }
        } else {
            throw ({
                message: "No Token Recieved",
                code: "NO_TOKEN"
            })
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