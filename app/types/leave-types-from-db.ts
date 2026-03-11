interface ILeaveTypes {
    title: string;
    yearly_credits: number;
    paid: "paid" | "not-paid";
}


export interface ILeaveTypesFromDB extends ILeaveTypes {
    id: number | string,
}

export default ILeaveTypes