type TLeaveRequestFromDB = {
    id: string;
    employee_id: string;
    first_name: string;
    middle_name: string | null;
    surname: string;
    ext_name: string | null;
    display_picture: string | null;
    designation: string;
    date: string;
    paid: "paid" | "not-paid";
    status: "pending" | "approved" | "denied";
    title: string;
    leave_type: string
}

export default TLeaveRequestFromDB;