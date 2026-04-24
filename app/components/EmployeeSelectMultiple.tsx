import React, { useState, SyntheticEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import doApiRequest from '../helpers/doApiRequest';
import { enqueueSnackbar } from 'notistack';
import { Avatar, Box, Chip } from '@mui/material';

export type EmployeeSelectData = {
    employee_id: string;
    first_name: string,
    middle_name: string | null,
    surname: string,
    ext_name: string | null
    display_picture: string | null;
    designation: string
}

const EmployeeSelectMultiple: React.FC<{onChange: (e:EmployeeSelectData[]) => void, value: EmployeeSelectData[], required?: boolean}> = ({onChange, required, value}) => {
    const [options, setOptions] = React.useState<EmployeeSelectData[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleOptionChange = (event: SyntheticEvent, option: EmployeeSelectData[]) => {
        onChange(option);
    };

    React.useEffect(() => {
        doApiRequest<EmployeeSelectData[]>(
            "/api/private/get/get-employees-small-data",
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
        slotProps={{popper: {sx: {zIndex: 2000}}}}
        sx={{flex: 1}}
        options={options}
        multiple
        getOptionLabel={(option) => `${option.first_name.toUpperCase()} ${option.middle_name? option.middle_name[0].toUpperCase() + "." : ""} ${option.surname.toUpperCase()} ${option.ext_name? option.ext_name.toUpperCase() : ""}`}
        renderOption={({key, ...rest}, option) => (
            <Box component="li" sx={{fontSize: '11px'}} key={option.employee_id} {...rest}>
                <Avatar
                sx={{height: '30px', width: '30px', marginRight: '10px'}}
                src={option.display_picture? `/images/avatar/${option.display_picture}` : undefined}
                alt=""
                />
                {`${option.first_name.toUpperCase()} ${option.middle_name? option.middle_name[0].toUpperCase() + "." : ""} ${option.surname.toUpperCase()} ${option.ext_name? option.ext_name.toUpperCase() : ""}`}
            </Box>
        )}
        value={value}
        onChange={handleOptionChange}
        renderInput={(params) => (
            <TextField 
            required={required} {...params} fullWidth label="Select Employee" variant="outlined" />
        )}
        renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
                <Chip
                    {...getTagProps({ index })}
                    key={option.employee_id}
                    avatar={<Avatar alt={option.surname} src={`/images/avatar/${option.display_picture}`} />}
                    label={`${option.first_name.toUpperCase()} ${option.middle_name? option.middle_name[0].toUpperCase() + "." : ""} ${option.surname.toUpperCase()} ${option.ext_name? option.ext_name.toUpperCase() : ""}`}
                    sx={{
                        background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)",
                        color: "#fff",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        "& .MuiChip-deleteIcon": {
                            color: "#fff",
                            "&:hover": {
                                color: "#ffffffc1",
                            },
                        },
                    }}
                    variant="filled"
                />
            ))
        }
        />

        );
};

export default EmployeeSelectMultiple
