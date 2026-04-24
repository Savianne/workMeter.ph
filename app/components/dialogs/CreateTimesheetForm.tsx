"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import useConfirmModal from '../ConfirmModal/useConfirmModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { enqueueSnackbar } from 'notistack';
import { ITimesheetFromDB } from '@/app/types/timesheet';
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import computeTotalHours from '@/app/helpers/computeTotalHours';
import { 
    Box,
    Button,
    IconButton,
    Paper,
    InputAdornment,
    Chip,
    Alert,
    AlertTitle,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Select,
    InputLabel,
    MenuItem,
    Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import doApiRequest from '@/app/helpers/doApiRequest';
import { time } from 'console';
import playErrorSound from '../helpers/playErrorSound';
import playNotifSound from '../helpers/playNotifSound';

interface IAddTimesheetFormDialog {
    container?: any,
    state: boolean,
    onClose: () => void,
    onSuccess?: (data: ITimesheetFromDB) => void,
    onError?: (error: string    ) => void
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

        > .collapes {
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
`
interface ITimesheet {
    title: string;
    date: string;
    time_schedule: {
        in: string,
        out: string,
        break_time_hours: number,
    } | null;
    threshold_late: number;
    threshold_absent: number;
}

const formDefaultValues:ITimesheet = {
    title: "",
    date: "",
    time_schedule: null,
    threshold_late: 5,
    threshold_absent: 30,
}

type TFormValidation = {
    title: string | null,
    date: string | null,
    in: string | null,
    out: string | null,
    threshold_late: string | null,
    threshold_absent: string | null,
    break_time_hours: string | null
}

const formValidationDefaultState:TFormValidation = {
    title: null,
    date: null,
    in: null,
    out: null,
    threshold_absent: null,
    threshold_late: null,
    break_time_hours: null
}

const CreateTimesheetForm: React.FC<IAddTimesheetFormDialog> = ({
    container,
    state,
    onClose,
    onSuccess,
    onError
}) => {
    const {modal, confirm} = useConfirmModal()
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isLoading, setIsLoading] = React.useState(false);
    const [showThresholdLateHelp, setShowThresholdLateHelp] = React.useState(false);
    const [showThresholdAbsentHelp, setShowThresholdAbsentHelp] = React.useState(false);
    const [formValidationState, setFormValidationState] = React.useState({...formValidationDefaultState});
    const [scheduleSelect, setScheduleSelect] = React.useState<"employee" | "create">("employee");
    const [formValues, setFormValues] = React.useState<ITimesheet>({
        ...formDefaultValues
    });
    const [totalHours, setTotalHours] = React.useState(0);

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

    const handleSubmit = async () => {
        try {
            await object({
                title: string().max(30).required('Title is required'),
                date: date().typeError('Invalid date').required('Date is required'),
                threshold_late: number().min(0).max(20).required("Threshold late is required"),
                threshold_absent: number().min(0).max(120).required("Threshold absent is required"),
            }).validate({
                ...formValues
            });

            if(Number(formValues.threshold_absent) > 0 && Number(formValues.threshold_absent) <= Number(formValues.threshold_late)) {
                setFormValidationState({...formValidationState, threshold_absent: "Threshold Absent must be greater than the Late threshold"});
                throw "Threshold Absent must be greater than the Late threshold"
            }

            let schedule: {in: string, out: string, break_time_hours: number, work_hours: number} | null = null;

            if(scheduleSelect == "create") {
                if(formValues.time_schedule == null) {
                    setFormValidationState({...formValidationState, in: "Time-in is required", out: "Time-out is required"});
                    throw "Time-in and time-out is required"
                } 

                await object({
                    in: date().typeError('Invalid date').required('Time-in is required'),
                    out: date().typeError('Invalid date').required('Time-out is required'),
                    break_time_hours: number().min(0).max(5)
                }).validate(formValues.time_schedule);


                const selectedTimeIn = dayjs(new Date(formValues.time_schedule.in).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");
                const selectedTimeOut = dayjs(new Date(formValues.time_schedule.out).toLocaleTimeString(), "HH:mm:ss A").format("HH:mm:ss");
                
                const dateTimeIn = new Date(`1998-08-03 ${selectedTimeIn}`);
                const dateTimeOut = new Date(`1998-08-03 ${selectedTimeOut}`);
    
                const dateTimeInHour = dateTimeIn.getHours();
                const dateTimeOutHour = dateTimeOut.getHours();

                if(dateTimeInHour >= 12 && dateTimeInHour <= 23 && dateTimeOutHour >= 0 && dateTimeOutHour <= 11) {
                    const hour = dateTimeOutHour + 24;
                    dateTimeOut.setHours(hour);
                }

                if(dateTimeOut.getTime() < dateTimeIn.getTime()) {
                    throw ({
                        message: "Time-out cannot be earlier than time-in",
                        code: "INVALID_TIME_IN"
                    });
                }

                const diff = dateTimeOut.getTime() - dateTimeIn.getTime();

                const thirtyMinutes = 60 * 60 * 1000;

                if (!(diff >= thirtyMinutes)) {
                    throw (
                        {
                            message: "Time-out must be at least 1 hour after time-in.",
                            code: "INVALID_TIME_OUT"
                        }
                    )
                }

                const totalHours = computeTotalHours(new Date(formValues.time_schedule.in as string).toLocaleTimeString(), new Date(formValues.time_schedule.out as string).toLocaleTimeString());

                const workHour = totalHours - formValues.time_schedule.break_time_hours;

                if(workHour < 1) {
                    throw {error: "The total work duration must be greater than 1 hour to proceed."}
                }

                schedule = {in: selectedTimeIn, out: selectedTimeOut, break_time_hours: formValues.time_schedule.break_time_hours, work_hours: workHour}
            }

            doApiRequest<ITimesheetFromDB>(
                "/api/private/post/add-timesheet",
                (data) => {
                    playNotifSound()
                    setFormValues({...formDefaultValues});
                    if(onSuccess) onSuccess(data);
                    enqueueSnackbar("New Timesheet added", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                    if(onError) onError(error.message);
                },
                {
                    method: "POST",
                    body: JSON.stringify({...formValues, schedule}),
                }
            )
            
        }
        catch(error:any) {
            playErrorSound()
            if(error.code && error.message) {
                enqueueSnackbar(error.message, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            } else if(error.error) {
                enqueueSnackbar(error.error, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            } else {
                enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }
        }
    }

    const handleClearForm = () => {
        confirm("Are you sure you want to clear your inputs?", () => {
            setFormValues({...formDefaultValues});
            setScheduleSelect("employee");
        })
    }

    const handleCancel = () => {
        setFormValidationState(formValidationDefaultState);
        setFormValues({...formDefaultValues});
        setScheduleSelect("employee");
        onClose();
    }

    React.useEffect(() => {
        if(formValues.time_schedule && formValues.time_schedule.in && formValues.time_schedule.out && formValues.time_schedule.break_time_hours >= 0) {
            const totalHours = computeTotalHours(new Date(formValues.time_schedule.in).toLocaleTimeString(), new Date(formValues.time_schedule.out).toLocaleTimeString());
            setTotalHours(totalHours)
        } else {
            setTotalHours(0)
        }
    }, [formValues.time_schedule]);

    return(
        <React.Fragment>
            <ConfirmModal severity='warning' buttonText='Yes' context={modal} />
            <BootstrapDialog
                container={container}
                fullScreen={fullScreen}
                maxWidth={scheduleSelect == "create"? "md" : "sm"}
                open={state}
                slots={{
                    transition: Transition,
                }}
                onClose={onClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                    Create Timesheet
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
                    <Form as="form">
                        <div className="row">
                            <TextField
                            className='input'
                            required
                            label="Timesheet Name"
                            value={formValues.title}
                            error={!!formValidationState.title}
                            helperText={formValidationState.title}
                            onChange={(e) => {
                                setFormValues({...formValues, title: e.target.value})
                                handleInputValidation(() => string().max(30).required('Title is required').validate(e.target.value), (error) => setFormValidationState({...formValidationState, title: error}), () => setFormValidationState({...formValidationState, title: null}))
                            }}
                            />
                        </div>
                        <div className="row">
                            <DatePicker 
                            label="Date" 
                            slotProps={
                                {
                                    popper: {
                                        sx: {
                                            zIndex: 2000,
                                        },
                                    },
                                    field: { clearable: true }, 
                                    textField: {
                                        required: true,
                                        fullWidth: true,
                                        error: !!formValidationState.date, 
                                        helperText: formValidationState.date,
                                    }
                                }
                            }
                            value={dayjs(formValues.date)}
                            onChange={(e) => {
                                setFormValues({...formValues, date: e? dayjs(e).format("YYYY/MM/DD") : ""})
                                handleInputValidation(() => date().typeError('Invalid date').required('Date is required').validate(e), (error) => setFormValidationState({...formValidationState, date: error}), () => setFormValidationState({...formValidationState, date: null}))
                            }}
                            />
                        </div>
                        <div className="row">
                            <TextField
                            className='input'
                            required
                            type='Number'
                            label="Threshold Late (Minutes)"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                        <IconButton
                                        onClick={() => setShowThresholdLateHelp(!showThresholdLateHelp)}
                                        edge="end"
                                        >
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </InputAdornment>
                                    )
                                }
                            }}
                            value={formValues.threshold_late}
                            error={!!formValidationState.threshold_late}
                            helperText={formValidationState.threshold_late}
                            onChange={(e) => {
                                setFormValues({...formValues, threshold_late: Number(e.target.value)})
                                handleInputValidation(() => number().min(0).max(20).required("Threshold late is required").validate(e.target.value), (error) => setFormValidationState({...formValidationState, threshold_late: error}), () => setFormValidationState({...formValidationState, threshold_late: null}))
                            }}
                            />
                           <Collapse in={showThresholdLateHelp} sx={{width: "100%"}}>
                                <Alert severity="info" sx={{marginTop: '5px', flex: '0 1 100%'}}>
                                    <AlertTitle>Treshold Late</AlertTitle>
                                    Set the grace period (in minutes) after the scheduled time-in.
                                    Time-ins beyond this period will be marked as Late.
                                </Alert>
                            </Collapse>
                        </div>
                        <div className="row">
                            <TextField
                            className='input'
                            required
                            type='Number'
                            label="Threshold Absent (Minutes)"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                        <IconButton
                                        edge="end"
                                        onClick={() => setShowThresholdAbsentHelp(!showThresholdAbsentHelp)}
                                        >
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </InputAdornment>
                                    )
                                }
                            }}
                            value={formValues.threshold_absent}
                            error={!!formValidationState.threshold_absent}
                            helperText={formValidationState.threshold_absent}
                            onChange={(e) => {
                                setFormValues({...formValues, threshold_absent: Number(e.target.value)})
                                handleInputValidation(() => number().min(0).max(120).required("Threshold absent is required").validate(e.target.value), (error) => setFormValidationState({...formValidationState, threshold_absent: error}), () => setFormValidationState({...formValidationState, threshold_absent: null}))
                            }}
                            />
                            <Collapse in={showThresholdAbsentHelp} sx={{width: "100%"}}>
                                <Alert severity="info" sx={{marginTop: '5px', flex: '0 1 100%'}}>
                                    <AlertTitle>Treshold Absent</AlertTitle>
                                    Defines the number of minutes after the scheduled time-in beyond which an employee is considered Absent.
                                    If set to 0, only the late threshold will apply, and the employee will be marked Late if applicable.
                                    This value must be greater than the Late threshold.
                                </Alert>
                            </Collapse>
                        </div>
                        <div className="row">
                            <FormControl fullWidth>
                                <InputLabel>Time Schedule</InputLabel>
                                <Select
                                MenuProps={{
                                    sx: { zIndex: 2000 },
                                }}
                                value={scheduleSelect}
                                label="Time-in Schedule"
                                onChange={(e) => setScheduleSelect(e.target.value)}
                                >
                                    <MenuItem value="employee">Use Employee Schedule</MenuItem>
                                    <MenuItem value="create">Set Time Schedule</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        <Collapse className='collapes' in={scheduleSelect == "create"}>
                            <h4>Time Settings</h4>
                            <Box className="container">
                                <div className="input-area">
                                    <div className="row">
                                        <MobileTimePicker value={formValues.time_schedule? dayjs(formValues.time_schedule.in) : null} label='Time-in Schedule'
                                        onChange={(e) => {
                                            setFormValues({...formValues, time_schedule: {break_time_hours: formValues.time_schedule? formValues.time_schedule.break_time_hours : 0, out: formValues.time_schedule? formValues.time_schedule.out : "", in: e? e.toString() : ""}});
                                            handleInputValidation(() => date().typeError('Invalid date').required('Time-in is required').validate(e), (error) => setFormValidationState({...formValidationState, in: error}), () => setFormValidationState({...formValidationState, in: null}));
                                        }}
                                        slotProps={{
                                            field: {clearable: true},
                                            textField: {
                                                required: true,
                                                fullWidth: true,
                                                sx: {flex: 1},
                                                error: !!formValidationState.in, 
                                                helperText: formValidationState.in
                                            }
                                        }}
                                        />
                                    </div>
                                    <div className="row">
                                        <MobileTimePicker value={formValues.time_schedule? dayjs(formValues.time_schedule.out) : null} label='Time-out Schedule'
                                        onChange={(e) => {
                                            setFormValues({...formValues, time_schedule: {break_time_hours: formValues.time_schedule? formValues.time_schedule.break_time_hours : 0, in: formValues.time_schedule? formValues.time_schedule.in : "", out: e? e.toString() : ""}});
                                            handleInputValidation(() => date().typeError('Invalid date').required('Time-out is required').validate(e), (error) => setFormValidationState({...formValidationState, out: error}), () => setFormValidationState({...formValidationState, out: null}));
                                        }}
                                        slotProps={{
                                            field: {clearable: true},
                                            textField: {
                                                sx: {flex: 1},
                                                required: true,
                                                fullWidth: true,
                                                error: !!formValidationState.out, 
                                                helperText: formValidationState.out
                                            }
                                        }}
                                        />
                                    </div>
                                    <div className="row">
                                        <TextField fullWidth type='number' label="Total Breaktime Hour(s)" 
                                        value={formValues.time_schedule? formValues.time_schedule.break_time_hours : 0} 
                                        error={!!formValidationState.break_time_hours}
                                        helperText={formValidationState.break_time_hours}
                                        onChange={(e) => {
                                            setFormValues({...formValues, time_schedule: {out: formValues.time_schedule? formValues.time_schedule.out : "", in: formValues.time_schedule? formValues.time_schedule.in : "", break_time_hours: +e.target.value}})
                                            handleInputValidation(() => number().min(0).max(5).validate(e.target.value), (error) => setFormValidationState({...formValidationState, break_time_hours: error}), () => setFormValidationState({...formValidationState, break_time_hours: null}))
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
                                        <strong>{formValues.time_schedule? formValues.time_schedule.break_time_hours : 0}</strong>
                                    </div>
                                    <div className="data" style={{color: totalHours - Number(formValues.time_schedule? formValues.time_schedule.break_time_hours : 0) < 1? "red": "inherit"}}>
                                        <h6>Work Hour(s):</h6>
                                        <strong>{totalHours - Number(formValues.time_schedule? formValues.time_schedule.break_time_hours : 0)}</strong>
                                    </div>
                                </Paper>
                            </Box>
                        </Collapse>
                    </Form>
                </DialogContent>
                <DialogActions>
                     <Button loading={isLoading} loadingPosition='end' onClick={handleCancel} autoFocus>
                       CANCEL
                    </Button>
                    <Button loading={isLoading} loadingPosition='end' onClick={() => {
                        handleClearForm()
                    }} autoFocus>
                        Clear form
                    </Button>
                    <Button loading={isLoading} loadingPosition='end' variant='contained' onClick={handleSubmit} autoFocus>
                        Submit
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    )
}



export default CreateTimesheetForm;