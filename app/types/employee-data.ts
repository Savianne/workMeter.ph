import {Dayjs} from "dayjs";

export type EmployeeData = {
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
    salary_basis: "monthly" | "daily" | "hourly",
    salary: number,
    display_picture: string | null;
    designation: string,
    address_id: string,
    country: string,
    region: string,
    province: string,
    city: string,
    barangay: string,
    street: string | null,
    building: string | null,
    zip_code: string | null
}