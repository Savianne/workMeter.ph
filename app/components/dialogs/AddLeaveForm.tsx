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
import { enqueueSnackbar } from 'notistack';
import LeaveTypeSelector from '../LeaveTypeSelect';
import { DatePicker } from '@mui/x-date-pickers';
import { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import { EmployeeSelectData } from '../EmployeeSelect';

type EmployeeData = {
    employee_id: string;
    first_name: string,
    middle_name: string | null,
    surname: string,
    ext_name: string | null
    display_picture: string | null
}

import { 
    Box,
    Button,
    IconButton,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import doApiRequest from '@/app/helpers/doApiRequest';

interface IFormValue {
    date: string | null;
    employee: EmployeeSelectData | null;
    leaveType: ILeaveTypesFromDB | null;
    status: "pending" | "approved" | "denied";
}

interface IAddLeaveFormDialog {
    container?: any,
    state: boolean,
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
            justify-content: center;

            > .input {
                flex: 1;
            }
        }
    }
`

const AddLeaveFormDialog: React.FC<IAddLeaveFormDialog> = ({
    container,
    state,
    onClose,
    onSuccess,
    onError
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isLoading, setIsLoading] = React.useState(false);
    const [formValues, setFormValues] = React.useState<IFormValue>({employee: null, leaveType: null, date: "", status: "pending"});
    const [validationError, setValidationError] = React.useState<string | null>(null);


    const handleSubmit = async () => {
        if(Object.values({...formValues}).includes(null)) {
            return setValidationError("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.");
        }

        doApiRequest<TLeaveRequestFromDB>(
            "/api/private/post/add-leave",
            (data) => {
                setValidationError(null);
                setFormValues({employee: null, leaveType: null, date: "", status: "pending"});
                if(onSuccess) onSuccess(data);
                onClose();
            }, 
            (state) => setIsLoading(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: error.code == "IS_DAYOFF" || error.code == "NO_SCHED" || error.code == "INACTIVE_EMPLOYEE" || error.code == "NO_LEAVE_CREDITS_AVAILABLE"? "warning" : "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
            {
                method: "POST",
                body: JSON.stringify({employee_id: formValues.employee?.employee_id, date: dayjs(formValues.date).format('YYYY/MM/DD'), status: formValues.status, paid: formValues.leaveType?.paid, leave_type: formValues.leaveType?.id})
            }
        )
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
                    Add Leave
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
                            {
                                validationError? 
                                <Alert color='error'>
                                    {validationError}
                                </Alert> : ""
                            }
                            
                        </div>
                        <div className="row">
                            <EmployeeSelect required value={formValues.employee} onChange={(data) => setFormValues({...formValues, employee: data})} />
                        </div>
                        <div className="row">
                            <DatePicker label="Date of Leave" sx={{flex: 1, minWidth: '120px'}} 
                            slotProps={{field: { clearable: true}, textField: {required: true}}}
                            value={formValues.date? dayjs(formValues.date) : null}
                            onChange={(e) => setFormValues({...formValues, date: e? e.toString() : null})}
                            />
                        </div>
                        <div className="row">
                            <LeaveTypeSelector required value={formValues.leaveType} onChange={(data) => setFormValues({...formValues, leaveType: data})}/>
                        </div>
                        <div className="row">
                            <FormControl sx={{ flex: 1, minWidth: '120px'}} required>
                                <InputLabel id="sex-label">Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={formValues.status}
                                    onChange={(e) => {
                                        setFormValues({...formValues, status: e.target.value});
                                    }}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="denied">Denied</MenuItem>
                                </Select> 
                            </FormControl>
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
}

export default AddLeaveFormDialog;