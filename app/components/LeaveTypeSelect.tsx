import React, { useState, SyntheticEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Avatar, Box, IconButton } from '@mui/material';
import doApiRequest from '../helpers/doApiRequest';
import { enqueueSnackbar } from 'notistack';
import { ILeaveTypesFromDB } from '../types/leave-types-from-db';

const LeaveTypeSelector: React.FC<{onChange: (e:ILeaveTypesFromDB | null) => void, value: ILeaveTypesFromDB | null, required?: boolean}> = ({onChange, value, required}) => {
    const [options, setOptions] = React.useState<ILeaveTypesFromDB[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleOptionChange = (event: SyntheticEvent, option: ILeaveTypesFromDB | null) => {
        onChange(option)
    };

    React.useEffect(() => {
        doApiRequest<ILeaveTypesFromDB[]>(
            "/api/private/get/get-leave-types",
            (data) => {
                setOptions([...data]);
            },
            (state) => setIsLoading(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
        )
    }, []);

    return (
        <Autocomplete
        sx={{flex: 1}}
        options={options}
        getOptionLabel={(option) => option.title}
        renderOption={({key, ...rest}, option) => (
            <Box component="li" sx={{fontSize: '11px'}} key={option.id} {...rest}>
                {option.title}
            </Box>
        )}
        value={value}
        onChange={handleOptionChange}
        renderInput={(params) => (
            <TextField required={required} {...params} label="Search resident" variant="outlined" />
        )}
        />

        );
};

export default LeaveTypeSelector;
