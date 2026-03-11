"use client"
import React from "react";
import { styled } from '@mui/material/styles';
import { IStyledFC } from "@/app/types/IStyledFC";
import doApiRequest from "@/app/helpers/doApiRequest";
import { useSearchParams } from "next/navigation";
import { EmployeeData } from "@/app/types/employee-data";
import { enqueueSnackbar } from 'notistack';
import QRCode from "react-qr-code";
import dayjs, { Dayjs } from 'dayjs';
import Yup, { object, number, string, date, mixed, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import { PhoneNumberUtil } from 'google-libphonenumber';
import InternationalPhoneInput from "@/app/components/InternationalPhoneInput";
import areObjectsMatching from "@/app/helpers/areObjectMatching";
import ProfileSkeleton from "./ProfileSkeleton";
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

import { 
    Box,
    Alert,
    TextField,
    Paper,
    Button,
    FormControl,
    Select,
    InputLabel,
    MenuItem,
    Avatar,
    Chip,
    Tabs,
    Tab,
    FormHelperText,
    OutlinedInput,
    InputAdornment
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditSquareIcon from '@mui/icons-material/EditSquare';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

const maritalStatuses = ["Single","Married","Divorced","Separated","Widowed","Annulled"];

const today = new Date();
const tenYearsAgo = new Date(
  today.getFullYear() - 10,
  today.getMonth(),
  today.getDate()
);

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
    employment_status:  mixed().oneOf(['Regular', 'Probationary', 'Contractual', 'Casual', "Inactive", "Resigned", "Ended", "Terminated"] as const).defined(),
    region: string().required("Address is required"),
    province: string().nullable(),
    city: string().required("Address is required"),
    country: string().required("Address is required"),
    barangay: string().nullable(),
    street: string().nullable(),
    building: string().nullable(),
    zip_code: string().nullable(),
    salary_basis: mixed().oneOf(['monthly', 'daily', 'hourly'] as const).defined(),
    salary: number().positive("Must be greater than 0").typeError("Must be a number").required()
});

const inputValidationDefault = {
    first_name: null,
    middle_name: null,
    surname: null,
    ext_name: null,
    date_of_birth: null,
    sex: null,
    email: null,
    cp_number: null,
    marital_status: null,
    citizeship: null,
    designation: null,
    date_hired: null,
    employment_status: null,
    country: null,
    region: null,
    province: null,
    city: null,
    barangay: null,
    street: null,
    building: null,
    zip_code: null,
    salary_basis: null,
    salary: null
}

const phoneUtil = PhoneNumberUtil.getInstance();

const isPhoneValid = (phone: string) => {
    try {
        return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
    } catch (error) {
        return false;
    }
};

interface IProfileFC extends IStyledFC {
    profileId: string,
}

