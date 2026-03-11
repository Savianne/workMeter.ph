interface ITimesheet {
    title: string;
    date: string;
    timein_schedule?: string | null;
    threshold_late: number;
    threshold_absent: number;
}


export interface ITimesheetFromDB extends ITimesheet {
    id: number | string,
    company_id: string
}

export default ITimesheet;