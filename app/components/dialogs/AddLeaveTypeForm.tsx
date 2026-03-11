"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import useConfirmModal from '../ConfirmModal/useConfirmModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { enqueueSnackbar } from 'notistack';
import ILeaveTypes, { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

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
    Select,
    FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import doApiRequest from '@/app/helpers/doApiRequest';

interface IAddLeaveTypeFormDialog {
    container?: any,
    state: boolean,
    onClose: () => void,
    onSuccess?: (data: ILeaveTypesFromDB) => void,
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
            justify-content: center;

            > .input {
                flex: 1;
            }
        }
    }
`

const defaultFormValues = {
    title: "",
    yearly_credits: "",
    paid: ""
}

const defaultFormValidation: {
    title: string | null,
    yearly_credits: string | null,
    paid: string | null
} = {
    title: null,
    yearly_credits: null,
    paid: null
}

const AddLeaveTypeFormDialog: React.FC<IAddLeaveTypeFormDialog> = ({
    container,
    state,
    onClose,
    onSuccess,
    onError
}) => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = React.useState(false);
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [showYearlyCreditsHelperText, setShowYearlyCreditsHelperText] = React.useState(false);
    const [formValues, setFormValue] = React.useState({...defaultFormValues});
    const [formValidation, setFormValidation] = React.useState({...defaultFormValidation});

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
                title: string().max(35).required(),
                yearly_credits: number().min(1).required(),
                paid: string().required()
            }).validate({...formValues});

            doApiRequest<ILeaveTypesFromDB>(
                "/api/private/post/add-leave-type",
                (data) => {
                    onSuccess && onSuccess(data);
                    setFormValue({...defaultFormValues});
                    setFormValidation({...defaultFormValidation});
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST",
                    body: JSON.stringify({...formValues})
                }
            )
        }
        catch {
            enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
        }
    }

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
                onClose={onClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                    Add Leave Type
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
                            <TextField label="Title" variant="outlined" fullWidth 
                            error={!!formValidation.title}
                            helperText={formValidation.title}
                            value={formValues.title}
                            onChange={(e) => {
                                setFormValue({...formValues, title: e.target.value});
                                handleInputValidation(() => string().max(35).required().validate(e.target.value), (error) => setFormValidation({...formValidation, title: error}), () => setFormValidation({...formValidation, title: null}))

                            }}/>
                        </div>
                        <div className="row">
                            <TextField type="number" label="Yearly Leave Credits" variant="outlined" fullWidth
                            error={!!formValidation.yearly_credits}
                            helperText={formValidation.yearly_credits}
                            value={Number(formValues.yearly_credits)}
                            onChange={(e) => {
                                setFormValue({...formValues, yearly_credits: e.target.value});
                                handleInputValidation(() => number().min(1).required().validate(e.target.value), (error) => setFormValidation({...formValidation, yearly_credits: error}), () => setFormValidation({...formValidation, yearly_credits: null}))
                            }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                        <IconButton
                                        onClick={() => setShowYearlyCreditsHelperText(!showYearlyCreditsHelperText)}
                                        edge="end"
                                        >
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </InputAdornment>
                                    )
                                }
                            }} />
                            {
                                showYearlyCreditsHelperText? <Alert severity="info" sx={{marginTop: '5px'}}>
                                    <AlertTitle>Yearly Leave Credits:</AlertTitle>
                                        The annual leave entitlement assigned to an employee. This represents the maximum number of leave days the employee may use within the calendar year.
                                    </Alert> : ""
                            }
                        </div>
                        <div className="row">
                            <FormControl fullWidth>
                                <InputLabel>Paid Leave</InputLabel>
                                <Select
                                label="Time-in Schedule"
                                error={!!formValidation.paid}
                                value={formValues.paid}
                                onChange={(e) => {
                                    setFormValue({...formValues, paid: e.target.value});
                                    handleInputValidation(() => string().required().validate(e.target.value), (error) => setFormValidation({...formValidation, paid: error}), () => setFormValidation({...formValidation, paid: null}))
                                }}
                                >
                                    <MenuItem value="paid">Paid Leave</MenuItem>
                                    <MenuItem value="not-paid">Not a Paid Leave</MenuItem>
                                </Select>
                                <FormHelperText>{formValidation.paid || " "}</FormHelperText>
                            </FormControl >                                  
                        </div>
                    </Form>
                </DialogContent>
                <DialogActions>
                    <Button loading={isLoading} loadingPosition='end' onClick={onClose} autoFocus>
                        Cancel
                    </Button>
                    <Button loading={isLoading} loadingPosition='end' variant='contained' onClick={handleSubmit} autoFocus>
                        Add
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    )
};

export default AddLeaveTypeFormDialog;