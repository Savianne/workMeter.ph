"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import { object, number, string, date, mixed, ValidationError } from 'yup';

import { 
    Box,
    IconButton,
    InputBase
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import doApiRequest from '@/app/helpers/doApiRequest';
import { ITimesheetFromDB } from '@/app/types/timesheet';
import CloseIcon from '@mui/icons-material/Close';
import { enqueueSnackbar } from 'notistack';

interface IManageTimesheetName extends IStyledFC {
    timesheet: ITimesheetFromDB
    onEditSuccess: (name: string) => void
}

const ManageTimesheetNameFC: React.FC<IManageTimesheetName> = ({className, timesheet, onEditSuccess}) => {
    const [defaultvalue, setDefaultValue] = React.useState(timesheet.title);
    const [editNameValue, setEditNameValue] = React.useState(timesheet.title);
    const [editState, setEditState] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleCancel = () => {
        setEditState(false);
        setEditNameValue(defaultvalue);
    }
    const handleSubmit = async () => {
        if(editNameValue === defaultvalue) {
            setEditState(false);
            return;
        }
        
        if(editNameValue.length < 5 || editNameValue.length > 30) {
            enqueueSnackbar("The title must be greater than 5 characters and no more than 30 characters long.", {variant: "warning", anchorOrigin: {vertical: "top", horizontal: "center"}})
            return;
        }

        await doApiRequest(
            "/api/private/update/update-timesheet",
            (data) => {
                enqueueSnackbar("Update Done!", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                onEditSuccess(editNameValue);
                setEditState(false);
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
            {
                method: "POST",
                body: JSON.stringify({...timesheet, title: editNameValue})
            }
        )
    }

    React.useEffect(() => {
        setEditNameValue(timesheet.title);
        setDefaultValue(timesheet.title);
        setEditState(false);
        console.log(timesheet.title)
    }, [timesheet]);

    return (
        <span className={className}>
            {
                editState? 
                <Box className="edit-input-group">
                    <InputBase
                        className='input-base'
                        placeholder="Timesheet Name"
                        value={editNameValue}
                        onChange={(e) => {
                            setEditNameValue(e.target.value)
                        }}
                    />
                    <IconButton loading={isLoading} aria-label="cancel" size="small" onClick={handleCancel} sx={{width: '30px', height: '30px'}}>
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton loading={isLoading} aria-label="edit" size="small" onClick={handleSubmit} sx={{width: '30px', height: '30px'}}>
                        <CheckIcon fontSize="inherit" />
                    </IconButton>
                </Box> :
                <>
                    <h3>{defaultvalue}</h3>
                    <IconButton aria-label="edit" size="small" onClick={() => setEditState(true)}>
                        <EditIcon fontSize="inherit" />
                    </IconButton>
                </>
            }
            
        </span>
    )
}

const ManageTimesheetName = styled(ManageTimesheetNameFC)`
    && {
        display: inline-flex;
        gap: 5px;

        > .edit-input-group {
           display: flex;

            > .input-base {
                display: flex;
                font-size: 18px;
                font-weight: bold;
                width: 30ch;
                border-bottom: 1px solid ${({theme}) => theme.palette.text.primary};
            }
        }
    }
`;

export default ManageTimesheetName;