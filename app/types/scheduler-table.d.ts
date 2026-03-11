type TDaySchedule = {
    in: string,
    out: string
}

export type TWeeklySchedule = {
    monday: TDaySchedule | "dayoff" | null;
    tuesday: TDaySchedule | "dayoff" | null;
    wednesday: TDaySchedule | "dayoff" | null;
    thursday: TDaySchedule | "dayoff" | null;
    friday: TDaySchedule | "dayoff" | null;
    saturday: TDaySchedule | "dayoff" | null;
    sunday: TDaySchedule | "dayoff" | null;
}

export type TSchedulerTable = {
    employee_id: string;
    first_name: string,
    middle_name: string | null,
    surname: string,
    ext_name: string | null,
    display_picture: string | null,
    weekly_schedule: TWeeklySchedule
}