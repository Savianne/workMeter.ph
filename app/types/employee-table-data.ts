import {Dayjs} from "dayjs";
export type EmployeeTableData = {
    employee_id: string;
    first_name: string,
    middle_name: string | null,
    surname: string,
    ext_name: string | null
    date_of_birth: string | Dayjs,
    employment_status: string,
    date_hired: string | Dayjs,
    sex: string,
    email: string,
    cp_number: string,
    marital_status: string,
    citizenship: string,
    display_picture: string | null;
    designation: string,
    salary_basis: "monthly" | "daily" | "hourly",
    salary: number
}