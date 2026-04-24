import * as React from 'react';
import { styled } from '@mui/material/styles';
import useConfirmModal from '../ConfirmModal/useConfirmModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import dayjs, { Dayjs } from 'dayjs';
import debounce from "lodash/debounce";
import { DatePicker } from '@mui/x-date-pickers';
import { EmployeeTableData } from '@/app/types/employee-table-data';
import { usePlacesWidget } from "react-google-autocomplete";
import { enqueueSnackbar } from 'notistack';
import InternationalPhoneInput from '../InternationalPhoneInput';
import { PhoneNumberUtil } from 'google-libphonenumber';
import playErrorSound from '../helpers/playErrorSound';
import playNotifSound from '../helpers/playNotifSound';

import { 
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Alert,
    OutlinedInput,
    InputAdornment
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

import Yup, { object, string, date, mixed, number, ValidationError } from 'yup';
import doApiRequest from '@/app/helpers/doApiRequest';

interface IAddEmployeeFormDialog {
    state: boolean,
    onClose: () => void,
    onSuccess?: (data: EmployeeTableData) => void,
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
        max-width: 1000px;
        flex-wrap: wrap;
        gap: 10px;

        > .row {
            display: flex;
            flex: 0 1 100%;
            gap: 10px;
            flex-wrap: wrap;

            > .row-title {
                flex: 0 1 100%;
            }

            > .address-group {
                display: flex;
                flex: 0 1 100%;
                gap: 10px;
            }
        }
    }
`

interface IAddressAutoComplete {
    onPlaceSelected: (value: {
        region: string;
        province: string;
        city: string;
        country: string;
        formatedAddress: string
    }) => void
}

const AddressAutoComplete: React.FC<IAddressAutoComplete> = ({onPlaceSelected}) => {
    const { ref, autocompleteRef } = usePlacesWidget({
        apiKey: "AIzaSyCOcRov_9qcsPfKfyhkhcsk75WbTOntg4A",
        options: {type: ["address"]},
        onPlaceSelected: (place) => {
            let addressObject:any = {};
            
            if(place && place.address_components) {
                place.address_components.forEach((item:any) => {
                    switch(item.types[0]) {
                        case "locality":
                            addressObject.city = item.long_name;
                            break;
                        case "administrative_area_level_1":
                            addressObject.region = item.long_name;
                            break;
                        case "administrative_area_level_2":
                            addressObject.province = item.long_name;
                        case "country":
                            addressObject.country = item.long_name;
                    }
                });
            }

            onPlaceSelected({...addressObject, formatedAddress: (place && place.address_components)? place.formatted_address : ""});
        }
    });

    return(
        <TextField
        className="input-base"
        inputRef={ref}
        sx={{ ml: 1, flex: 1}}
        placeholder="Company Address"
        />
    )
}

const today = new Date();
const tenYearsAgo = new Date(
  today.getFullYear() - 10,
  today.getMonth(),
  today.getDate()
);

const maritalStatuses = ["Single","Married","Divorced","Separated","Widowed","Annulled"];

const ValidateFormValues = object({
    first_name: string().min(2).max(25).required("First Name is a required field"),
    middle_name: string().max(25).nullable(),
    surname: string().required("Surname is a required field"),
    ext_name: string().max(15).nullable(),
    date_of_birth: date().max(tenYearsAgo, 'Date must be at least 10 years before today')
        .typeError('Invalid date')
        .required('Date is required'),
    date_hired: date()
        .typeError('Invalid date')
        .required('Date is required'),
    sex: mixed()
        .oneOf(['Male', 'Female'] as const)
        .defined(),
    email: string()
        .email('Invalid email format')
        .required('Email is required'),
    marital_status: string().min(2).max(25).required("Marital Status is a required field"),
    citizenship: string().min(2).max(25).required("Citizeship is a required field"),
    designation: string().required("Designation is a required field"),
    employment_status: string().required(),
    salary_basis: mixed().oneOf(['monthly', 'daily', 'hourly'] as const).defined(),
    salary: number().positive("Must be greater than 0").typeError("Must be a number").required()
});

const ValidationAddessInputs = object({
    region: string().required("Address is required"),
    province: string().nullable(),
    city: string().required("Address is required"),
    country: string().required("Address is required")
})

const emptyForm = {
    first_name: "",
    middle_name: "",
    surname: "",
    ext_name: "",
    date_of_birth:  dayjs(tenYearsAgo),
    date_hired: dayjs(),
    employment_status: "",
    sex: "",
    email: "",
    cp_number: "",
    marital_status: "",
    citizenship: "",
    designation: "",
    salary_basis: "",
    salary: ""
}

const phoneUtil = PhoneNumberUtil.getInstance();

const isPhoneValid = (phone: string) => {
    try {
        return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
    } catch (error) {
        return false;
    }
};

const AddEmployeeFormDialog:React.FC<IAddEmployeeFormDialog> = ({
    state,
    onClose,
    onSuccess,
}) => {
    const theme = useTheme();
    const {modal, confirm} = useConfirmModal()
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [designations, setDesignations] = React.useState<({designation_id: number, designation_name: string})[]>([]);
    const [employeeAddressInputValue, setEmployeeAddressInputValue] = React.useState<string | null>(null);
    const [isOnSubmit, setIsOnSUbmit] = React.useState(false);
    const [employeeAddress, setEmployeeAddress] = React.useState({
        region: "",
        province: "",
        city: "",
        country: ""
    });
    const [inputValidation, setInputValidation] = React.useState<{
        first_name: string | null,
        middle_name: string | null,
        surname: string | null,
        ext_name: string | null,
        date_of_birth:   string | null,
        sex: string | null,
        email: string | null,
        cp_number: string | null,
        marital_status: string | null,
        citizenship: string | null,
        designation: string | null,
        date_hired: string | null,
        employment_status: string | null,
        salary_basis: string | null,
        salary: string | null
    }>({
        first_name: null,
        middle_name: null,
        surname: null,
        ext_name: null,
        date_of_birth: null,
        sex: null,
        email: null,
        cp_number: null,
        marital_status: null,
        citizenship: null,
        designation: null,
        date_hired: null,
        employment_status: null,
        salary_basis: null,
        salary: null
    });

    const [formValues, setFormValues] = React.useState<{
        first_name: string,
        middle_name: string,
        surname: string,
        ext_name: string,
        date_of_birth:   Dayjs | null,
        sex: string,
        email: string,
        cp_number: string,
        marital_status: string,
        citizenship: string,
        designation: string,
        date_hired: Dayjs | null,
        employment_status: string,
        salary_basis: string,
        salary: string,
    }>({...emptyForm});

    const handleInputValidation = React.useMemo(
        () => 
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

    const handleClearForm = () => {
        confirm("Are you sure you want to clear your inputs?", () => {
            setFormValues({...emptyForm});
            setEmployeeAddressInputValue(null);
            setEmployeeAddress({
                region: "",
                province: "",
                city: "",
                country: ""
            })
        })
    }

    const handleSubmit= async () => {
        try {
            await ValidateFormValues.validate({...formValues}, {abortEarly: true});
            await ValidationAddessInputs.validate({...employeeAddress});
            if(!isPhoneValid(formValues.cp_number)) {
                throw {message:"Invalid phone number"}
            }

            doApiRequest<{employee_id: string}>(
                "/api/private/post/add-employee",
                (data) => {
                    playNotifSound();
                    enqueueSnackbar("Added new record", {variant: "success", anchorOrigin: {vertical: "top", horizontal: "center"}});
                    if(onSuccess) onSuccess({
                        employee_id: data.employee_id,
                        first_name: formValues.first_name,
                        middle_name: formValues.middle_name,
                        surname: formValues.surname,
                        ext_name: formValues.ext_name,
                        date_of_birth: formValues.date_of_birth as any,
                        sex: formValues.sex,
                        email: formValues.email,
                        cp_number: formValues.cp_number,
                        marital_status: formValues.marital_status,
                        citizenship: formValues.citizenship,
                        display_picture: null,
                        designation: formValues.designation,
                        employment_status: formValues.employment_status,
                        salary_basis: formValues.salary_basis as "monthly" | "daily" | "hourly",
                        salary: Number(formValues.salary),
                        date_hired: formValues.date_hired as any
                    })
                    setFormValues({...emptyForm});
                    setEmployeeAddressInputValue(null);
                    setEmployeeAddress({
                        region: "",
                        province: "",
                        city: "",
                        country: ""
                    })

                },
                (state) => setIsOnSUbmit(state),
                (error) => {
                    playErrorSound()
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST",
                    body: JSON.stringify({...formValues, date_of_birth: dayjs(formValues.date_of_birth).format('YYYY/MM/DD'), date_hired: dayjs(formValues.date_hired).format('YYYY/MM/DD'), address: {...employeeAddress}})
                } 
            )
        } catch(err:any) {
            playErrorSound();
            enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
        }
    }

    React.useEffect(() => {
        doApiRequest<typeof designations>(
            "/api/private/get/get-designations",
            (data) => setDesignations(data),
            (state) => {},
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
        )
    }, []);

    return (
        <React.Fragment>
            <ConfirmModal severity='warning' buttonText='Yes' context={modal} />
            <BootstrapDialog
                fullScreen={fullScreen}
                maxWidth="xl"
                open={state}
                slots={{
                    transition: Transition,
                }}
                onClose={onClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Add Employee
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
                            <h5 className='row-title'>Employment Information</h5>
                            <TextField disabled={isOnSubmit} label="Designation" variant="outlined" sx={{flex: 1, minWidth: '200px'}}
                            error={!!inputValidation.designation}
                            helperText={inputValidation.designation || " "}
                            value={formValues.designation}
                            onChange={(e) => {
                                setFormValues({...formValues, designation: e.target.value});
                                handleInputValidation(() => string().min(2).max(25).required().validate(e.target.value), (error) => setInputValidation({...inputValidation, designation: error}), () => setInputValidation({...inputValidation, designation: null}))
                            }} />
                            <FormControl disabled={isOnSubmit} sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.employment_status} required>
                                <InputLabel disabled={isOnSubmit} id="sex-label">Employment Status</InputLabel>
                                <Select
                                    label="Employmnet Status"
                                    disabled={isOnSubmit}
                                    value={formValues.employment_status}
                                    onChange={(e) => {
                                        setFormValues({...formValues, employment_status: e.target.value});
                                        handleInputValidation(() => mixed().oneOf(['Regular', 'Probationary', 'Contractual', 'Casual'] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, employment_status: error}), () => setInputValidation({...inputValidation, employment_status: null}))
                                    }}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value="Regular">Regular / Permanent</MenuItem>
                                    <MenuItem value="Probationary">Probationary</MenuItem>
                                    <MenuItem value="Contractual">Contractual / Fixed-term</MenuItem>
                                    <MenuItem value="Casual">Casual / Seasonal</MenuItem>
                                </Select> 
                                <FormHelperText>{inputValidation.employment_status || " "}</FormHelperText>
                            </FormControl>
                            <DatePicker disabled={isOnSubmit} label="Date Hired" sx={{flex: 1, minWidth: '120px'}} slotProps={{field: { clearable: true}, textField: {error: !!inputValidation.date_hired, helperText: inputValidation.date_hired? inputValidation.date_hired : ' '}}}
                            value={dayjs(formValues.date_hired)} 
                            onChange={(val: Dayjs | null) => {
                                setFormValues({...formValues, date_hired: val as Dayjs});
                                handleInputValidation(() => date().max(new Date(), 'Date must be less than the current date').typeError('Invalid date').required('Date is required').validate(val), (error) => setInputValidation({...inputValidation, date_hired: error}), () => setInputValidation({...inputValidation, date_hired: null}))
                            }}
                            />
                        </div>
                        <div className="row">
                            <h5 className='row-title'>Salary</h5>
                            <FormControl disabled={isOnSubmit} sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.salary_basis} required>
                                <InputLabel disabled={isOnSubmit}>Salary Basis</InputLabel>
                                <Select
                                    label="Salary Basis"
                                    disabled={isOnSubmit}
                                    value={formValues.salary_basis}
                                    onChange={(e) => {
                                        setFormValues({...formValues, salary_basis: e.target.value});
                                        handleInputValidation(() => mixed().oneOf(['monthly', 'daily', 'hourly'] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, salary_basis: error}), () => setInputValidation({...inputValidation, salary_basis: null}))
                                    }}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value="monthly">Monthly Basis</MenuItem>
                                    <MenuItem value="daily">Daily Basis</MenuItem>
                                    <MenuItem value="hourly">Hourly Basis</MenuItem>
                                </Select> 
                                <FormHelperText>{inputValidation.salary_basis || " "}</FormHelperText>
                            </FormControl>
                            <FormControl disabled={isOnSubmit} sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.salary} required>
                                <InputLabel htmlFor="outlined-adornment-salay">Salary</InputLabel>
                                <OutlinedInput
                                    disabled={isOnSubmit}
                                    value={formValues.salary}
                                    onChange={(e) => {
                                        setFormValues({...formValues, salary: e.target.value});
                                        handleInputValidation(() => number().positive("Must be greater than 0").typeError("Must be a number").required().validate(e.target.value), (error) => setInputValidation({...inputValidation, salary: error}), () => setInputValidation({...inputValidation, salary: null}))
                                    }}
                                    id="outlined-adornment-salary"
                                    startAdornment={<InputAdornment position="start">&#8369;</InputAdornment>}
                                    label="Salary"
                                    type='number'
                                />
                                <FormHelperText>{inputValidation.salary || " "}</FormHelperText>
                            </FormControl>
                        </div>
                        <div className="row">
                            <h5 className='row-title'>Full-name</h5>
                            <TextField disabled={isOnSubmit} label="First Name" variant="outlined" sx={{flex: 1, minWidth: '200px'}}
                            error={!!inputValidation.first_name}
                            helperText={inputValidation.first_name || " "}
                            value={formValues.first_name}
                            onChange={(e) => {
                                setFormValues({...formValues, first_name: e.target.value});
                                handleInputValidation(() => string().min(2).max(25).required("First Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, first_name: error}), () => setInputValidation({...inputValidation, first_name: null}))
                            }}
                            />
                            <TextField disabled={isOnSubmit} label="Middle Name" variant="outlined" sx={{flex: 1, minWidth: '200px'}}
                            error={!!inputValidation.middle_name}
                            helperText={inputValidation.middle_name || " "}
                            value={formValues.middle_name}
                            onChange={(e) => {
                                setFormValues({...formValues, middle_name: e.target.value});
                                handleInputValidation(() => string().max(15).nullable().validate(e.target.value), (error) => setInputValidation({...inputValidation, middle_name: error}), () => setInputValidation({...inputValidation, middle_name: null}))
                            }}/>
                            <TextField disabled={isOnSubmit} label="Last Name" variant="outlined" sx={{flex: 1, minWidth: '200px'}}
                            error={!!inputValidation.surname}
                            helperText={inputValidation.surname || " "}
                            value={formValues.surname}
                            onChange={(e) => {
                                setFormValues({...formValues, surname: e.target.value});
                                handleInputValidation(() => string().min(2).max(25).required("Last Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, surname: error}), () => setInputValidation({...inputValidation, surname: null}))
                            }}/>
                            <TextField disabled={isOnSubmit} label="Ext. Name" variant="outlined" sx={{flex: 1, minWidth: '200px'}}
                            error={!!inputValidation.ext_name}
                            helperText={inputValidation.ext_name || " "}
                            value={formValues.ext_name}
                            onChange={(e) => {
                                setFormValues({...formValues, ext_name: e.target.value});
                                handleInputValidation(() => string().max(15).nullable().validate(e.target.value), (error) => setInputValidation({...inputValidation, ext_name: error}), () => setInputValidation({...inputValidation, ext_name: null}))
                            }}/>
                        </div>
                        <div className="row">
                            <h5 className='row-title'>Personal Information</h5>
                            <FormControl disabled={isOnSubmit} sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.sex} required>
                                <InputLabel disabled={isOnSubmit} id="sex-label">Sex</InputLabel>
                                <Select
                                    label="Sex"
                                    disabled={isOnSubmit}
                                    value={formValues.sex}
                                    onChange={(e) => {
                                        setFormValues({...formValues, sex: e.target.value});
                                        handleInputValidation(() => mixed().oneOf(['Male', 'Female'] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, sex: error}), () => setInputValidation({...inputValidation, sex: null}))
                                    }}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                </Select> 
                                <FormHelperText>{inputValidation.sex || " "}</FormHelperText>
                            </FormControl>
                            <FormControl disabled={isOnSubmit} sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.marital_status} required>
                                <InputLabel id="sex-label">Marital Status</InputLabel>
                                <Select
                                    disabled={isOnSubmit}
                                    label="Marital Status"
                                    value={formValues.marital_status}
                                    onChange={(e) => {
                                        setFormValues({...formValues, marital_status: e.target.value});
                                        handleInputValidation(() => mixed().oneOf(["Single","Married","Divorced","Separated","Widowed","Annulled"] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, marital_status: error}), () => setInputValidation({...inputValidation, marital_status: null}))
                                    }}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {
                                        maritalStatuses.map(item => <MenuItem value={item}>{item}</MenuItem>)
                                    }
                                </Select>
                                <FormHelperText>{inputValidation.marital_status || " "}</FormHelperText> 
                            </FormControl>
                            <TextField disabled={isOnSubmit} label="Citizeship" variant="outlined" sx={{flex: 1, minWidth: '200px'}} required
                            error={!!inputValidation.citizenship}
                            helperText={inputValidation.citizenship || " "}
                            value={formValues.citizenship}
                            onChange={(e) => {
                                setFormValues({...formValues, citizenship: e.target.value});
                                handleInputValidation(() => string().min(2).max(25).required("Last Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, citizenship: error}), () => setInputValidation({...inputValidation, citizenship: null}))
                            }}
                            />
                            <DatePicker disabled={isOnSubmit} label="Date of Birth" maxDate={dayjs(tenYearsAgo)} sx={{flex: 1, minWidth: '120px'}} slotProps={{field: { clearable: true}, textField: {helperText: inputValidation.date_of_birth? inputValidation.date_of_birth : ' '}}}
                            value={dayjs(formValues.date_of_birth)} 
                            onChange={(val: Dayjs | null) => {
                                setFormValues({...formValues, date_of_birth: val as Dayjs});
                                handleInputValidation(() => date().max(tenYearsAgo, 'Date must be at least 10 years before today').typeError('Invalid date').required('Date is required').validate(val), (error) => setInputValidation({...inputValidation, date_of_birth: error}), () => setInputValidation({...inputValidation, date_of_birth: null}))
                            }}
                            />
                        </div>
                        <div className="row">
                            <h5 className='row-title'>Contact Information</h5>
                            <TextField
                            disabled={isOnSubmit}
                            required
                            label="Email"
                            type='email'
                            id="filled-size-normal"
                            variant="outlined"
                            error={!!inputValidation.email}
                            helperText={inputValidation.email || " "}
                            value={formValues.email}
                            onChange={(e) => {
                                setFormValues({...formValues, email: e.target.value});
                                handleInputValidation(() => string().email('Invalid email format').required('Email is required').validate(e.target.value), (error) => setInputValidation({...inputValidation, email: error}), () => setInputValidation({...inputValidation, email: null}))
                            }}
                            sx={{flex: 1}}
                            />
                            <InternationalPhoneInput
                            disabled={isOnSubmit}
                            error={!!inputValidation.cp_number}
                            helperText={inputValidation.cp_number || " "}
                            value={formValues.cp_number} 
                            onChange={(e) => {
                                setFormValues({...formValues, cp_number: e});
                                if(!(formValues.cp_number == "")) {
                                    if(isPhoneValid(e)) {
                                        setInputValidation({...inputValidation, cp_number: null})
                                    } else {
                                        setInputValidation({...inputValidation, cp_number: "Invalid phone Number"});
                                    }
                                }
                            }}/>
                        </div>
                        <div className="row">
                            <h5 className='row-title'>Address</h5>
                            {
                                employeeAddressInputValue? 
                                <div className="address-group">
                                    <TextField disabled={isOnSubmit} defaultValue={employeeAddress.country} 
                                    slotProps={{
                                        input: {
                                        readOnly: true,
                                        },
                                    }} label="Country" variant="outlined" fullWidth/>
                                    <TextField disabled={isOnSubmit} defaultValue={employeeAddress.region} 
                                    slotProps={{
                                        input: {
                                        readOnly: true,
                                        },
                                    }} label="Region" variant="outlined" fullWidth/>
                                    {
                                        employeeAddress.province? 
                                        <TextField disabled={isOnSubmit} defaultValue={employeeAddress.province} 
                                        slotProps={{
                                            input: {
                                            readOnly: true,
                                            },
                                        }} label="Province" variant="outlined" fullWidth/> : ''
                                    }
                                    <TextField disabled={isOnSubmit} defaultValue={employeeAddress.city} 
                                    slotProps={{
                                        input: {
                                        readOnly: true,
                                        },
                                    }} label="City" variant="outlined" fullWidth/>
                                    <IconButton aria-label="delete" size="large"
                                    onClick={() => {
                                        setEmployeeAddressInputValue(null);
                                        setEmployeeAddress({
                                            region: "",
                                            province: "",
                                            city: "",
                                            country: ""
                                        })
                                    }}>
                                        <ClearIcon fontSize="inherit" />
                                    </IconButton>
                                </div> :
                                <AddressAutoComplete onPlaceSelected={(value) => {
                                    setEmployeeAddressInputValue(value.formatedAddress);
                                    setEmployeeAddress({...value});
                                }}  />
                            }
                        </div>
                    </Form>
                </DialogContent>
                <DialogActions>
                <Button loading={isOnSubmit} loadingPosition='end' onClick={() => {
                    handleClearForm()
                }} autoFocus>
                    Clear form
                </Button>
                <Button sx={{background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)", color: "#fff"}} loading={isOnSubmit} loadingPosition='end' variant='contained' onClick={handleSubmit} autoFocus>
                    Submit
                </Button>
                </DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    );
}

export default AddEmployeeFormDialog;