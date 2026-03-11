"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import ITimesheet from '@/app/types/timesheet';
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { 
    Box,
    Button,
    IconButton,
    Paper,
    InputAdornment,
    Alert,
    AlertTitle,
    TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const formDefaultValues:ITimesheet = {
    title: "",
    date: "",
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

const CreateTimesheetFormFC: React.FC<IStyledFC> = ({className}) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [formValidationState, setFormValidationState] = React.useState({...formValidationDefaultState})
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

    return(
        <Box className={className}>
            <div className="row" style={{marginBottom: "20px"}}>
                <h1>Create Timesheet</h1>
            </div>
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
                    setFormValues({...formValues, date: e? e.toString() : ""})
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
                            edge="end"
                            >
                                <HelpOutlineIcon />
                            </IconButton>
                        </InputAdornment>
                        )
                    }
                }}
                />
            </div>
            <div className="row">
                <Alert severity="info" >
                    <AlertTitle>Treshold Late</AlertTitle>
                    Set the grace period (in minutes) after the scheduled time-in.
                    Time-ins beyond this period will be marked as Late.
                </Alert>
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
                            >
                                <HelpOutlineIcon />
                            </IconButton>
                        </InputAdornment>
                        )
                    }
                }}
                />
            </div>
            <div className="row">
                <Button loading={isLoading} variant='contained' fullWidth endIcon={<AddIcon />}>Create Timesheet</Button>
            </div>
        </Box>
    )
}

const CreateTimesheetForm = styled(CreateTimesheetFormFC)`
    && {
        display: flex;
        flex: 0 1 500px;
        flex-wrap: wrap;
        padding: 50px 15px;
        gap: 15px;

        > .row {
            display: flex;
            flex: 0 1 100%;
            flex-wrap: wrap;
            justify-content: center;

            > .input {
                flex: 1;
                min-width: 200px;
                max-width: 500px;
            }
        }
    }
`;

export default CreateTimesheetForm;