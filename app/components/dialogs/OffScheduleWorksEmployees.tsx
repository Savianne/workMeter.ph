"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import TLeaveRequestFromDB from '@/app/types/leave-request-from-db';
import { ValidationError } from 'yup';
import debounce from "lodash/debounce";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import EmployeeSelect, { EmployeeSelectData } from '../EmployeeSelect';
import { enqueueSnackbar } from 'notistack';
import LeaveTypeSelector from '../LeaveTypeSelect';
import { DatePicker } from '@mui/x-date-pickers';
import { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import dayjs from 'dayjs';
import doApiRequest from '@/app/helpers/doApiRequest';
import { ITimesheetFromDB } from '@/app/types/timesheet';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker'
import playErrorSound from '../helpers/playErrorSound';
import playNotifSound from '../helpers/playNotifSound';
import computeTotalHours from '@/app/helpers/computeTotalHours';

import { 
    Box,
    Button,
    IconButton,
    Alert,
    AlertTitle,
    Dialog,
    Skeleton,
    Tooltip,
    TextField,
    Divider,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Collapse,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Avatar,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { IStyledFC } from '@/app/types/IStyledFC';

interface IOffScheduleEmployeesDataFromDb {
    designation: string;
    display_picture: string | null;
    employee_id: string;
    ext_name: string | null;
    first_name: string;
    surname: string;
    middle_name: string | null;
    id: string;
    time_in: string;
    time_out: string;
}

interface IOffScheduleWorksEmployeesDialog {
    container?: any,
    state: boolean,
    timesheet: ITimesheetFromDB,
    onClose: () => void,
    onSuccess?: (data: TLeaveRequestFromDB) => void,
    onError?: (error: string) => void
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: 0,
    },
}));

const Form = styled(Box)`
    && {
        position: relative;
        display: flex;
        min-width: 0;
        flex-wrap: wrap;
        padding: 20px;
        gap: 5px;

        > .row {
            display: flex;
            flex: 0 1 100%;
            flex-wrap: wrap;
            gap: 5px;
            justify-content: center;
            
            /* > .input {
                flex: 0 1 500px;
            } */
        }
        
        > .select-employee {
            display: flex;
            flex: 0 1 100%;
            /* position: sticky; */
            flex-wrap: wrap;
            gap: 10px;
            /* top: 0; */
            background-color: ${props => props.theme.palette.background.paper};
            z-index: 10;
            padding: 10px;

            .collapes {
                width: 100%;

                .input-container {
                    width: 100%;

                    h4 {
                        padding: 0 0 15px 0;
                    }

                    .container {
                        display: flex; 
                        width: 100%; 
                        gap: 15px; 
                        flex-wrap: wrap;
                        
                        > .input-area {
                            display: flex;
                            flex: 0 1 400px;
                            gap: 15px;
                            flex-wrap: wrap;
                            
                            > .row {
                                flex: 0 1 100%;
                            }
                        }

                        > .conputed-values-area {
                            display: flex;
                            padding: 15px;
                            flex-wrap: wrap;
                            flex: 1;

                            > .data {
                                display: flex;
                                align-items: center;
                                flex: 0 1 100%;

                                > strong {
                                    margin-left: auto;
                                    font-size: 13px;
                                }
                            }
                        }
                    }
                }
            }
        }

        > .no-record {
            display: flex;
            flex: 0 1 100%;
            height: 100px;
            align-items: center;
            justify-content: center;

            > strong {
                font-size: 14px;
                text-align: center;
                width: 60%;
                opacity: 0.5;
            }
        }
    }
`

