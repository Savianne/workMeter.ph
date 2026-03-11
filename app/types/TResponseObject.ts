export type TResponseError = {
    message: string,
    code?: string | number
}

export type TResponseObject<dataObj> = {
    error?: TResponseError,
    data: dataObj
}