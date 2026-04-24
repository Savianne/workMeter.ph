"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import useConfirmModal from '@/app/components/ConfirmModal/useConfirmModal';
import ConfirmModal from '@/app/components/ConfirmModal/ConfirmModal';
import { enqueueSnackbar, closeSnackbar } from 'notistack';
import ILeaveTypes, { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { useUpdateSchedule } from './SchedulerTable';
import { MobileTimePicker } from '@mui/x-date-pickers';
import validateTimeInTimeOut from '@/app/helpers/validateTimeInTimeOut';
import playErrorSound from '@/app/components/helpers/playErrorSound';
import playNotifSound from '@/app/components/helpers/playNotifSound';
import computeTotalHours from '@/app/helpers/computeTotalHours';
import { TWeeklySchedule } from '@/app/types/scheduler-table';

import { 
    Box,
    Button,
    IconButton,
    Avatar,
    Paper,
    InputAdornment,
    Alert,
    AlertTitle,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    FormHelperText,
    Divider,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import doApiRequest from '@/app/helpers/doApiRequest';

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
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const Form = styled(Box)`
    && {
        display: flex;
        flex: 0 1 600px;
        flex-wrap: wrap;
        gap: 15px;

        > .input-group {
            display: flex;
            flex-wrap: wrap;
            flex: 1 0 250px;
            gap: 15px;

            
            > .row {
                display: flex;
                flex: 0 1 100%;
                flex-wrap: wrap;
                gap: 15px;
                justify-content: center;
    
                > .input {
                    flex: 1;
                }
            }
        }

        > .computed-work-hours {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            flex: 1 1 200px;
            height: fit-content;
            gap: 10px;
            justify-content: center;

            > h5 {
                flex: 0 1 100%;
                text-align: center;
            }

            > .data {
                display: flex;
                padding: 0 10px;
                align-items: center;
                flex: 0 1 100%;

                > strong {
                    margin-left: auto;
                    font-size: 13px;
                }
            }
        }
    }
`

interface IUpdateEmployeeScheduleFormDialog {
    container?: any,
    onSuccess?: (data: {newSchedule: TWeeklySchedule, employeeId: string}) => void,
}

const UpdateEmployeeScheduleDialog: React.FC<IUpdateEmployeeScheduleFormDialog> = ({
    container,
    onSuccess
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const context =  useUpdateSchedule();
    const [isLoading, setIsLoading] = React.useState(false);
    const [totalHours, setTotalHours] = React.useState(0);
    const [editData, setEditData] = React.useState<{in: string | null, out: string | null,  break_time_hours: number}>({in: null, out: null, break_time_hours: 0})
    const [defaultData, setDefaultData] = React.useState<{in: string | null, out: string | null,  break_time_hours: number}>({in: null, out: null, break_time_hours: 0})
    const [formValidationState, setFormValidationState] = React.useState<{ in: string | null, out: string | null, break_time_hours: string | null}>({in: null, out: null, break_time_hours: null})
    const onClose = () => {
        setFormValidationState({in: null, out: null, break_time_hours: null})
        context.setData(null);
        context.setDialogState(false);
    }

    const handleInputValidation = React.useCallback(
        debounce(async (scheme: () => Promise<any>, onInvalid: (error: string) => void, onValid: () => void) => {
            try {
                await scheme();
                onValid();
            }
            catch(err) {
                if (err instanceof ValidationError) {
                    onInvalid(err.message)
                }
            }
        }, 500), 
    []);

    const handleUpdate = async () => {
        const data = context.data;
        //If the item has schedule then check if there is no changes in data
        //If no changes then no need to send request to the backend, just close the dialog normaly
        if(
            data && 
            data.schedule && 
            data.schedule !== "dayoff" && 
            editData.in == defaultData.in && 
            editData.out == defaultData.out && 
            editData.break_time_hours == defaultData.break_time_hours) 
        {
            onClose();
            return;
        }

        try {
            //Validate if the form is completely filled-up
            await object({
                in: date().typeError('Invalid date').required('Time-in is required'),
                out: date().typeError('Invalid date').required('Time-out is required'),
                break_time_hours: number().min(0).max(5)
            }).validate(editData);

            //validate the time-in and time-out
            const timeInAndOut = await validateTimeInTimeOut(new Date(editData.in as string), new Date(editData.out as string));
            
            const totalHours = computeTotalHours(new Date(editData.in as string).toLocaleTimeString(), new Date(editData.out as string).toLocaleTimeString());

            const workHour = totalHours - editData.break_time_hours;

            if(workHour < 1) {
                throw {error: "The total work duration must be greater than 1 hour to proceed."}
            }
            
            const scheduleData = {
                in: dayjs(timeInAndOut.result.time_in.toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss"),
                out: dayjs(timeInAndOut.result.time_out.toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss"),
                break_time_hours: editData.break_time_hours,
                work_hours: workHour
            }

            const snackbarId = enqueueSnackbar("Please Wait", {variant: "default", persist: true, anchorOrigin: {vertical: "top", horizontal: 'center'}});

            doApiRequest<TWeeklySchedule>(
                "/api/private/update/update-employee-schedule",
                (data) => {
                    onSuccess && onSuccess({newSchedule: {...data}, employeeId: String(context.data?.employee.employee_id)});
                    closeSnackbar(snackbarId);
                    playNotifSound();
                    enqueueSnackbar("Update Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
                    onClose();
                },
                (state) => {
                    setIsLoading(state);
                },
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
                },
                {
                    method: "POST",
                    body: JSON.stringify({
                        day: context.data?.day,
                        time: {...scheduleData},
                        employee_id: context.data?.employee.employee_id
                    })
                }
            )
        }
        catch(error:any) {
            playErrorSound();
            if(error.code && error.message) {
                enqueueSnackbar(error.message, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            } 
            else if(error.error) {
                enqueueSnackbar(error.error, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            } else {
                enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }
        }
       
    }

    React.useEffect(() => {
        //Update the editData and defaultData when the context.data changes value
        if(context.data && context.data.schedule && context.data.schedule !== "dayoff") {
            const timein = `1998-08-03 ${context.data.schedule.in}`;
            const timeout = `1998-08-03 ${context.data.schedule.out}`;
            const breakTotalHour = context.data.schedule.break_time_hours;

            setEditData({in: timein, out: timeout, break_time_hours: breakTotalHour});
            setDefaultData({in: timein, out: timeout, break_time_hours: breakTotalHour})
        } else {
            setEditData({in: null, out: null, break_time_hours: 0});
            setDefaultData({in: null, out: null, break_time_hours: 0});
        }
    }, [context.data]);

    React.useEffect(() => {
        if(editData && editData.in && editData.out && editData.break_time_hours >= 0) {
            const totalHours = computeTotalHours(new Date(editData.in).toLocaleTimeString(), new Date(editData.out).toLocaleTimeString());
            setTotalHours(totalHours)
        } else {
            setTotalHours(0)
        }
    }, [editData]);

    return(
        <React.Fragment>
            <BootstrapDialog
                container={container}
                fullScreen={fullScreen}
                maxWidth="md"
                open={context.dialogState}
                slots={{
                    transition: Transition,
                }}
                onClose={onClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                    Update {context.data?.day} schedule
                </DialogTitle>
                <IconButton
                aria-label="close"
                onClick={onClose}
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
                        <div className="input-group">
                            <div className="row">
                                <MobileTimePicker
                                label="Time-in"
                                views={['hours', "minutes"]}
                                orientation='landscape'
                                slotProps={{
                                    field: { clearable: true }, 
                                    textField: {
                                        error: !!formValidationState.in,
                                        helperText: formValidationState.in,
                                        sx: {flex: 1}
                                    },
                                    dialog: {
                                        sx: { zIndex: 2000},
                                    },
                                }} 
                                value={editData.in? dayjs(editData.in) : null}
                                onChange={(e) => {
                                    setEditData({...editData, in: e? e.toString() : null});
                                    handleInputValidation(() => date().typeError('Invalid date').required('Time-in is required').validate(e), (error) => setFormValidationState({...formValidationState, in: error}), () => setFormValidationState({...formValidationState, in: null}))
                                }}
                                />
                            </div>
                            <div className="row">
                                <MobileTimePicker
                                label="Time-out"
                                views={['hours', "minutes"]}
                                orientation='landscape'
                                slotProps={{
                                    field: { clearable: true }, 
                                    textField: {
                                        error: !!formValidationState.out,
                                        helperText: formValidationState.out,
                                        sx: {flex: 1}
                                    },
                                    dialog: {
                                        sx: { zIndex: 2000},
                                    },
                                }} 
                                value={editData.out? dayjs(editData.out) : null}
                                onChange={(e) => {
                                    setEditData({...editData, out: e? e.toString() : null});
                                    handleInputValidation(() => date().typeError('Invalid date').required('Time-out is required').validate(e), (error) => setFormValidationState({...formValidationState, out: error}), () => setFormValidationState({...formValidationState, out: null}))
                                }}/>
                            </div>
                            <div className="row">
                                <TextField fullWidth type='number' label="Total Breaktime Hour(s)" value={editData.break_time_hours} 
                                error={!!formValidationState.break_time_hours}
                                helperText={formValidationState.break_time_hours}
                                onChange={(e) => {
                                    setEditData({...editData, break_time_hours: +e.target.value})
                                    handleInputValidation(() => number().min(0).max(5).validate(e.target.value), (error) => setFormValidationState({...formValidationState, break_time_hours: error}), () => setFormValidationState({...formValidationState, break_time_hours: null}))
                                }}/>
                            </div>
                        </div>
                        <div className="computed-work-hours">
                            <Avatar variant='rounded' sx={{width: '60px', height: "60px"}} src={context.data?.employee.display_picture? `/images/avatar/${context.data?.employee.display_picture}` : undefined} alt={context.data?.employee.first_name} />
                            <h5>{`${context.data?.employee.first_name.toUpperCase()} ${context.data?.employee.middle_name? context.data?.employee.middle_name[0].toUpperCase() + "." : ""} ${context.data?.employee.surname.toUpperCase()}`}</h5>
                            <Divider sx={{flex: 1}} orientation='horizontal' />
                            <Chip sx={{flex: "0 1 100%"}} label="Work Hour(s) = Total hour(s) - Breaktime hour(s)"/>
                            <div className="data">
                                <h6>Total Hour(s) between time-in and time-out:</h6>
                                <strong>{totalHours}</strong>
                            </div>
                            <div className="data">
                                <h6>Breaktime:</h6>
                                <strong>{editData.break_time_hours}</strong>
                            </div>
                            <div className="data" style={{color: (totalHours - editData.break_time_hours) < 1? "red": "inherit"}}>
                                <h6>Work Hour(s):</h6>
                                <strong>{totalHours - editData.break_time_hours}</strong>
                            </div>
                        </div>
                    </Form>
                </DialogContent>
                <DialogActions>
                    <Button loadingPosition='end' autoFocus onClick={onClose}>
                        Cancel
                    </Button>
                    <Button loadingPosition='end' loading={isLoading} variant='contained' autoFocus onClick={handleUpdate}>
                        Update
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    )
}

export default UpdateEmployeeScheduleDialog;