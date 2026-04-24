"use client"
import React from "react"
import { styled } from '@mui/material/styles';
import { IStyledFC } from "@/app/types/IStyledFC"
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import debounce from "lodash/debounce";
import dayjs, { Dayjs } from 'dayjs';
import { object, number, string, date, mixed, ValidationError } from 'yup';
import getCalendarWeeklyCutoffs from "@/app/helpers/getCalendarWeeklyCutoffs";
import getCalendarBiWeeklyCutoffs from "@/app/helpers/getCalendarBiWeeklyCutoffs";
import getSemiMonthlyCutoffs from "@/app/helpers/getSemiMonthlyCutoffs";
import getMonthlyCutoff from "@/app/helpers/getMonthlyCutoff";
import DaysSelect from "@/app/components/DaysSelect";
import EmployeeSelectMultiple, {EmployeeSelectData} from "@/app/components/EmployeeSelectMultiple";

import { 
    Paper,
    Chip,
    TextField,
    Select,
    InputLabel,
    FormControl,
    MenuItem,
    FormHelperText,
    Button,
    Divider
} from '@mui/material';

const defaultFormValidation: {
    title: string | null,
    payrollType: string | null,
    payrollYearMonth: string | null
} = {
    title: null,
    payrollType: null,
    payrollYearMonth: null
}

