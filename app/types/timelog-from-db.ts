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
    time_out: string,
}

export default ITimeLogFromDb;