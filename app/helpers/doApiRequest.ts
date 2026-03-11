
import { TResponseObject, TResponseError } from "../types/TResponseObject";

async function doApiRequest<ResponseDataObj>(
    input: string | URL | Request,
    onSuccess: (data: ResponseDataObj) => void,
    loading: (state: boolean) => void,
    onError: (error: TResponseError) => void,
    init?: RequestInit
) {
    loading(true);

    const res = await fetch(input, init);

    try {
        if(res.status != 404) {
            try {
                const data = await res.json() as TResponseObject<ResponseDataObj>;
                if(!data.error) {
                    onSuccess(data.data);
                } else {
                    throw data.error
                }
            }
            catch(err) {
                //catch api level errors
                const error = err as TResponseError;
                throw error;
            }
        } else {
            throw ({message: "Resources not found", code: 404})
        }
    }
    catch(err) {
        const reqError = err as TResponseError
        onError(reqError); 
    }
    finally {
        loading(false);
    }
}

export default doApiRequest;