const RunPayrollFormFC: React.FC<IStyledFC> = ({className}) => {
    const [title, setTitle] = React.useState("");
    const [payrollType, setPayrollType] = React.useState("");
    const [payrollYearMonth, setPayrollYearMonth] = React.useState("");
    const [formValidation, setFormValidation] = React.useState({...defaultFormValidation});
    const [cutoff, setCutoff] = React.useState<null | string>(null);
    const [workDays, setWorkDays] = React.useState({
        sunday: false,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
    });
    const [employees, setEmployees] = React.useState("");
    const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeSelectData[]>([]);

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

    React.useEffect(() => {
        setCutoff(null);
    }, [payrollYearMonth, payrollType])

    return(
        <Paper className={className} elevation={6}>
            <h2>Run Payroll Cycle</h2>
            <Divider flexItem sx={{flex: "0 1 100%"}} orientation="horizontal" />
            <div className="row">
                <TextField  
                error={!!formValidation.title}
                helperText={formValidation.title}
                value={title} 
                onChange={(e) => {
                    setTitle(e.target.value);
                    handleInputValidation(() => string().max(35).required().validate(e.target.value), (error) => setFormValidation({...formValidation, title: error}), () => setFormValidation({...formValidation, title: null}))
                }} fullWidth label="Title" variant="outlined" />
            </div>
            <div className="row">
                <FormControl fullWidth error={!!formValidation.payrollType}>
                    <InputLabel>Payroll Cycle Type</InputLabel>
                    <Select
                    value={payrollType}
                    onChange={(e) => {
                        setPayrollType(e.target.value);
                        handleInputValidation(() =>  mixed().oneOf(['weekly', 'bi-weekly', 'semi-monthly', 'monthly'] as const).defined().validate(e.target.value), (error) => setFormValidation({...formValidation, payrollType: error}), () => setFormValidation({...formValidation, payrollType: null}))
                    }}
                    label="Payroll Cycle Type"
                    >
                        <MenuItem value={""}>Select Payroll Cycle Type</MenuItem>
                        <MenuItem value={"weekly"}>Weekly</MenuItem>
                        <MenuItem value={"bi-weekly"}>Bi-weekly</MenuItem>
                        <MenuItem value={"semi-monthly"}>Semi-monthly</MenuItem>
                        <MenuItem value={"monthly"}>Monthly</MenuItem>
                    </Select>
                   { formValidation.payrollType? <FormHelperText>{formValidation.payrollType}</FormHelperText> : ""}

                </FormControl>
            </div>
            <div className="row">
                <DatePicker 
                slotProps={
                    {
                        popper: {
                            sx: {
                                zIndex: 2000,
                            },
                        },
                        field: { clearable: true }, 
                        textField: {
                            required: true,
                            fullWidth: true,
                            error: !!formValidation.payrollYearMonth, 
                            helperText: formValidation.payrollYearMonth,
                        }
                    }
                }
                value={dayjs(payrollYearMonth)} 
                onChange={(e) => {
                    setPayrollYearMonth(e? dayjs(e).format("YYYY/MM/DD") : "");
                    handleInputValidation(() => date().typeError('Invalid date').required('Date is required').validate(e), (error) => setFormValidation({...formValidation, payrollYearMonth: error}), () => setFormValidation({...formValidation, payrollYearMonth: null}))
                }}
                label={'Cut-off Year and Month'} views={['year', 'month']} />
            </div>
            <div className="row">
                <FormControl fullWidth>
                    <InputLabel>Cut-Off</InputLabel>
                    <Select
                    label="Cut-Off"
                    value={cutoff || ""}
                    onChange={(e) => setCutoff(e.target.value)}
                    >
                    {
                        payrollType == "weekly"? 
                            payrollYearMonth? getCalendarWeeklyCutoffs(new Date(payrollYearMonth).getFullYear(), new Date(payrollYearMonth).getMonth() + 1).map((item, index) => (
                                <MenuItem 
                                value={`${item.weekStart}-${item.weekEnd}`}>
                                    {`Cut-off ${index + 1}:`} <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.weekStart).toDateString()}`} /> - <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.weekEnd).toDateString()}`} />
                                </MenuItem>
                            )) : <MenuItem><i>No Options</i></MenuItem>
                        : 
                        payrollType == "bi-weekly"? 
                            payrollYearMonth? getCalendarBiWeeklyCutoffs(new Date(payrollYearMonth).getFullYear(), new Date(payrollYearMonth).getMonth() + 1).map((item, index) => (
                                <MenuItem 
                                value={`${item.cutoffStart}-${item.cutoffEnd}`}>
                                    {`Cut-off ${index + 1}:`} <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffStart).toDateString()}`} /> - <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffEnd).toDateString()}`} />
                                </MenuItem>
                            )) : <MenuItem><i>No Options</i></MenuItem>
                        : 
                        payrollType == "semi-monthly"? 
                            payrollYearMonth? getSemiMonthlyCutoffs(new Date(payrollYearMonth).getFullYear(), new Date(payrollYearMonth).getMonth() + 1).map((item, index) => (
                                <MenuItem 
                                value={`${item.cutoffStart}-${item.cutoffEnd}`}>
                                    {`Cut-off ${index + 1}:`} <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffStart).toDateString()}`} /> - <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffEnd).toDateString()}`} />
                                </MenuItem>
                            )) : <MenuItem><i>No Options</i></MenuItem>
                        : 
                        payrollType == "monthly"? 
                            payrollYearMonth? getMonthlyCutoff(new Date(payrollYearMonth).getFullYear(), new Date(payrollYearMonth).getMonth() + 1).map((item, index) => (
                                <MenuItem 
                                value={`${item.cutoffStart}-${item.cutoffEnd}`}>
                                    {`Cut-off ${index + 1}:`} <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffStart).toDateString()}`} /> - <Chip sx={{margin: "0 5px", color: "#FFF", background: "linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} label={`${new Date(item.cutoffEnd).toDateString()}`} />
                                </MenuItem>
                            )) : <MenuItem><i>No Options</i></MenuItem>
                        :<MenuItem><i>No Options</i></MenuItem>
                    }      
                    </Select>
                </FormControl>
            </div>
            <h5>Select Working Days</h5>
            <div className="row">
                <DaysSelect value={workDays} onChange={(value) => setWorkDays(value)} />
            </div>
            <div className="row">
                <FormControl fullWidth>
                    <InputLabel>Employee</InputLabel>
                    <Select
                    label="Employee"
                    value={employees || ""}
                    onChange={(e) => setEmployees(e.target.value)}
                    >
                        <MenuItem value=""><i>No Selected</i></MenuItem>
                        <MenuItem value="all-employee">All Active Employees</MenuItem>
                        <MenuItem value="all-regular">All Regular Employees</MenuItem>
                        <MenuItem value="all-probationary">All Probationary Employees</MenuItem>
                        <MenuItem value="all-contractual">All Contractual Employees</MenuItem>
                        <MenuItem value="all-casual">All Casual Employees</MenuItem>
                        <MenuItem value="define">Define Employees</MenuItem>
                    </Select>
                </FormControl>
            </div>
            {
                employees == "define"? 
                <EmployeeSelectMultiple value={selectedEmployee} onChange={(e) => setSelectedEmployee(e)} /> : ''
            }
            <Divider flexItem sx={{flex: "0 1 100%"}} orientation="horizontal" />
            <div className="row" style={{justifyContent: "flex-end"}}>
                <Button variant="contained" sx={{background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}}>Run Payroll</Button>
            </div>
        </Paper>
    )
}

const RunPayrollForm = styled(RunPayrollFormFC)`
    && {
        display: flex;
        flex: 0 1 1000px;
        padding: 50px;
        /* height: 500px; */
        margin-top: -80px;
        gap: 15px;
        flex-wrap: wrap;

        > .row {
            display: flex;
            flex: 0 1 100%;
        }

        > h2 {
            text-align: center;
            flex: 0 1 100%;
            margin-bottom: 20px;
        }
    }
`;

export default RunPayrollForm;