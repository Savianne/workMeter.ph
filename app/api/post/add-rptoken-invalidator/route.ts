import { NextRequest } from "next/server";
import { cookies } from 'next/headers';
import { TResponseObject } from "@/app/types/TResponseObject";

export async function POST(req:NextRequest) {
    const formData = await req.json();

    const cookieStore = await cookies();

    cookieStore.set({
        name: 'token_invalidator',
        value: formData.token,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 30,
    });

    const resObj: TResponseObject<{success: boolean}> = {
        data: {success: true}
    }

    return Response.json(resObj);
}