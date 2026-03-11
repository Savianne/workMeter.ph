"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import dayjs from 'dayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { StaticTimePicker } from '@mui/x-date-pickers';
import { TDaySchedule, TWeeklySchedule } from '@/app/types/scheduler-table';
import { IStyledFC } from '@/app/types/IStyledFC';
import isTimeDifferent from '@/app/helpers/isTimeDifferent';
import playErrorSound from '@/app/components/helpers/playErrorSound';
import playNotifSound from '@/app/components/helpers/playNotifSound';

import { 
    TextField,
    InputBase,
    InputAdornment,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Modal,
    Chip
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

interface ISkedulerTimeRangePicker extends IStyledFC {
    employee_id: string,
    day: string,
    weekly_schedule: TWeeklySchedule,
    onChange: (schedule: TWeeklySchedule) => void
}

const SkedulerTimeRangePickerFC:React.FC<ISkedulerTimeRangePicker> = ({className, employee_id, day, weekly_schedule, onChange}) => {
    const [onEditActive, setOnEditActive] = React.useState(false);
    const [editOnSubmit, setEditOnSubmit] = React.useState(false);
    const [dateValidationError, setDateValidationError] = React.useState<string | null>(null);
    const [scheduleEditData, setScheduleEditData] = React.useState<TDaySchedule | "dayoff" | null>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
    const [addTimeModal, setAddTimeModal] = React.useState(false);
    const open = Boolean(anchorEl);
    const open2 = Boolean(anchorEl2);

    const handleSaveEdit = async () => {
        if(scheduleEditData !== null && scheduleEditData !== "dayoff") {
            const selectedTimeIn = dayjs(new Date(scheduleEditData.in).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");
            const selectedTimeOut = dayjs(new Date(scheduleEditData.out).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");

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
            
            doApiRequest<TWeeklySchedule>(
                "/api/private/update/update-employee-schedule",
                (data) => {
                    onChange(data);
                    setOnEditActive(false);
                    playNotifSound();
                    enqueueSnackbar("Update Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
                },
                (state) => {
                    setEditOnSubmit(state);
                },
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
                },
                {
                    method: "POST",
                    body: JSON.stringify({
                        day,
                        time: {in: selectedTimeIn, out: selectedTimeOut},
                        employee_id
                    })
                }
            )
        }
    }

    const handleRemoveTime = async () => {
        const snackbarId = enqueueSnackbar("Please Wait", {variant: "default", persist: true, anchorOrigin: {vertical: "top", horizontal: 'center'}});
        doApiRequest<TWeeklySchedule>(
            "/api/private/update/update-employee-schedule",
            (data) => {
                onChange(data);
                setOnEditActive(false);
                closeSnackbar(snackbarId);
                playNotifSound();
                enqueueSnackbar("Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            (state) => {
                setEditOnSubmit(state);
            },
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            {
                method: "POST",
                body: JSON.stringify({
                    day,
                    time: null,
                    employee_id
                })
            }
        )
    }

    const handleSetDayoff = async () => {
        const snackbarId = enqueueSnackbar("Please Wait", {variant: "default", persist: true, anchorOrigin: {vertical: "top", horizontal: 'center'}});
        doApiRequest<TWeeklySchedule>(
            "/api/private/update/update-employee-schedule",
            (data) => {
                onChange(data);
                setOnEditActive(false);
                closeSnackbar(snackbarId);
                playNotifSound();
                enqueueSnackbar("Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            (state) => {
                setEditOnSubmit(state);
            },
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            {
                method: "POST",
                body: JSON.stringify({
                    day,
                    time: "dayoff",
                    employee_id
                })
            }
        )
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
        const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl2(event.currentTarget);
    };
    const handleClose2 = () => {
        setAnchorEl2(null);
    };
    const handleAddTimeModalClose = () => setAddTimeModal(false);

    React.useEffect(() => {
        const sched = weekly_schedule[day as keyof TWeeklySchedule];

        if(!(sched === "dayoff" || sched === null)) {
            const dateTimeIn = new Date(`1998-08-03 ${sched.in}`)
            const dateTimeOut = new Date(`1998-08-03 ${sched.out}`)
           
            console.log(dateTimeIn)
            const selectedTimeInHour = dateTimeIn.getHours();
            const selectedTimeOutHour = dateTimeOut.getFullYear();

             if(selectedTimeInHour >= 12 && selectedTimeInHour <= 23 && selectedTimeOutHour >= 0 && selectedTimeOutHour <= 11) {
                const hour = selectedTimeOutHour + 24;
                dateTimeOut.setHours(hour);
            }

            console.log(dateTimeIn.toString())
            setScheduleEditData({in: dateTimeIn.toString(), out: dateTimeOut.toString()});
            
        } else {
            setScheduleEditData(weekly_schedule[day as keyof TWeeklySchedule]);
        }
    }, [weekly_schedule]);

    React.useEffect(() => {
        console.log(scheduleEditData)
        // if(!(scheduleEditData === "dayoff" || scheduleEditData === null)) {
        //     const dateTimeIn = new Date(`1998-08-03 ${scheduleEditData.in}`)
        //     const dateTimeOut = new Date(`1998-08-03 ${scheduleEditData.out}`)
           
        //     const selectedTimeInHour = dateTimeIn.getHours();
        //     const selectedTimeOutHour = dateTimeOut.getFullYear();

        //      if(selectedTimeInHour >= 12 && selectedTimeInHour <= 23 && selectedTimeOutHour >= 0 && selectedTimeOutHour <= 11) {
        //         const hour = selectedTimeOutHour + 24;
        //         dateTimeOut.setHours(hour);
        //     }

            

        //     // const start = new Date(scheduleEditData.in).getTime();
        //     // const end = new Date(scheduleEditData.out).getTime();

        //     // if (end <= start) {
        //     //     setDateValidationError("Time-out must be after time-in");
        //     // } else {
        //     //     setDateValidationError(null);
        //     // }
        // }
    }, [scheduleEditData])

    return(
        <Box className={className}>
            <Modal
            open={addTimeModal}
            onClose={handleAddTimeModalClose}
            sx={{display: 'flex', alignItems: "center", justifyContent: 'center'}}
            >
                <Box className="add-time-modal-content" sx={{display: 'flex', gap: '10px', width: "fit-content"}}>
                    <StaticTimePicker orientation="landscape" 
                    onClose={() => setAddTimeModal(false)}
                    onAccept={(e) => {
                        const selectedDate = e? new Date(e.toString()) : new Date();
                    
                        if(selectedDate) {
                            const timeOut = new Date(selectedDate);
                            timeOut.setHours(timeOut.getHours() + 8); 
        
                            setAddTimeModal(false);
                            setOnEditActive(true);
                            setScheduleEditData({in: new Date(selectedDate).toString(), out: timeOut.toString()})
                        }
                    }}/>
                </Box>
            </Modal>
            {
                (weekly_schedule[day as keyof TWeeklySchedule] == null && scheduleEditData == null)? <>
                    <Chip label="No schedule for this day" icon={<EventBusyIcon />} />
                    <IconButton sx={{width: '30px', height: '30px'}} aria-label="edit" size="small" onClick={handleClick2}>
                        <MoreVertIcon fontSize="inherit" />
                    </IconButton>
                    <Menu
                    id="long-menu"
                    anchorEl={anchorEl2}
                    open={open2}
                    onClose={handleClose2}>
                        <MenuItem onClick={() => {
                            setAddTimeModal(true)
                            handleClose2();
                        }}>
                            Add Time
                        </MenuItem>
                        <MenuItem onClick={() => {
                            handleSetDayoff();
                            handleClose2()
                        }}>
                            Set {day.toUpperCase()} as Day off
                        </MenuItem>
                    </Menu>
                </> : <>
                    {
                        scheduleEditData === "dayoff"? <Chip label="Day off / Rest day" variant="outlined" icon={<DoNotDisturbOnTotalSilenceIcon />} /> : ""
                    }
                    {
                        scheduleEditData != null && scheduleEditData != "dayoff" && scheduleEditData.in && scheduleEditData.out? <>
                            <MobileTimePicker disabled={editOnSubmit} readOnly={!onEditActive} label={`IN (${day.toUpperCase()})`} sx={{width: "140px"}} onChange={(e) => setScheduleEditData({...scheduleEditData, in: e? e.toString() : new Date().toString()})} value={dayjs(scheduleEditData.in)} onAccept={(e) => e? setScheduleEditData({...scheduleEditData, in: e.toString()}) : undefined} />
                            <MobileTimePicker slotProps={{
                            textField: {
                                error: !!dateValidationError,
                                helperText: dateValidationError,
                                },
                            }} disabled={editOnSubmit} readOnly={!onEditActive} label={`OUT (${day.toUpperCase()})`} sx={{width: "140px"}} onChange={(e) => setScheduleEditData({...scheduleEditData, out: e? e.toString() : new Date().toString()})} value={dayjs(scheduleEditData.out)} onAccept={(e) => e? setScheduleEditData({...scheduleEditData, out: e.toString()}) : undefined} />
                        </> : ""
                    }
                    {
                        onEditActive? <>
                            {
                                isTimeDifferent(scheduleEditData, weekly_schedule[day as keyof TWeeklySchedule]) && dateValidationError == null?
                                <IconButton loading={editOnSubmit} sx={{width: '30px', height: '30px'}} aria-label="edit" size="small" onClick={handleSaveEdit}>
                                    <CheckIcon fontSize="inherit" />
                                </IconButton> : ''
                            }
                            {
                                !editOnSubmit? <IconButton sx={{width: '30px', height: '30px'}} aria-label="edit" size="small" onClick={(e) => {
                                    setScheduleEditData(weekly_schedule[day as keyof TWeeklySchedule]);
                                    setOnEditActive(false);
                                }}>
                                    <CloseIcon fontSize="inherit" />
                                </IconButton> : ''
                            }
                        </>: <IconButton sx={{width: '30px', height: '30px'}} aria-label="edit" size="small" onClick={handleClick}>
                            <MoreVertIcon fontSize="inherit" />
                        </IconButton>
                    }
                    {
                        !(scheduleEditData == "dayoff")?
                        <Menu
                        id="long-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}>
                            <MenuItem onClick={() => {
                                setOnEditActive(true);
                                handleClose();
                            }}>
                                Edit Time
                            </MenuItem>
                            <MenuItem onClick={() => {
                                handleSetDayoff()
                                handleClose();
                            }}>
                                Set {day.toUpperCase()} as Day off
                            </MenuItem>
                            <MenuItem onClick={() => {
                                handleRemoveTime();
                                handleClose();
                            }}>
                                Remove {day.toUpperCase()} Schedule
                            </MenuItem>
                        </Menu> : <Menu
                        id="long-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}>
                            <MenuItem onClick={() => {
                                setAddTimeModal(true)
                                handleClose();
                            }}>
                                Add Time
                            </MenuItem>
                            <MenuItem onClick={() => {
                                handleRemoveTime();
                                handleClose();
                            }}>
                                Remove Dayoff
                            </MenuItem>
                        </Menu>
                    }
                </>
            }
        </Box>
    )
}

const SkedulerTimeRangePicker = styled(SkedulerTimeRangePickerFC)`
    && {
        display: flex;
        flex: 1;
        gap: 5px;
        align-items: center;
        justify-content: center;

        > .add-time-modal {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
`;

export default SkedulerTimeRangePicker;
