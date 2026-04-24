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
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import playErrorSound from '@/app/components/helpers/playErrorSound';
import playNotifSound from '@/app/components/helpers/playNotifSound';
import validateTimeInTimeOut from '@/app/helpers/validateTimeInTimeOut';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Button,
    MenuItem,
    ListItemIcon,
    CircularProgress,
    TextField
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

//MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import computeTotalHours from '@/app/helpers/computeTotalHours';

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

interface ITimeLogTableData extends ITimeLogFromDb {
    time_in_status: "on-time" | "late" | "absent",
    time_out_status: "on-time" | "under-time" | null,
    paid_hours: string,
}

type TEmployeesAttendanceSchedule = Record<string, { time_in_sched: string, time_out_sched: string }>;

const TimeLogTable: React.FC = () => {
    const deleteModal = useDeleteModal();
    const [data, setData] = React.useState<ITimeLogTableData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const attendancePageContex = React.useContext(AttendancePageProvider);
    
    const handleGetTimeLog = () => {
        if(attendancePageContex && attendancePageContex.activeTimesheet) {
            doApiRequest<ITimeLogFromDb[]>(
                "/api/private/get/get-time-log",
                (data) => {
                    const mappedData = data.map(item => {
                        const timeInStatus = getAttendanceStatus(new Date(item.scheduled_time_in), new Date(item.time_in), Number(attendancePageContex.activeTimesheet?.threshold_late), Number(attendancePageContex.activeTimesheet?.threshold_absent))
                        const timeOutStatus = item.time_out? new Date(item.time_out).getTime() < new Date(item.scheduled_time_out).getTime()? "under-time" : "on-time" : "-------";
                        const paidHours = item.time_in && item.time_out?  String(computeTotalHours(new Date(item.time_in).toLocaleTimeString(), new Date(item.time_out).toLocaleTimeString()) - item.break_time_hours) : "-------"
                        return ({
                            ...item,
                            time_in_status: timeInStatus as "on-time" | "late" | "absent",
                            time_out_status: timeOutStatus as "on-time" | "under-time",
                            paid_hours: paidHours
                        });
                    });

                    setData([...mappedData])
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

    const handleDeleteItem = (item: string, id: string, timesheet_id: string, onDeleteSuccess: () => void) => {
        deleteModal(`${item}'s Timelog`, () => {
            return new Promise<{success: boolean}>((res, rej) => {
                doApiRequest<{success: boolean}>(
                    "/api/private/delete/delete-timelog",
                    (resdata) => {
                        onDeleteSuccess()
                        playNotifSound()
                        res(resdata)
                    },
                    (state) => {/*I love you*/},
                    (error) => {
                        playErrorSound()
                        rej(error.message)
                    },
                    {
                        method: "DELETE",
                        body: JSON.stringify({id, timesheet_id})
                    }
                )
            })
        })
    }

    const handleSetAllowOvertime = (allow: boolean, timelogData: ITimeLogTableData, timesheetId: string) => {
        const valueTimeIn = dayjs(new Date(timelogData.time_in).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss")
        const valueTimeOut = timelogData.time_out? dayjs(new Date(timelogData.time_out).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss") : null
        const timesheetDate = new Date(attendancePageContex?.activeTimesheet?.date as string || "1998-08-03");
        const timeInDate = new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${valueTimeIn}`);
        const timeOutDate = valueTimeOut? new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${valueTimeOut}`) : null;
        
        doApiRequest(
            "/api/private/update/update-timelog",
            (res) => {
                const updatedData = data.map(item => item.id == timelogData.id? {...item, is_overtime_authorized: allow} : item);
                setData([...updatedData]);
                playNotifSound();
            },
            (state) => setIsSaving(state),
            (error) => {
                playErrorSound();
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
            {
                method: "POST",
                body: JSON.stringify({
                    id: timelogData.id, 
                    timesheet_id: timesheetId, 
                    time_in: dayjs(timeInDate.toString()).format("YYYY-MM-DD HH:mm:ss"),
                    time_out: timeOutDate? dayjs(timeOutDate.toString()).format("YYYY-MM-DD HH:mm:ss") : null,
                    is_overtime_authorized: allow
                })
            }
        )
    }

    const columns = React.useMemo<MRT_ColumnDef<ITimeLogTableData>[]>(() => [
        {
            accessorKey: 'employee_id', 
            header: 'Employee',
            id: "employee",
            muiTableHeadCellProps: {align: 'left'},
            enableEditing: false,
            Edit: ({row}) => (
                <TextField disabled label="Attendee"  variant="standard" defaultValue={`${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()} ${row.original.ext_name? row.original.ext_name.toUpperCase() : ""}`}/>
            ),
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
            enableEditing: false,
            Edit: () => null,
        },
        {
            accessorKey: 'time_in', 
            header: 'Time In',
            enableEditing: true,
            Edit: ({ cell, column, row, table }) => {
                const [data, setData] = React.useState(row._valuesCache['time_in']? dayjs(row._valuesCache['time_in']).toString() : null)
                return(
                    <MobileTimePicker
                    label="Time In"
                    value={data? dayjs(data as string) : null}
                    onChange={(newValue) => {
                        row._valuesCache['time_in'] = dayjs(newValue).toString();
                        setData(newValue? newValue.toString() : null)
                    }}/>
                )
            },
            Cell: ({row}) => (
                <Chip variant="outlined" color={row.original.time_in_status == "on-time"? "success" : row.original.time_in_status == "late"? "warning" : "error"} icon={<AccessTimeIcon />} label={new Date(row.original.time_in).toLocaleTimeString()} />
            )
        },
        {
            accessorKey: 'scheduled_time_in', 
            header: 'Scheduled Time-in',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => (
                <Chip icon={<AccessTimeIcon />} label={new Date(row.original.scheduled_time_in).toLocaleTimeString()} />
            )
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Time-in Status',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                return(
                    row.original.time_in_status == "absent"?     <Chip label={"Absent w/ time-log".toUpperCase()} color='error' /> :
                    row.original.time_in_status == "late"?       <Chip label={row.original.time_in_status.toUpperCase()} color='warning' /> :
                    row.original.time_in_status == "on-time"?    <Chip label={row.original.time_in_status.toUpperCase()} color='success' /> :
                                            <Chip label={row.original.time_in_status} />
                )
            }
        },
        {
            accessorKey: 'time_out', 
            header: 'Time Out',
            enableEditing: true,
            Edit: ({ cell, column, row, table }) => {
                const [data, setData] = React.useState(row._valuesCache['time_out']? dayjs(row._valuesCache['time_out']).toString() : null)
                return(
                    <MobileTimePicker
                    label="Time out"
                    value={data? dayjs(data as string) : null}
                    onChange={(newValue) => {
                        row._valuesCache['time_out'] = dayjs(newValue).toString();
                        setData(newValue? newValue.toString() : null)
                    }}/>
                )
            },
            Cell: ({row}) => {
                if(row.original.time_out) {
                    const d1 = new Date(dayjs(row.original.time_in).format("YYYY-MM-DD")).getTime();
                    const d2 = new Date(dayjs(row.original.time_out).format("YYYY-MM-DD")).getTime();
    
                    return d2 > d1? <Chip variant="outlined" color={row.original.time_out_status == "on-time"? "success" : "warning"} icon={<AccessTimeIcon />} label={`${new Date(row.original.time_out).toDateString()} ${new Date(row.original.time_out).toLocaleTimeString()}`} /> : <Chip variant="outlined" color={row.original.time_out_status == "on-time"? "success" : "warning"} icon={<AccessTimeIcon />} label={new Date(row.original.time_out).toLocaleTimeString()} />
                } else {
                    return <Chip variant='outlined' icon={<AccessTimeIcon />} label="-- : -- : --" />
                }
            }
        },
        {
            accessorKey: 'scheduled_time_out', 
            header: 'Scheduled Time-out',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                const d1 = new Date(dayjs(row.original.scheduled_time_in).format("YYYY-MM-DD")).getTime();
                const d2 = new Date(dayjs(row.original.scheduled_time_out).format("YYYY-MM-DD")).getTime();

                return d2 > d1? <Chip icon={<AccessTimeIcon />} label={`${new Date(row.original.scheduled_time_out).toDateString()} ${new Date(row.original.scheduled_time_out).toLocaleTimeString()}`} /> : <Chip icon={<AccessTimeIcon />} label={new Date(row.original.scheduled_time_out).toLocaleTimeString()} />
            }
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Time-Out Status',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                return(
                    row.original.time_out_status == "on-time"?   <Chip label={row.original.time_out_status.toUpperCase()} color='success' /> : row.original.time_out_status == "under-time"? <Chip label={row.original.time_out_status.toUpperCase()} color='warning' /> : <Chip label={row.original.time_out_status} />
                )
            }
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Paid Hours',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                return(
                    Number(row.original.paid_hours).toFixed(2)
                )
            }
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Unpaid Break hour(s)',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                return(
                    row.original.break_time_hours
                )
            }
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Overtime',
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => {
                return(
                    row.original.is_overtime_authorized?  (Number(row.original.paid_hours) - 8) > 0? (Number(row.original.paid_hours) - 8).toFixed(2) : "0" : "unauthorized"
                )
            }
        },
    ], [data, isSaving]);

    const table = useMaterialReactTable({
            columns,
            data,
            enableStickyHeader: false,
            enableTopToolbar: false,
            enableColumnPinning: true,
            enableEditing: true,
            state: {
                isLoading,
                isSaving
            },
            muiTablePaperProps: {
                elevation: 0,
                sx: {
                    width: '100%',
                    minWidth: 0
                },
            },
            onEditingRowSave: async ({ table, values, row, exitEditingMode }) => {
                const originalTimeIn = dayjs(new Date(row.original.time_in).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss")
                const originalTimeOut = row.original.time_out? dayjs(new Date(row.original.time_out).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss") : null;
                const valueTimeIn = dayjs(new Date(values.time_in).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss")
                const valueTimeOut = values.time_out? dayjs(new Date(values.time_out).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss") : null
                
                if(!(originalTimeIn == valueTimeIn && originalTimeOut == valueTimeOut)) {
                    const timesheetDate = new Date(attendancePageContex?.activeTimesheet?.date as string || "1998-08-03");
                    const timeInDate = new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${valueTimeIn}`);
                    const timeOutDate = valueTimeOut? new Date(`${timesheetDate.getFullYear()}-${timesheetDate.getMonth() + 1}-${timesheetDate.getDate()} ${valueTimeOut}`) : null;

                    try {
                        const timeLog = timeOutDate? (await validateTimeInTimeOut(timeInDate, timeOutDate)).result : {time_in: timeInDate, time_out: null};
    
                        doApiRequest(
                            "/api/private/update/update-timelog",
                            (res) => {
                                const updatedData = [...data];
                                const timeInStatus = getAttendanceStatus(new Date(row.original.scheduled_time_in), timeInDate, Number(attendancePageContex?.activeTimesheet?.threshold_late), Number(attendancePageContex?.activeTimesheet?.threshold_absent))
                                const timeOutStatus = timeOutDate? timeOutDate.getTime() < new Date(row.original.scheduled_time_out).getTime()? "under-time" : "on-time" : null;
                                const paidHours = valueTimeIn && valueTimeOut?  String(computeTotalHours(valueTimeIn, valueTimeOut) - row.original.break_time_hours) : "-------";

                                updatedData[row.index] = {
                                    ...row.original,
                                    paid_hours: paidHours,
                                    time_in_status: timeInStatus,
                                    time_out_status: timeOutStatus,
                                    time_in: dayjs(timeInDate.toString()).format("YYYY-MM-DD HH:mm:ss"),
                                    time_out: timeOutDate? dayjs(timeOutDate.toString()).format("YYYY-MM-DD HH:mm:ss") : null
                                };
    
                                console.log(updatedData)
                                setData(updatedData);
                                playNotifSound();
                                enqueueSnackbar("Update Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                                table.setEditingRow(null);
                            },
                            (state) => setIsSaving(state),
                            (error) => {
                                playErrorSound();
                                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                            },
                            {
                                method: "POST",
                                body: JSON.stringify(
                                    {
                                        id: row.original.id, 
                                        timesheet_id: attendancePageContex?.activeTimesheet?.id, 
                                        time_in: dayjs(timeLog.time_in.toString()).format("YYYY-MM-DD HH:mm:ss"),
                                        time_out: timeLog.time_out? dayjs(timeLog.time_out.toString()).format("YYYY-MM-DD HH:mm:ss") : null,
                                        is_overtime_authorized: row.original.is_overtime_authorized
                                    }
                                )
                            }
                        )
                    }
                    catch(err:any) {
                        if(err.error) {
                            playErrorSound()
                            enqueueSnackbar(err.error, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
                        } else {
                            enqueueSnackbar("Validation error, please check your input!", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
                        }
                    }
                } else {
                    table.setEditingRow(null);
                    return;
                }
            },
            onEditingRowCancel: async ({ table, row }) => {
                row._valuesCache['time_in'] = row.original.time_in;
                row._valuesCache['time_out'] = row.original.time_out
            },
            renderRowActionMenuItems: ({ closeMenu, row }) => [
                <MenuItem
                key={1}
                sx={{ m: 0 }}
                onClick={() => {
                    handleDeleteItem(
                        `${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()} ${row.original.ext_name? row.original.ext_name.toUpperCase() : ""}`, 
                        String(row.original.id), 
                        attendancePageContex?.activeTimesheet?.id as string, 
                        () => {
                            const newData = [...data.filter(item => item.id != row.original.id)];
                            setData(newData);
                        }
                    )
                    closeMenu()
                }}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    Delete
                </MenuItem>, 
                row.original.is_overtime_authorized?
                <MenuItem
                key={2}
                sx={{ m: 0 }}
                onClick={() => handleSetAllowOvertime(false, row.original, String(row.original.timesheet_id))}>
                    <ListItemIcon>
                        <GppMaybeIcon />
                    </ListItemIcon>
                    Un-authorize Overtime
                </MenuItem> :
                <MenuItem
                key={2}
                sx={{ m: 0 }}
                onClick={() => handleSetAllowOvertime(true, row.original, String(row.original.timesheet_id))}>
                    <ListItemIcon>
                        <VerifiedUserIcon />
                    </ListItemIcon>
                    Authorize Overtime
                </MenuItem> 
            ],
            // renderRowActions: ({ row, table }) => (
            //     <Box sx={{ display: 'flex', gap: '1rem' }}>
            //         <Tooltip title="Edit">
            //         <IconButton onClick={() => table.setEditingRow(row)}>
            //             <EditIcon />
            //         </IconButton>
            //         </Tooltip>
            //         <Tooltip title="Delete">
            //             <IconButton color="error" 
            //             onClick={() => 
            //                 handleDeleteItem(
            //                     `${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()} ${row.original.ext_name? row.original.ext_name.toUpperCase() : ""}`, 
            //                     String(row.original.id), 
            //                     attendancePageContex?.activeTimesheet?.id as string, 
            //                     () => {
            //                         const newData = [...data.filter(item => item.id != row.original.id)];
            //                         setData(newData);
            //                     }
            //                 )
            //             }>
            //                 <DeleteIcon />
            //             </IconButton>
            //         </Tooltip>
            //         <Tooltip title="Allow Overtime">
            //             <IconButton />
            //         </Tooltip>
            //     </Box>
            // )
        }
    )

    React.useEffect(() => {
        handleGetTimeLog()
    }, [attendancePageContex?.activeTimesheet]);

    React.useEffect(() => {
        if(attendancePageContex && attendancePageContex.activeTimesheet) {
            const activeTimesheet = attendancePageContex.activeTimesheet;
            if(!socket.connected) socket.connect();

            socket.on(`TIMELOG_CREATED_${activeTimesheet.company_id}_${activeTimesheet.id}`, () => {
                handleGetTimeLog();
            })
        }
    }, [attendancePageContex?.activeTimesheet])

    return(
        <StyledTimeLogTable>
            <MaterialReactTable table={table} />
        </StyledTimeLogTable>
    )
}

export default TimeLogTable;