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

import { 
    Box,
    Button,
    IconButton,
    Alert,
    AlertTitle,
    Dialog,
    Skeleton,
    Tooltip,
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
            position: sticky;
            flex-wrap: wrap;
            gap: 10px;
            top: 0;
            background-color: ${props => props.theme.palette.background.paper};
            z-index: 10;
            padding: 10px;

            .collapes {
                width: 100%;
                
                .row {
                    display: flex;
                    flex: 0 1 100%;
                    gap: 10px;

                    .col {
                        display: flex;
                        flex: 1;
                        /* background-col   or: #ffa6005c; */
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
    const [schedule, setSchedule] = React.useState<{timeIn: string | null, timeOut: string | null}>({timeIn: null, timeOut: null})
    const [list, setList] = React.useState<IOffScheduleEmployeesDataFromDb[]>([]);
    const [isAdding, setIsAdding] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showInfo, setShowInfo] = React.useState(true);

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

            doApiRequest<{id: string}>(
                "/api/private/post/add-off-schedule-employee",
                (data) => {
                    playNotifSound();
                    enqueueSnackbar("Add Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}});
                    setList([...list, {...selectedEmployee, id: data.id, time_in: selectedTimeIn || "07:00:00", time_out: selectedTimeOut || "16:00:00"}]);
                    setSchedule({timeIn: null, timeOut: null});
                    setSelectedEmployee(null);
                },
                (state) => setIsAdding(state),
                (error) => enqueueSnackbar(error.message, {variant: error.code == "EMPLOYEE_HAS_SCHED" || error.code == "EMPLOYEE_IN_LIST"? "warning" : 'error', anchorOrigin: {vertical: "top", horizontal: "center"}}),
                {
                    method: 'POST',
                    body: JSON.stringify({employee_id: selectedEmployee?.employee_id, timesheet_id: timesheet.id, timesheet_date: timesheet.date, time_in: selectedTimeIn, time_out: selectedTimeOut})
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
    
    return(
        <React.Fragment>
            <BootstrapDialog
                container={container}
                fullScreen={fullScreen}
                maxWidth="sm"
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
                            {/* <Divider orientation='horizontal' sx={{flex: "0 1 100%"}}/> */}
                            <EmployeeSelect value={selectedEmployee} onChange={(e) => setSelectedEmployee(e)} />
                            <Collapse className='collapes' in={!!selectedEmployee}>
                                <div className="row">
                                    <div className="col">
                                        <MobileTimePicker
                                        label="Time-in Schedule"
                                        views={['hours', "minutes"]}
                                        orientation='landscape'
                                        slotProps={{
                                            field: { clearable: false }, 
                                            textField: {
                                                sx: {flex: 1}
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
                                    <div className="col">
                                        <MobileTimePicker
                                        label="Time-Out Schedule"
                                        views={['hours', "minutes"]}
                                        orientation='landscape'
                                        slotProps={{
                                            field: { clearable: false }, 
                                            textField: {
                                                sx: {flex: 1}
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
                                </div>
                                <Button fullWidth variant='contained' loading={isAdding} disabled={selectedEmployee === null || schedule.timeIn == null || schedule.timeOut == null} onClick={handleAdd} sx={{marginTop: "10px"}}>Add</Button>
                            </Collapse>
                            {/* <Divider orientation='horizontal' sx={{flex: "0 1 100%"}}/> */}
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