const ProfileFC: React.FC<IProfileFC> = ({className, profileId}) => {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [editState, setEditState] = React.useState(false);
    const [tab, setTab] = React.useState("information");
    const [defaultData, setDefaultData] = React.useState<EmployeeData | null>(null);
    const [editData, setEditData] = React.useState<EmployeeData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [onSubmitLoading, setOnSubmitLoading] = React.useState(false);
    const [hasDataChanges, setHasDataChanges] = React.useState(false);
    const [formValidationError, setFormValidationError] = React.useState<null | string>(null);
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
        citizeship: string | null,
        designation: string | null,
        date_hired: string | null,
        employment_status: string | null,
        country: string | null,
        region: string | null,
        province: string | null,
        city: string | null,
        barangay: string | null,
        street: string | null,
        building: string | null,
        zip_code: string | null,
        salary_basis: string | null,
        salary: string | null
    }>({...inputValidationDefault});

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    const handleSubmit = async () =>  {
        doApiRequest(
            '/api/private/update/update-employee',
            (data) => {
                editData && setDefaultData(editData)
                setInputValidation({...inputValidationDefault});
                setEditState(false);
                enqueueSnackbar("Update success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
            (state) => setOnSubmitLoading(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
            {
                method: "POST",
                body: JSON.stringify({...editData, date_of_birth: dayjs(editData?.date_of_birth).format('YYYY/MM/DD'), date_hired: dayjs(editData?.date_hired).format('YYYY/MM/DD')})
            }
        )
    }

    React.useEffect(() => {
        doApiRequest<EmployeeData>(
            "/api/private/get/get-employee",
            (data) => { 
                setDefaultData({...data});
                setEditData({...data});
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: 'error', anchorOrigin: {vertical: "top", horizontal: "center"}}),
            {
                method: "POST",
                body: JSON.stringify({employee_id: profileId})
            }
        )
    }, []);

    React.useEffect(() => {
        if(!(editData)) return;
        const handler = debounce(async () => {
            try {
                await ValidateFormValues.validate({...editData})
                if(formValidationError) setFormValidationError(null)
            }
            catch(err: any) {
                setFormValidationError(err.errors? err.errors : 'Please check your input properly');
            }
        }, 500);

        handler();

        return () => handler.cancel();
    }, [editData])

    React.useEffect(() => {
        if(!(defaultData && editData)) return;

        const handler = debounce(() => {
            setHasDataChanges(!areObjectsMatching(editData, defaultData));
        }, 500);

        handler();

        return () => handler.cancel();
    }, [defaultData, editData])

    React.useEffect(() => {
        if(tabParam == "information" || tabParam == "analytics" || tabParam == "schedule") {
            setTab(tabParam);
        }
    }, [tabParam]);
    return(
        <div className={className}>
            {
                !(isLoading && defaultData === null && editData === null)? <>
                    <Paper elevation={2} className="top-container">
                        <Avatar src="/images/avatar/users.png" variant="rounded" sx={{width: '100px', height: '100px', border: '2px solid #c1c1c1'}} />
                        <div className="name">
                            <h2>{`${defaultData?.first_name} ${defaultData?.middle_name? defaultData?.middle_name[0].toUpperCase() + ".": "" } ${defaultData?.surname}`}</h2>
                            <h5>{defaultData?.designation}</h5>
                            <div className="chip">
                                {
                                    defaultData?.employment_status.toLowerCase() == "regular"?
                                    <Chip label={defaultData?.employment_status} color="primary" icon={<WorkspacePremiumIcon />} variant="outlined" /> : 
                                    defaultData?.employment_status.toLowerCase() == "contractual"?
                                    <Chip icon={<HourglassTopIcon />} variant='outlined' label={defaultData?.employment_status} /> :
                                    <Chip variant='outlined' label={defaultData?.employment_status} />
                                }
                                {
                                    defaultData?.salary_basis == "monthly"?
                                    <Chip label={`₱ ${defaultData?.salary} / Month`} /> :
                                    defaultData?.salary_basis == "daily"?
                                    <Chip label={`₱ ${defaultData?.salary} / Daily`} /> :
                                    <Chip label={`₱ ${defaultData?.salary} / hourly`} />
                                }
                            </div>
                        </div>
                        <div className="qr-code-box">
                            <QRCode
                                size={100}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={defaultData?.employee_id as string}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                    </Paper>
                    <Tabs className="tab" value={tab} onChange={handleTabChange} >
                        <Tab value="information" icon={<AssignmentIndIcon />} label="INFORMATION" />
                        <Tab value="analytics" icon={<BarChartIcon />} label="ANALYTICS" />
                        <Tab value="schedule" icon={<CalendarMonthIcon />} label="SCHEDULE" />
                    </Tabs>
                    <Box className="tab-content">
                        {
                            tab == "information" && editData? <>
                                <Box className="information">
                                    {/* <MobileTimePicker defaultValue={dayjs('2022-04-17T15:30')} onChange={(e) => console.log(e?.format())}/> */}
                                    {
                                        // formValidationError? <Alert severity="error" sx={{flex: '0 1 100%'}}>{formValidationError}</Alert> : ""
                                    }
                                    <Box className="row">
                                        <TextField
                                        slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.designation}
                                        onChange={(e) => {
                                            setEditData({...editData, designation: e.target.value})
                                            handleInputValidation(() => string().required().validate(e.target.value), (error) => setInputValidation({...inputValidation, designation: error}), () => setInputValidation({...inputValidation, designation: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Designation" variant="outlined" 
                                        error={!!inputValidation.designation}
                                        helperText={inputValidation.designation || "  "} required/>
                                        <FormControl sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.employment_status} required>
                                            <InputLabel id="sex-label">Employment Status</InputLabel>
                                            <Select
                                                readOnly={!editState}
                                                label="Employmnet Status"
                                                value={editData?.employment_status}
                                                onChange={(e) => {
                                                    setEditData({...editData, employment_status: e.target.value})
                                                    handleInputValidation(() => mixed().oneOf(['Regular', 'Probationary', 'Contractual', 'Casual', "Inactive", "Resigned", "Ended", "Terminated"] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, employment_status: error}), () => setInputValidation({...inputValidation, employment_status: null}))
                                                }}
                                                sx={{ minWidth: 120 }}
                                            >
                                                <MenuItem value="Regular">Regular / Permanent</MenuItem>
                                                <MenuItem value="Probationary">Probationary</MenuItem>
                                                <MenuItem value="Contractual">Contractual / Fixed-term</MenuItem>
                                                <MenuItem value="Casual">Casual / Seasonal</MenuItem>
                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                                <MenuItem value="Resigned">Resigned</MenuItem>
                                                <MenuItem value="Ended">Contract ended</MenuItem>
                                                <MenuItem value="Terminated">Terminated</MenuItem>
                                            </Select> 
                                            <FormHelperText>{inputValidation.employment_status || " "}</FormHelperText>
                                        </FormControl>
                                        <DatePicker readOnly={!editState} label="Date Hired" sx={{flex: 1, minWidth: '120px'}} slotProps={{field: { clearable: true, readOnly: !editState}, textField: {error: !!inputValidation.date_hired, helperText: inputValidation.date_hired? inputValidation.date_hired : ' ', required: true}}}
                                            value={dayjs(editData?.date_hired)} 
                                            onChange={(val) => {
                                                setEditData({...editData, date_hired: val as Dayjs});
                                                handleInputValidation(() => date().max(new Date(), 'Date must be at least 10 years before today').typeError('Invalid date').required('Date is required').validate(val), (error) => setInputValidation({...inputValidation, date_hired: error}), () => setInputValidation({...inputValidation, date_hired: null}))
                                            }}
                                        />
                                    </Box>
                                    <Box className="row">
                                        <FormControl error={!!inputValidation.salary_basis} required sx={{ minWidth: 120, flex: 1 }}>
                                            <InputLabel>Salary Basis</InputLabel>
                                            <Select
                                                readOnly={!editState}
                                                label="Salary Basis"
                                                value={editData?.salary_basis}
                                                onChange={(e) => {
                                                    setEditData({...editData, salary_basis: e.target.value})
                                                    handleInputValidation(() => mixed().oneOf(['monthly', 'daily', 'hourly'] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, salary_basis: error}), () => setInputValidation({...inputValidation, salary_basis: null}))
                                                }}
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
                                        <FormControl error={!!inputValidation.salary} required sx={{ minWidth: 120, flex: 1 }}>
                                            <InputLabel htmlFor="outlined-adornment-salay">Salary</InputLabel>
                                            <OutlinedInput
                                                readOnly={!editState}
                                                value={editData.salary}
                                                onChange={(e) => {
                                                    setEditData({...editData, salary: Number(e.target.value)})
                                                    handleInputValidation(() => number().positive("Must be greater than 0").typeError("Must be a number").required().validate(e.target.value), (error) => setInputValidation({...inputValidation, salary: error}), () => setInputValidation({...inputValidation, salary: null}))
                                                }}
                                                id="outlined-adornment-salary"
                                                startAdornment={<InputAdornment position="start">&#8369;</InputAdornment>}
                                                label="Salary"
                                                type='number'
                                            />
                                            <FormHelperText>{inputValidation.salary || " "}</FormHelperText>
                                        </FormControl>
                                    </Box>
                                    <Box className="row">
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.first_name}
                                        onChange={(e) => {
                                            setEditData({...editData, first_name: e.target.value});
                                            handleInputValidation(() => string().min(2).max(25).required("First Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, first_name: error}), () => setInputValidation({...inputValidation, first_name: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="First Name" variant="outlined" 
                                        helperText={inputValidation.first_name || " "}
                                        error={!!inputValidation.first_name} required/>
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.middle_name || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, middle_name: e.target.value});
                                            handleInputValidation(() => string().max(15).nullable().validate(e.target.value), (error) => setInputValidation({...inputValidation, middle_name: error}), () => setInputValidation({...inputValidation, middle_name: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Middle Name" variant="outlined"
                                        helperText={inputValidation.middle_name || " "}
                                        error={!!inputValidation.middle_name} />
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.surname}
                                        onChange={(e) => {
                                            setEditData({...editData, surname: e.target.value})
                                            handleInputValidation(() => string().min(2).max(25).required("Last Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, surname: error}), () => setInputValidation({...inputValidation, surname: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Surname" variant="outlined"
                                        helperText={inputValidation.surname || " "}
                                        error={!!inputValidation.surname} required />
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.ext_name || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, ext_name: e.target.value});
                                            handleInputValidation(() => string().max(15).nullable().validate(e.target.value), (error) => setInputValidation({...inputValidation, ext_name: error}), () => setInputValidation({...inputValidation, ext_name: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Ext. Name" variant="outlined"
                                        helperText={inputValidation.ext_name || " "}
                                        error={!!inputValidation.ext_name} />
                                    </Box>
                                    <Box className="row">
                                        <FormControl sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.sex} required>
                                            <InputLabel id="sex-label">Sex</InputLabel>
                                            <Select
                                                readOnly={!editState}
                                                label="Sex"
                                                value={editData?.sex}
                                                onChange={(e) => {
                                                    setEditData({...editData, sex: e.target.value});
                                                    handleInputValidation(() => mixed().oneOf(['Male', 'Female'] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, sex: error}), () => setInputValidation({...inputValidation, sex: null}))
                                                }}
                                                sx={{ minWidth: 120 }}
                                            >
                                                <MenuItem value="Male">Male</MenuItem>
                                                <MenuItem value="Female">Female</MenuItem>
                                            </Select> 
                                            <FormHelperText>{inputValidation.sex || " "}</FormHelperText>
                                        </FormControl>
                                        <FormControl sx={{ flex: 1, minWidth: '120px'}} error={!!inputValidation.marital_status} required>
                                            <InputLabel id="sex-label">Marital Status</InputLabel>
                                            <Select
                                                readOnly={!editState}
                                                label="Marital Status"
                                                value={editData?.marital_status}
                                                onChange={(e) => {
                                                    setEditData({...editData, marital_status: e.target.value});
                                                    handleInputValidation(() => mixed().oneOf(["Single","Married","Divorced","Separated","Widowed","Annulled"] as const).defined().validate(e.target.value), (error) => setInputValidation({...inputValidation, marital_status: error}), () => setInputValidation({...inputValidation, marital_status: null}))
                                                }}
                                                sx={{ minWidth: 120 }}
                                            >
                                                {
                                                    maritalStatuses.map(item => <MenuItem value={item}>{item}</MenuItem>)
                                                }
                                            </Select> 
                                            <FormHelperText>{inputValidation.marital_status || " "}</FormHelperText>
                                        </FormControl>
                                        <TextField
                                        error={!!inputValidation.citizeship}
                                        helperText={inputValidation.citizeship || " "}
                                        slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.citizenship}
                                        onChange={(e) => {
                                            setEditData({...editData, citizenship: e.target.value});
                                            handleInputValidation(() => string().min(2).max(25).required("Last Name is a required field").validate(e.target.value), (error) => setInputValidation({...inputValidation, citizeship: error}), () => setInputValidation({...inputValidation, citizeship: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Citizenship" variant="outlined" />
                                        <DatePicker readOnly={!editState} label="Date of Birth" sx={{flex: 1, minWidth: '120px'}} slotProps={{field: { clearable: true, readOnly: !editState}, textField: {error: !!inputValidation.date_of_birth,helperText: inputValidation.date_of_birth? inputValidation.date_of_birth : ' '}}}
                                            value={dayjs(editData?.date_of_birth)} 
                                            onChange={(e) => {
                                                setEditData({...editData, date_of_birth: e as Dayjs})
                                                handleInputValidation(() => date().max(tenYearsAgo, 'Date must be at least 10 years before today').typeError('Invalid date').required('Date is required').validate(e), (error) => setInputValidation({...inputValidation, date_of_birth: error}), () => setInputValidation({...inputValidation, date_of_birth: null}))
                                            }}
                                        />
                                    </Box>
                                    <Box className="row">
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        error={!!inputValidation.email}
                                        helperText={inputValidation.email || " "}
                                        value={editData?.email}
                                        onChange={(e) => {
                                            setEditData({...editData, email: e.target.value});
                                            handleInputValidation(() => string().email('Invalid email format').required('Email is required').validate(e.target.value), (error) => setInputValidation({...inputValidation, email: error}), () => setInputValidation({...inputValidation, email: null}))
                                        }}
                                        sx={{flex: 1}} size="medium" label="Email" variant="outlined" />
                                        <InternationalPhoneInput
                                        error={!!inputValidation.cp_number}
                                        helperText={inputValidation.cp_number || " "}
                                        readonly={!editState}
                                        onChange={(e) => {
                                            setEditData({...editData, cp_number: e});
                                            if(e == "") setInputValidation({...inputValidation, cp_number: "Phone Number is Required"})
                                            if(isPhoneValid(e)) {
                                                setInputValidation({...inputValidation, cp_number: null})
                                            } else {
                                                setInputValidation({...inputValidation, cp_number: "Invalid phone Number"});
                                            }
                                        }}
                                        value={editData?.cp_number as string} />
                                    </Box>
                                    <Box className="row">
                                        <TextField slotProps={{
                                            input: {
                                            readOnly: !editState,
                                            },
                                        }}
                                        error={!!inputValidation.country}
                                        helperText={inputValidation.country || " "}
                                        value={editData?.country || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, country: e.target.value});
                                            handleInputValidation(() => string().required().validate(e.target.value), (error) => setInputValidation({...inputValidation, country: error}), () => setInputValidation({...inputValidation, country: null}))
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Country" variant="outlined" required/>
                                       <TextField slotProps={{
                                            input: {
                                            readOnly: !editState,
                                            },
                                        }}
                                        error={!!inputValidation.region}
                                        helperText={inputValidation.region || " "}
                                        value={editData?.region || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, region: e.target.value})
                                            handleInputValidation(() => string().required().validate(e.target.value), (error) => setInputValidation({...inputValidation, region: error}), () => setInputValidation({...inputValidation, region: null}))
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Region" variant="outlined" required />
                                        <TextField slotProps={{
                                            input: {
                                            readOnly: !editState,
                                            },
                                        }}
                                        error={!!inputValidation.province}
                                        helperText={inputValidation.province || " "}
                                        value={editData?.province || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, province: e.target.value})
                                            handleInputValidation(() => string().nullable().validate(e.target.value), (error) => setInputValidation({...inputValidation, province: error}), () => setInputValidation({...inputValidation, province: null}))
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Province" variant="outlined"/>
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        error={!!inputValidation.city}
                                        helperText={inputValidation.city || " "}
                                        value={editData?.city || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, city: e.target.value})
                                            handleInputValidation(() => string().required().validate(e.target.value), (error) => setInputValidation({...inputValidation, city: error}), () => setInputValidation({...inputValidation, city: null}))
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="City" variant="outlined" required />
                                    </Box>
                                    <Box className="row">
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.barangay || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, barangay: e.target.value})
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Barangay" variant="outlined" />
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.street || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, street: e.target.value})
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Street" variant="outlined" />
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.building || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, building: e.target.value})
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Building/house number" variant="outlined" />
                                        <TextField slotProps={{
                                            input: {
                                                readOnly: !editState,
                                            },
                                        }}
                                        value={editData?.zip_code || ""}
                                        onChange={(e) => {
                                            setEditData({...editData, zip_code: e.target.value})
                                        }}
                                        sx={{flex: 1}} 
                                        size="medium" id="outlined-basic" label="Zip Code" variant="outlined" />
                                    </Box>
                                    <Box className="row">
                                        {
                                            editState? <>
                                                <Button onClick={() => {
                                                    defaultData? setEditData({...defaultData}) : setEditData(null);
                                                    setInputValidation({...inputValidationDefault});
                                                    setEditState(false);
                                                }} variant="contained" color="inherit">Cancel</Button>
                                                <Button onClick={handleSubmit} color="info" disabled={!(hasDataChanges && formValidationError === null)} loading={onSubmitLoading} loadingPosition="end">Save Edit</Button>
                                            </> : <Button startIcon={<EditSquareIcon />} variant="contained" color="success" onClick={() => setEditState(true)}>Edit Form</Button>
                                        }
                                        
                                    </Box>
                                </Box>
                            </> : ""
                        }
                    </Box>
                </> : <ProfileSkeleton />
            }
            
        </div>
    )
}

const Profile = styled(ProfileFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        flex-wrap: wrap;
        gap: 15px;

        > .top-container {
            display: flex;
            flex: 0 1 100%;
            align-items: center;
            padding: 15px;

            > .name {
                display: flex;
                flex-direction: column;
                justify-content: center;
                margin-left: 15px;
                gap: 5px;

                > h2 {
                    line-height: 1;
                }

                > .chip {
                    display: flex;
                    flex: 1;
                    gap: 5px;
                }
            }

            > .qr-code-box {
                width: 90px;
                height: 90px;
                padding: 5px;
                border-radius: 5px;
                margin-left: auto;
                background-color: white;
                border: 2px solid #c1c1c1
            }
        }

        > .tab {
            display: flex;
            flex: 0 1 100%;
        }

        > .tab-content {
            display: flex;
            flex: 0 1 100%;
            margin-top: 20px;
            margin-bottom: 50px;

            > .information {
                display: flex;
                flex: 0 1 100%;
                height: fit-content;
                flex-wrap: wrap;
                gap: 10px;

                > .row {
                    display: flex;
                    flex: 0 1 100%;
                    gap: 10px;
                    flex-wrap: wrap;
                }
            }
        }
    }
`

export default Profile;