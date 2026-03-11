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
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker'
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
    InputLabel,
    MenuItem,
    Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import doApiRequest from '@/app/helpers/doApiRequest';

interface IAdjustTimesheetThresholdFormDialog {
    container?: any,
    state: boolean,
    timesheet: ITimesheetFromDB,
    onClose: () => void,
    onSuccess?: (data: {threshold_late: number, threshold_absent: number, timein_schedule: string | null}) => void,
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


type TFormValidation = {
    threshold_late: string | null,
    threshold_absent: string | null
}

const formValidationDefaultState:TFormValidation = {
    threshold_absent: null,
    threshold_late: null
}

const AdjustTimesheetThresholdForm: React.FC<IAdjustTimesheetThresholdFormDialog> = ({
    container,
    state,
    timesheet,
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
    const [scheduleSelect, setScheduleSelect] = React.useState<"employee" | "create">("employee");
    const [formValidationState, setFormValidationState] = React.useState({...formValidationDefaultState});
    const [timeinDateEditValue, setTimeinDateEditValue] = React.useState("2022-08-03 07:00");
    const [timeinDateDefaultValue, setTimeinDateDefaultValue] = React.useState("2022-08-03 07:00");
    const [formDefaultValues, setFormDefaultValues] = React.useState<{threshold_late: number, threshold_absent: number}>({
        threshold_late: timesheet.threshold_late,
        threshold_absent: timesheet.threshold_absent
    });

    const [formEditValues, setFormEditValues] = React.useState<{threshold_late: number, threshold_absent: number}>({
        threshold_late: timesheet.threshold_late,
        threshold_absent: timesheet.threshold_absent
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
        if(
            formDefaultValues.threshold_absent == formEditValues.threshold_absent && formDefaultValues.threshold_late == formEditValues.threshold_late &&
            ((timesheet.timein_schedule == null && scheduleSelect == "employee") || (timesheet.timein_schedule !== null && scheduleSelect == "create" && timeinDateDefaultValue == timeinDateEditValue))
        ) {
            onClose();
            return;
        }

        try {
            await object({
                threshold_late: number().min(0).max(20).required("Threshold late is required"),
                threshold_absent: number().min(0).max(120).required("Threshold absent is required")
            }).validate({
                ...formEditValues
            });

            if(Number(formEditValues.threshold_absent) > 0 && Number(formEditValues.threshold_absent) <= Number(formEditValues.threshold_late)) {
                setFormValidationState({...formValidationState, threshold_absent: "Threshold Absent must be greater than the Late threshold"});
                throw "Threshold Absent must be greater than the Late threshold"
            }

            doApiRequest(
                "/api/private/update/update-timesheet",
                (data) => {
                    if(onSuccess) onSuccess({...formEditValues, timein_schedule: scheduleSelect == "create"? `${new Date(timeinDateEditValue as string).getHours()}:${new Date(timeinDateEditValue as string).getMinutes()}` : null});
                    enqueueSnackbar("Update Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                    if(onError) onError(error.message);
                },
                {
                    method: "POST",
                    body: JSON.stringify({...timesheet, threshold_absent: String(formEditValues.threshold_absent), threshold_late: String(formEditValues.threshold_late), timein_schedule: scheduleSelect == "create"? `${new Date(timeinDateEditValue as string).getHours()}:${new Date(timeinDateEditValue as string).getMinutes()}` : null}),
                }
            )
            
        }
        catch {
            enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
        }
    }

    const handleCancel = () => {
        setFormEditValues({...formDefaultValues});
        onClose();
    }

    React.useEffect(() => {
        if(timesheet.timein_schedule == null) {
            setScheduleSelect("employee");
            setTimeinDateEditValue("2022-08-03 07:00");
            setTimeinDateDefaultValue("2022-08-03 07:00");
        } else {
            setScheduleSelect("create");
            const [H, M] = timesheet.timein_schedule.split(":");
            const D = new Date();
            D.setHours(+H);
            D.setMinutes(+M);

            setTimeinDateEditValue(D.toString());
            setTimeinDateDefaultValue(D.toString());
        }

        setFormDefaultValues({
            threshold_late: timesheet.threshold_late,
            threshold_absent: timesheet.threshold_absent
        });

        setFormEditValues({
            threshold_late: timesheet.threshold_late,
            threshold_absent: timesheet.threshold_absent
        });
    }, [timesheet])
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
                    Timesheet Settings
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
                                </FormControl >                                  
                        </div>
                        {
                            scheduleSelect == "create"?
                                <div className="row">
                                    <MobileTimePicker 
                                    label='Time-in Schedule'
                                    value={dayjs(timeinDateEditValue)} 
                                    onChange={(e) => e? setTimeinDateEditValue(e.toString()) : null}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                    />
                                </div> : ""
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
                            value={formEditValues.threshold_late}
                            error={!!formValidationState.threshold_late}
                            helperText={formValidationState.threshold_late}
                            onChange={(e) => {
                                setFormEditValues({...formEditValues, threshold_late: Number(e.target.value)});
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
                            value={formEditValues.threshold_absent}
                            error={!!formValidationState.threshold_absent}
                            helperText={formValidationState.threshold_absent}
                            onChange={(e) => {
                                setFormEditValues({...formEditValues, threshold_absent: Number(e.target.value)})
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
                        handleCancel()
                    }} autoFocus>
                        Cancel
                    </Button>
                    <Button loading={isLoading} loadingPosition='end' variant='contained' onClick={handleSubmit} autoFocus>
                        Apply
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    )
}



export default AdjustTimesheetThresholdForm;