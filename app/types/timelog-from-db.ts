interface ITimeLogFromDb {
    id: number;
    company_id: string,
    employee_id: string,
    timesheet_id: number;
    first_name: string;
    middle_name: string | null;
    surname: string;
    ext_name: string | null;
    display_picture: string | null;
    designation: string;
    source: string,
    time_in: string,    
    time_out: string | null,
    scheduled_time_out: string,
    scheduled_time_in: string,
    is_overtime_authorized: boolean;
    is_dayoff: boolean,
    break_time_hours: number
}

export default ITimeLogFromDb;