const OffScheduleWorkEmployees: React.FC<IOffScheduleWorksEmployeesDialog> = ({
    container,
    state,
    onClose,
    onSuccess,
    onError,
    timesheet
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedEmployee, setSelectedEmployee] = React.useState<null | EmployeeSelectData>(null);
    const [schedule, setSchedule] = React.useState<{timeIn: string | null, timeOut: string | null, break_time_hours: number | null}>({timeIn: null, timeOut: null, break_time_hours: null})
    const [list, setList] = React.useState<IOffScheduleEmployeesDataFromDb[]>([]);
    const [isAdding, setIsAdding] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showInfo, setShowInfo] = React.useState(true);
    const [totalHours, setTotalHours] = React.useState(0);

    const handleAdd = async () => {
        if(selectedEmployee && timesheet && schedule.timeIn && schedule.timeOut) {
            const selectedTimeIn = dayjs(new Date(schedule.timeIn).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");
            const selectedTimeOut = dayjs(new Date(schedule.timeOut).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");
           
            const dateTimeIn = new Date(`1998-08-03 ${selectedTimeIn}`);
            const dateTimeOut = new Date(`1998-08-03 ${selectedTimeOut}`);

            const dateTimeInHour = dateTimeIn.getHours();
            const dateTimeOutHour = dateTimeOut.getHours();

            if(dateTimeInHour >= 12 && dateTimeInHour <= 23 && dateTimeOutHour >= 0 && dateTimeOutHour <= 11) {
                const hour = dateTimeOutHour + 24;
                dateTimeOut.setHours(hour);
            }

            if(dateTimeOut.getTime() < dateTimeIn.getTime()) {
                playErrorSound();
                return enqueueSnackbar("Time-out cannot be earlier than time-in.", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }

            const diff = dateTimeOut.getTime() - dateTimeIn.getTime();

            const thirtyMinutes = 60 * 60 * 1000;

            if (!(diff >= thirtyMinutes)) {
                playErrorSound();
                return enqueueSnackbar(
                    "Time-out must be at least 1 hour after time-in.",
                    { variant: "warning", anchorOrigin: { vertical: "top", horizontal: "center" } }
                );
            }

            if(Number(schedule.break_time_hours) < 0 || Number(schedule.break_time_hours) > 5) {
                playErrorSound();
                return enqueueSnackbar(
                    "Break time must be greater than or equal to 0 and less than 5 hours.",
                    { variant: "warning", anchorOrigin: { vertical: "top", horizontal: "center" } }
                );
            }
            const totalHours = computeTotalHours(new Date(schedule.timeIn).toLocaleTimeString(), new Date(schedule.timeOut).toLocaleTimeString());

            const workHour = totalHours - (schedule.break_time_hours || 0);

            if(workHour < 1) {
                playErrorSound();
                return enqueueSnackbar(
                    "The total work duration must be greater than 1 hour to proceed.",
                    { variant: "warning", anchorOrigin: { vertical: "top", horizontal: "center" } }
                );
            }

            doApiRequest<{id: string}>(
                "/api/private/post/add-off-schedule-employee",
                (data) => {
                    playNotifSound();
                    enqueueSnackbar("Add Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}});
                    setList([...list, {...selectedEmployee, id: data.id, time_in: selectedTimeIn || "07:00:00", time_out: selectedTimeOut || "16:00:00"}]);
                    setSchedule({timeIn: null, timeOut: null, break_time_hours: 0});
                    setSelectedEmployee(null);
                },
                (state) => setIsAdding(state),
                (error) => enqueueSnackbar(error.message, {variant: error.code == "EMPLOYEE_HAS_SCHED" || error.code == "EMPLOYEE_IN_LIST"? "warning" : 'error', anchorOrigin: {vertical: "top", horizontal: "center"}}),
                {
                    method: 'POST',
                    body: JSON.stringify({employee_id: selectedEmployee?.employee_id, timesheet_id: timesheet.id, timesheet_date: timesheet.date, time_in: selectedTimeIn, time_out: selectedTimeOut, break_time_hours: schedule.break_time_hours, work_hours: workHour})
                }
            )
        }
    }

    React.useEffect(() => {
        if(state) {
            doApiRequest<IOffScheduleEmployeesDataFromDb[]>(
                "/api/private/get/get-off-schedule-work-employees",
                (data) => setList(data),
                (state) => setIsLoading(state),
                (error) => enqueueSnackbar(error.message, {variant: 'error', anchorOrigin: {vertical: "top", horizontal: "center"}}),
                {
                    method: "POST",
                    body: JSON.stringify({timesheet_id: timesheet.id})
                }
            )
        }
    }, [timesheet, state])

    React.useEffect(() => {
        if(schedule && schedule.timeIn && schedule.timeOut && Number(schedule.break_time_hours) >= 0) {
            const totalHours = computeTotalHours(new Date(schedule.timeIn).toLocaleTimeString(), new Date(schedule.timeOut).toLocaleTimeString());
            setTotalHours(totalHours)
        } else {
            setTotalHours(0)
        }
    }, [schedule]);
    
    return(
        <React.Fragment>
            <BootstrapDialog
                container={container}
                fullScreen={fullScreen}
                maxWidth="md"
                open={state}
                slots={{
                    transition: Transition,
                }}
                onClose={() => {
                    setSelectedEmployee(null);
                    onClose();
                }}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: 'center' }} id="customized-dialog-title">
                    Off Schedule Employees
                    {
                        !showInfo? <InfoOutlineIcon sx={{marginLeft: "10px"}} onClick={() => setShowInfo(true)} /> : ""
                    }
                </DialogTitle>
                <IconButton
                aria-label="close"
                onClick={() => {
                    setSelectedEmployee(null);
                    onClose();
                }}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                    <Form>
                        <Collapse in={showInfo}>
                            <Alert severity="info" onClose={() => setShowInfo(false)}>
                                <AlertTitle>Off Schedule Employees</AlertTitle>
                                The system does not allow employees who are on Day Off or have no assigned schedule to create time logs. To allow time logging, you must manually specify and authorize those employees here.
                            </Alert>

                        </Collapse>
                        <div className="row select-employee">
                            <EmployeeSelect value={selectedEmployee} onChange={(e) => setSelectedEmployee(e)} />
                            <Collapse className='collapes' in={!!selectedEmployee}>
                                <div className='input-container'>
                                    <h4>Time Settings</h4>
                                    <Box className="container">
                                        <div className="input-area">
                                            <div className="row">
                                                <MobileTimePicker
                                                label="Time-in Schedule"
                                                views={['hours', "minutes"]}
                                                orientation='landscape'
                                                slotProps={{
                                                    field: { clearable: false }, 
                                                    textField: {
                                                        sx: {flex: 1},
                                                        fullWidth: true
                                                    },
                                                    dialog: {
                                                        sx: { zIndex: 2000},
                                                    },
                                                }} 
                                                value={schedule.timeIn? dayjs(schedule.timeIn) : null}
                                                onChange={(e) => setSchedule({...schedule, timeIn: e? dayjs(e).toISOString() : null})}
                                                onAccept={(e) => {
                                                    setSchedule({...schedule, timeIn: e? dayjs(e).toISOString() : null});
                                                }}
                                                />
                                            </div>
                                            <div className="row">
                                                <MobileTimePicker
                                                label="Time-Out Schedule"
                                                views={['hours', "minutes"]}
                                                orientation='landscape'
                                                slotProps={{
                                                    field: { clearable: false }, 
                                                    textField: {
                                                        sx: {flex: 1},
                                                        fullWidth: true
                                                    },
                                                    dialog: {
                                                        sx: { zIndex: 2000},
                                                    },
                                                }} 
                                                value={schedule.timeOut? dayjs(schedule.timeOut) : null}
                                                onChange={(e) => setSchedule({...schedule, timeOut: e? dayjs(e).toISOString() : null})}
                                                onAccept={(e) => {
                                                    setSchedule({...schedule, timeOut: e? dayjs(e).toISOString() : null});
                                                }}
                                                />
                                            </div>
                                            <div className="row">
                                                <TextField fullWidth type='number' label="Total Breaktime Hour(s)" 
                                                value={schedule.break_time_hours || 0} 
                                                onChange={(e) => {
                                                    setSchedule({...schedule, break_time_hours: +e.target.value});
                                                }}/>
                                            </div>
                                        </div>
                                        <Paper className="conputed-values-area">
                                            <Chip sx={{flex: "0 1 100%"}} label="Paid Work Hour(s) = Total hour(s) - Breaktime hour(s)"/>
                                            <div className="data">
                                                <h6>Total Hour(s) between time-in and time-out:</h6>
                                                <strong>{totalHours}</strong>
                                            </div>
                                            <div className="data">
                                                <h6>Total Breaktime hour(s):</h6>
                                                <strong>{schedule.break_time_hours || 0}</strong>
                                            </div>
                                            <div className="data" style={{color: totalHours - Number(schedule.break_time_hours || 0) < 1? "red": "inherit"}}>
                                                <h6>Work Hour(s):</h6>
                                                <strong>{totalHours - Number(schedule.break_time_hours || 0)}</strong>
                                            </div>
                                        </Paper>
                                    </Box>
                                </div>
                                <Button sx={{background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)", color: "#fff", marginTop: "10px"}} fullWidth variant='contained' loading={isAdding} disabled={selectedEmployee === null || schedule.timeIn == null || schedule.timeOut == null} onClick={handleAdd}>Add</Button>
                            </Collapse>
                        </div>
                        {
                            isLoading? <>
                                <div className="row">
                                    <ItemSkeleton />
                                </div>
                                <div className="row">
                                    <ItemSkeleton />
                                </div>
                                <div className="row">
                                    <ItemSkeleton />
                                </div>
                                <div className="row">
                                    <ItemSkeleton />
                                </div>
                            </> : <>
                            {
                                list.length? <>
                                    {
                                        list.map(item => <Item key={item.employee_id} itemData={item} timesheetId={timesheet.id as string} 
                                            onDeleteSuccess={() => {
                                                setList(list.filter(item2 => item.id != item2.id));
                                                enqueueSnackbar("Delete Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}});
                                            }}/>)
                                    }
                                </> : <>
                                    <div className="no-record">
                                        <strong>Employees assigned to off-schedule work under this timeshee will appear here.</strong>
                                    </div>
                                </>
                            }
                            </>
                        }
                    </Form>
                </DialogContent>
            </BootstrapDialog>
        </React.Fragment>
    )
}

const ItemSkeletonFC: React.FC<IStyledFC> = ({className}) => {
    return(
        <Box className={className}>
            <div className="avatar">
                <Skeleton height={50} variant="circular" />
            </div>
            <div className="name-group">
                <Skeleton variant="text" sx={{ fontSize: '13px', width: "150px" }} />
                <Skeleton variant="text" sx={{ fontSize: '10px', width: "80px" }} />
            </div>
        </Box>
    )
}


const ItemSkeleton = styled(ItemSkeletonFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 60px;
        padding: 5px 10px;
        align-items: center;

        > .avatar {
            width: 50px;
            height: 50px;
            margin-right: 10px;
        }

        > .name-group {
            display: flex;
            flex-direction: column;
        }
    }
`

interface IItemFC extends IStyledFC {
    itemData: IOffScheduleEmployeesDataFromDb,
    timesheetId: string,
    onDeleteSuccess: () => void
}

const ItemFC: React.FC<IItemFC> = ({className, itemData, onDeleteSuccess, timesheetId}) => {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const handleRemoveFromList = () => {
        doApiRequest(
            "/api/private/delete/delete-off-schedule-employee",
            (data) =>{ 
                playNotifSound();
                onDeleteSuccess()
            },
            (state) => setIsDeleting(state),
            (error) => {
                playErrorSound()
                enqueueSnackbar(error.message, {variant: error.code == "ER_ROW_IS_REFERENCED_2"? "warning" : 'error', anchorOrigin: {vertical: "top", horizontal: "center"}});
            },
            {
                method: "DELETE",
                body: JSON.stringify({id: itemData.id, employee_id: itemData.employee_id, timesheet_id: timesheetId})
            }
        )
    }
    return(
        <Paper className={className}>
            <div className="avatar">
                <Avatar sx={{width: "50px", height: "50px"}} src={itemData.display_picture? `/images/avatar/${itemData.display_picture}` : undefined} alt={itemData.first_name}/>
            </div>
            <div className="name-group">
                <h3 style={{ fontSize: '13px'}}>{`${itemData.first_name.toUpperCase()} ${itemData.middle_name? itemData.middle_name[0].toUpperCase() + "." : ""} ${itemData.surname.toUpperCase()} ${itemData.ext_name? itemData.ext_name.toUpperCase() : ""}`}</h3>
                <span><Chip size='small' label={`In: ${dayjs(itemData.time_in, "HH:mm:ss").format("h:mm:ss A")}`}/> <Chip size='small' label={`Out: ${dayjs(itemData.time_out, "HH:mm:ss").format("h:mm:ss A")}`}/></span>
                {/* <Chip label={itemData.time_in}/>
                <Chip label={itemData.time_in}/> */}
            </div>
            <Tooltip title="Remove from list">
                <IconButton loading={isDeleting} onClick={handleRemoveFromList} className="delete-btn" aria-label="delete" size="small">
                    <PersonRemoveIcon fontSize="inherit" />
                </IconButton>
            </Tooltip>
        </Paper>
    )
}

const Item = styled(ItemFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 60px;
        padding: 5px 10px;
        align-items: center;

        > .avatar {
            width: 50px;
            height: 50px;
            margin-right: 10px;
        }

        > .name-group {
            display: flex;
            flex-direction: column;
        }

        > .delete-btn {
            margin-left: auto;
        }
    }
`

export default OffScheduleWorkEmployees;