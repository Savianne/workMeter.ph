import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";
import { TResponseObject } from "@/app/types/TResponseObject";

export async function DELETE() {
    const cookieStore = await cookies();

    cookieStore.delete("pendingLogin");

    const resObj: TResponseObject<{ success: boolean }> = {
        data: {success: true}
    }

    return Response.json(resObj);
}