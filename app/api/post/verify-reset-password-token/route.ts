import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { TResponseObject } from "@/app/types/TResponseObject";

type TTokenData = {
    account: {
        email: string,
        userName: string,
        uid: string
    },
    expDate: Date,
    iat: number,
    exp: number
}

export async function POST(req:NextRequest) {
    const formData = await req.json();

    try {
        if(formData.token) {
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

        const resObj: TResponseObject<null> = {
            error: {...err},
            data: null
        }
        return Response.json(resObj, {status: 500});
    }

}