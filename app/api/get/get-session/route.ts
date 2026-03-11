import { cookies } from "next/headers";
import { Session } from "next-auth";
import { TResponseObject } from "@/app/types/TResponseObject";
import jwt from "jsonwebtoken";

export async function GET() {
    const cookieStore = await cookies();

    const sessionToken = cookieStore.get("google_auth_token")?.value;

    try {
        if(!sessionToken) throw "";
    
        // const resObj: TResponseObject<Session> = {
        //     data: {
        //         user: {

        //         }
        //     }
        // }
    
        // return Response.json(resObj);

    }
    catch(err) {
        console.log(err);
        const resObj: TResponseObject<null> = {
            data: null,
            error: {message: "Internal Server Error", code: 500}
        }

        return Response.json(resObj);
    }

}