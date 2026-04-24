interface ITimesheet {
    title: string;
    date: string;
    time_schedule: {
        in: string,
        out: string,
        break_time_hours: number,
        work_hours: number
    } | null;
    threshold_late: number;
    threshold_absent: number;
}


export interface ITimesheetFromDB extends ITimesheet {
    id: number | string,
    company_id: string
}

export default ITimesheet;