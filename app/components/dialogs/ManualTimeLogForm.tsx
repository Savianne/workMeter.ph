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
import EmployeeSelect from '../EmployeeSelect';
import { ITimesheetFromDB } from '@/app/types/timesheet';
import { enqueueSnackbar } from 'notistack';
import LeaveTypeSelector from '../LeaveTypeSelect';
import { DatePicker } from '@mui/x-date-pickers';
import { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import { EmployeeSelectData } from '../EmployeeSelect';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import playErrorSound from '../helpers/playErrorSound';
import playNotifSound from '../helpers/playNotifSound';

import { 
    Box,
    Button,
    IconButton,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import doApiRequest from '@/app/helpers/doApiRequest';

interface IManualTimeLogFormDialog {
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
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const Form = styled(Box)`
    && {
        display: flex;
        flex: 1;
        flex-wrap: wrap;
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
`
interface IFormValues {
    employee: EmployeeSelectData | null;
    timeIn: string | null;
    timeOut: string | null
}

const ManualTimeLogForm: React.FC<IManualTimeLogFormDialog> = ({
    container,
    state,
    timesheet,
    onClose,
    onSuccess,
    onError,
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [formValues, setFormValues] = React.useState<IFormValues>({employee: null, timeIn: null, timeOut: null});
    const [isLoading, setIsLoading] = React.useState(false);

    const handleTimeLog = () => {
        if(formValues.employee == null) {
            playErrorSound();
            return enqueueSnackbar("Please select an employee before proceeding.", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
        }

        if(formValues.timeIn == null) {
            playErrorSound();
            return enqueueSnackbar("Time-in field is required.", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}});
        }
    
        const selectedTimeIn = dayjs(timesheet.date).set("hour", dayjs(formValues.timeIn).get("hour")).set("minutes", dayjs(formValues.timeIn).get("minutes")).set("seconds", dayjs(formValues.timeIn).get("seconds"));
        let selectedTimeOut = formValues.timeOut? dayjs(timesheet.date).set("hour", dayjs(formValues.timeOut).get("hour")).set("minutes", dayjs(formValues.timeOut).get("minutes")).set("seconds", dayjs(formValues.timeOut).get("seconds")) : null;
        
        if(selectedTimeIn && selectedTimeOut) {
            const selectedTimeInHour = selectedTimeIn.get("hour");
            const selectedTimeOutHour = selectedTimeOut.get("hour");

            if(selectedTimeInHour >= 12 && selectedTimeInHour <= 23 && selectedTimeOutHour >= 0 && selectedTimeOutHour <= 11) {
                const hour = selectedTimeOutHour + 24;
                selectedTimeOut = selectedTimeOut.hour(hour);
            }

            if(selectedTimeOut.toDate().getTime() < selectedTimeIn.toDate().getTime()) {
                playErrorSound();
                return enqueueSnackbar("Time-out cannot be earlier than time-in.", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }

            const diff = selectedTimeOut.toDate().getTime() - selectedTimeIn.toDate().getTime();

            const thirtyMinutes = 30 * 60 * 1000;
    
            if (!(diff >= thirtyMinutes)) {
                playErrorSound();
                return enqueueSnackbar(
                    "Time-out must be at least 30 minutes after time-in.",
                    { variant: "warning", anchorOrigin: { vertical: "top", horizontal: "center" } }
                );
            }
        }

        doApiRequest<{success: boolean, id: number}>(
            "/api/private/post/manual-timelog",
            (data) => {
                playNotifSound();
                enqueueSnackbar("Timelog Added.", { variant: "default", anchorOrigin: { vertical: "top", horizontal: "center" } });
                setFormValues({employee: null, timeIn: null, timeOut: null});
                onClose();
            },
            (state) => setIsLoading(state),
            (error) => {
                playErrorSound();
                enqueueSnackbar(error.message, { variant: "default", anchorOrigin: { vertical: "top", horizontal: "center" } });
            },
            {
                method: "POST",
                body: JSON.stringify({
                    employee_id: formValues.employee.employee_id,
                    timesheet_id: timesheet.id,
                    timesheet_date: timesheet.date,
                    source: "Manual Time-Log",
                    timeIn: dayjs(selectedTimeIn.toDate()).format("YYYY-MM-DD HH:mm:ss"),
                    timeOut: dayjs(selectedTimeOut?.toDate()).format("YYYY-MM-DD HH:mm:ss")
                })
            }
        );
    }

    const handleCancel = () => {
        setFormValues({employee: null, timeIn: null, timeOut: null});
        onClose();
    }

    React.useEffect(() => {
        console.log(dayjs(new Date(formValues.timeIn as string).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss"))
        const selectedTimeIn = dayjs(timesheet.date).set("hour", dayjs(formValues.timeIn).get("hour")).set("minutes", dayjs(formValues.timeIn).get("minutes")).set("seconds", dayjs(formValues.timeIn).get("seconds"));
        let selectedTimeOut = formValues.timeOut? dayjs(timesheet.date).set("hour", dayjs(formValues.timeOut).get("hour")).set("minutes", dayjs(formValues.timeOut).get("minutes")).set("seconds", dayjs(formValues.timeOut).get("seconds")) : null;
        if(selectedTimeOut) {
            const selectedTimeInHour = selectedTimeIn.get("hour");
            const selectedTimeOutHour = selectedTimeOut.get("hour");
            if(selectedTimeInHour >= 12 && selectedTimeInHour <= 23 && selectedTimeOutHour >= 0 && selectedTimeOutHour <= 11) {
                const hour = selectedTimeOutHour + 24;
                console.log(hour)
                selectedTimeOut = selectedTimeOut.hour(hour);
            }

            console.log(dayjs(selectedTimeIn.toDate()).format("YYYY-MM-DD"))
            console.log(dayjs(selectedTimeOut.toDate()).format("YYYY-MM-DD"))
        }
        // const date = new Date("08-03-1998");
        // console.log(date.toLocaleDateString())
        // console.log(date.toLocaleTimeString())
        // date.setHours(31);
        // console.log(date.toLocaleDateString())
        // console.log(date.toLocaleTimeString())
        
    }, [formValues])

    return (
        <React.Fragment>
            <BootstrapDialog
                container={container}
                fullScreen={fullScreen}
                maxWidth="sm"
                open={state}
                slots={{
                    transition: Transition,
                }}
                onClose={onClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                    Manual Time Log
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
                        <div className="row">
                            <EmployeeSelect required value={formValues.employee} onChange={(data) => setFormValues({...formValues, employee: data})} />
                        </div>
                        <div className="row">
                            <MobileTimePicker
                            label="Time-in"
                            views={['hours', "minutes"]}
                            orientation='landscape'
                            slotProps={{
                                field: { clearable: true }, 
                                textField: {
                                    sx: {flex: 1}
                                },
                                dialog: {
                                    sx: { zIndex: 2000},
                                },
                            }} 
                            value={formValues.timeIn? dayjs(formValues.timeIn) : null}
                            onChange={(e) => setFormValues({...formValues, timeIn: e? e.toString() : null})}
                            onAccept={(e) => {
                                setFormValues({...formValues, timeIn: e? e.toString() : null});
                            }}
                            />
                            <MobileTimePicker
                            disabled={formValues.timeIn == null}
                            label="Time-out"
                            views={['hours', "minutes"]}
                            orientation='landscape'
                            slotProps={{
                                field: { clearable: true }, 
                                textField: {
                                    sx: {flex: 1}
                                },
                                dialog: {
                                    sx: {zIndex: 2000}
                                },
                            }} 
                            value={formValues.timeOut? dayjs(formValues.timeOut) : null}
                            onChange={(e) => setFormValues({...formValues, timeOut: e? e.toString() : null})}
                            onAccept={(e) => {
                                setFormValues({...formValues, timeOut: e? e.toString() : null});
                            }}/>
                        </div>
                    </Form>
                </DialogContent>
                <DialogActions>
                    <Button loadingPosition='end' autoFocus onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button loadingPosition='end' loading={isLoading} variant='contained' autoFocus onClick={handleTimeLog}>
                        Add Time-Log
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    )
}

export default ManualTimeLogForm;