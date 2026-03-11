"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import useConfirmModal from '../ConfirmModal/useConfirmModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { enqueueSnackbar } from 'notistack';
import ITimesheet, { ITimesheetFromDB } from '@/app/types/timesheet';
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { 
    Box,
    Button,
    IconButton,
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
    Select,
    InputLabel,
    MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import doApiRequest from '@/app/helpers/doApiRequest';

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
            justify-content: center;

            > .input {
                flex: 1;
            }
        }
    }
`

const formDefaultValues:ITimesheet = {
    title: "",
    date: "",
    timein_schedule: "2022-08-03 07:00",
    threshold_late: 5,
    threshold_absent: 30
}

type TFormValidation = {
    title: string | null,
    date: string | null,
    threshold_late: string | null,
    threshold_absent: string | null
}

const formValidationDefaultState:TFormValidation = {
    title: null,
    date: null,
    threshold_absent: null,
    threshold_late: null
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
                threshold_absent: number().min(0).max(120).required("Threshold absent is required")
            }).validate({
                ...formValues
            });

            if(Number(formValues.threshold_absent) > 0 && Number(formValues.threshold_absent) <= Number(formValues.threshold_late)) {
                setFormValidationState({...formValidationState, threshold_absent: "Threshold Absent must be greater than the Late threshold"});
                throw "Threshold Absent must be greater than the Late threshold"
            }

            doApiRequest<ITimesheetFromDB>(
                "/api/private/post/add-timesheet",
                (data) => {
                    console.log(data);
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
                    body: JSON.stringify({...formValues, timein_schedule: scheduleSelect == "create"? `${new Date(formValues.timein_schedule as string).getHours()}:${new Date(formValues.timein_schedule as string).getMinutes()}` : null}),
                }
            )
            
        }
        catch {
            enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
        }
    }
    const handleClearForm = () => {
        confirm("Are you sure you want to clear your inputs?", () => {
            setFormValues({...formDefaultValues});
            setScheduleSelect("employee");
        })
    }

    return(
        <React.Fragment>
            <ConfirmModal severity='warning' buttonText='Yes' context={modal} />
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
                            <FormControl fullWidth>
                                <InputLabel>Time-in Schedule</InputLabel>
                                <Select
                                MenuProps={{
                                    sx: { zIndex: 2000 },
                                }}
                                value={scheduleSelect}
                                label="Time-in Schedule"
                                onChange={(e) => setScheduleSelect(e.target.value)}
                                >
                                    <MenuItem value="employee">Use Employee Schedule</MenuItem>
                                    <MenuItem value="create">Set Time-in Schedule</MenuItem>
                                </Select>
                                </FormControl>
                        </div>
                        {
                            scheduleSelect == "create"?
                            <div className="row">
                                <MobileTimePicker value={dayjs(formValues.timein_schedule)} label='Time-in Schedule'
                                onChange={(e) => setFormValues({...formValues, timein_schedule: e? e.toString() : null})}
                                slotProps={{
                                textField: {
                                    fullWidth: true
                                }
                                }}
                                />
                            </div> : ''
                        }
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
                            {
                                showThresholdLateHelp? <Alert severity="info" sx={{marginTop: '5px'}}>
                                    <AlertTitle>Treshold Late</AlertTitle>
                                        Set the grace period (in minutes) after the scheduled time-in.
                                        Time-ins beyond this period will be marked as Late.
                                    </Alert> : ""
                            }
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
                            {
                                showThresholdAbsentHelp? <Alert severity="info" sx={{marginTop: '5px'}}>
                                    <AlertTitle>Treshold Absent</AlertTitle>
                                    Defines the number of minutes after the scheduled time-in beyond which an employee is considered Absent.
                                    If set to 0, only the late threshold will apply, and the employee will be marked Late if applicable.
                                    This value must be greater than the Late threshold.
                                </Alert> : ""
                            }
                        </div>
                    </Form>
                </DialogContent>
                <DialogActions>
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