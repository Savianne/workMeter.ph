import { cookies } from "next/headers";
import { TResponseObject } from "@/app/types/TResponseObject";

export async function GET() {
    const cookieStore = await cookies();

    const invalidatorToken = cookieStore.get("token_invalidator")?.value

    const resObj: TResponseObject<{invalidatorToken: string | undefined}> = {
        data: {invalidatorToken}
    }

    return Response.json(resObj);

}