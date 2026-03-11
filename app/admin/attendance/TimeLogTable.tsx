"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import ITimeLogFromDb from '@/app/types/timelog-from-db';
import { object, number, string, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import useDeleteModal from '@/app/components/DeleteModal/useDeleteModal';
import dayjs from 'dayjs';
import { socket } from '@/app/socket/socket';
import { AttendancePageProvider } from './StyledPage';
import { getAttendanceStatus } from '@/app/helpers/getAttendanceStatus';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Avatar,
    Chip,
    Button,
    MenuItem,
    ListItemIcon,
    CircularProgress
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

//MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const StyledTimeLogTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        min-width: 0;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`

type TEmployeesAttendanceSchedule = Record<string, { time_in_sched: string, time_out_sched: string }>;

const TimeLogTable: React.FC = () => {
    const [data, setData] = React.useState<ITimeLogFromDb[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [loadingSchedule, setLoadingSchedule] = React.useState(true);
    const [employeeSchedule, setEmployeesSchedule] = React.useState<TEmployeesAttendanceSchedule | null>(null);
    const attendancePageContex = React.useContext(AttendancePageProvider);
    
    const handleGetTimeLog = () => {
        if(attendancePageContex && attendancePageContex.activeTimesheet) {
            doApiRequest<ITimeLogFromDb[]>(
                "/api/private/get/get-time-log",
                (data) => {
                    setData([...data])
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST",
                    body: JSON.stringify({timesheet_id: attendancePageContex.activeTimesheet.id})
                }
            );
        }
    }

    const handleGetTableData = () => {
        if(attendancePageContex && attendancePageContex.activeTimesheet && attendancePageContex.activeTimesheet.id) {
            doApiRequest<{
                employeeOffScheduleWork: ({employee_id: string, time_in: string, time_out: string})[],
                employeeSchedule: ({employee_id: string, weekly_schedule_json: string})[]
            }>(
                "/api/private/get/get-timelog-employee-schedule",
                (data) => {
                    const timesheetDate = new Date(attendancePageContex.activeTimesheet?.date as string);
                    const employeeSched: TEmployeesAttendanceSchedule = {};

                    data.employeeOffScheduleWork.forEach(item => {
                        employeeSched[item.employee_id] = {time_in_sched: `${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${item.time_in}`, time_out_sched: `${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${item.time_out}`};
                    });

                    data.employeeSchedule.forEach(item => {
                        if(!(Object.keys(employeeSched).includes(item.employee_id))) {
                            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    
                            const weeklySched = JSON.parse(item.weekly_schedule_json);
                            const sched = weeklySched[days[timesheetDate.getDay()]];
    
                            console.log(sched.in)
                            employeeSched[item.employee_id] = {time_in_sched: `${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${sched.in}`, time_out_sched: `${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${sched.out}`}
                        }
                    })

                    setEmployeesSchedule(employeeSched);
                    handleGetTimeLog();
                },
                (state) => {/**Loading Logic**/},
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST",
                    body: JSON.stringify({timesheet_id: attendancePageContex.activeTimesheet.id})
                }
            )
        }
    }

    const columns = React.useMemo<MRT_ColumnDef<ITimeLogFromDb>[]>(() => [
        {
            accessorKey: 'employee_id', 
            header: 'Employee',
            id: "employee",
            enableEditing: false,
            muiTableHeadCellProps: {align: 'left'},
            Edit: () => null,
            Cell: ({ row }) => (
                <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '250px',
                    gap: '1rem',
                }}
                >
                    <Avatar src={row.original.display_picture? `/images/avatar/${row.original.display_picture}` : undefined} alt={row.original.first_name} />
                    <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    >
                        <strong style={{fontSize: "13px"}}>{`${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()} ${row.original.ext_name? row.original.ext_name.toUpperCase() : ""}`}</strong>
                        <p style={{textAlign: 'left'}}>{row.original.designation}</p>
                    </Box>
                </Box>
            ),
        },
        {
            accessorKey: 'source', 
            header: 'Source',
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Status',
            Cell: ({row}) => {
                if(attendancePageContex && employeeSchedule && employeeSchedule[row.original.employee_id]) {
                    const timesheetDate = new Date(attendancePageContex?.activeTimesheet?.date as string);
                    const scheduleTimeIn =  attendancePageContex?.activeTimesheet?.timein_schedule? new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${attendancePageContex?.activeTimesheet?.timein_schedule}`) :
                                    new Date(employeeSchedule[row.original.employee_id].time_in_sched? employeeSchedule[row.original.employee_id].time_in_sched : new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} 07:00:00`))
                    const status = getAttendanceStatus(scheduleTimeIn, new Date(row.original.time_in), Number(attendancePageContex.activeTimesheet?.threshold_late),  Number(attendancePageContex.activeTimesheet?.threshold_absent));
                    return(
                        status == "absent"?     <Chip label={"Absent w/ time-log".toUpperCase()} color='error' /> :
                        status == "late"?       <Chip label={status.toUpperCase()} color='warning' /> :
                        status == "on-time"?    <Chip label={status.toUpperCase()} color='success' /> :
                                                <Chip label={status} />
                    )
                }
            }
        },
        {
            accessorKey: 'time_in', 
            header: 'Time In',
            Cell: ({row}) => (
                <Chip icon={<AccessTimeIcon />} label={new Date(row.original.time_in).toLocaleTimeString()} />
                // <Chip icon={<AccessTimeIcon />} label={dayjs(row.original.time_in, "HH:mm:ss").format("h:mm:ss A")} />
            )
        },
        {
            accessorKey: 'time_out', 
            header: 'Time Out',
            Cell: ({row}) => {
                const d1 = new Date(dayjs(row.original.time_in).format("YYYY-MM-DD")).getTime();
                const d2 = new Date(dayjs(row.original.time_out).format("YYYY-MM-DD")).getTime();


                return d2 > d1? <Chip icon={<AccessTimeIcon />} label={`${new Date(row.original.time_out).toDateString()} ${new Date(row.original.time_out).toLocaleTimeString()}`} /> : <Chip icon={<AccessTimeIcon />} label={new Date(row.original.time_out).toLocaleTimeString()} />
                    // return <Chip icon={<AccessTimeIcon />} label={new Date(row.original.time_out).toLocaleTimeString()} />
            }
        },
    ], [data, isSaving]);

    const table = useMaterialReactTable({
            columns,
            data,
            enableStickyHeader: false,
            enableTopToolbar: false,
            enableColumnPinning: true,
            state: {
                isLoading,
                isSaving
            },
            muiTablePaperProps: {
                sx: {
                    width: '100%',
                    minWidth: 0
                },
            },
        }
    )

    React.useEffect(() => {
        setIsLoading(true)
        if(attendancePageContex && attendancePageContex.activeTimesheet) {
            handleGetTableData();
        }
    }, [attendancePageContex?.activeTimesheet]);

    React.useEffect(() => {
        if(attendancePageContex && attendancePageContex.activeTimesheet) {
            const activeTimesheet = attendancePageContex.activeTimesheet;
            if(!socket.connected) socket.connect();

            socket.on(`TIMELOG_CREATED_${activeTimesheet.company_id}_${activeTimesheet.id}`, () => {
                handleGetTableData();
            })
        }
    }, [attendancePageContex?.activeTimesheet])

    React.useEffect(() => {
        console.log(employeeSchedule)
    }, [employeeSchedule])

    return(
        <StyledTimeLogTable>
            <MaterialReactTable table={table} />
        </StyledTimeLogTable>
    )
}

export default TimeLogTable;