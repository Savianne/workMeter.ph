"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import { EmployeeTableData } from '@/app/types/employee-table-data';
import { EmployeeData } from '@/app/types/employee-data';
import { useRouter, usePathname } from "next/navigation";
import AddEmployeeFormDialog from '@/app/components/dialogs/AddEmployeeForm';
import { enqueueSnackbar } from 'notistack';
import QRCode from "react-qr-code";
//MUI Components
import { 
    Button,
    Box,
    Avatar,
    MenuItem,
    ListItemIcon,
    Chip
} from "@mui/material";

//MUI Icons
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BadgeIcon from '@mui/icons-material/Badge';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

const columns: Array<MRT_ColumnDef<EmployeeTableData>> = [
    {
        accessorFn: (row) => `${row.employee_id}`, //you should get type hints for all of your keys if you defined your TData type correctly
        header: 'Employee Id',
        enableSorting: false, //you should get type hints for all possible column options that you can define here
        Cell: ({ row }) => (
            <Box
            sx={{
                display: "flex",
                alignItems: 'center'
            }}
            >
                <Box
                sx={{
                    width: "50px",
                    height: "50px",
                    padding: "5px",
                    borderRadius: "5px",
                    marginRight: '10px',
                    backgroundColor: 'white',
                    border: "2px solid #c1c1c1"
                }}
                >
                    <QRCode
                    size={100}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={row.original.employee_id}
                    viewBox={`0 0 256 256`}
                    />
                </Box>
                {row.original.employee_id}
            </Box>
        ),
    },
    {
        accessorFn: (originalRow) => (`${originalRow.first_name.toUpperCase()} ${originalRow.middle_name? originalRow.middle_name[0].toUpperCase() + "." : ""} ${originalRow.surname.toUpperCase()}`), //you should also get type hints for your accessorFn
        header: 'Employee',
        Cell: ({ row }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: '250px',
                gap: '1rem',
              }}
            >
              <Avatar src={row.original.display_picture? `/images/avatar/${row.original.display_picture}` : undefined} alt={row.original.first_name} />
              <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
              >
                <strong style={{fontSize: "13px"}}>{`${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()}`}</strong>
                <p>{row.original.designation}</p>
              </Box>
            </Box>
        ),
    },
    {
        accessorKey: "employment_status",
        header: "Employment Status",
        Cell: ({ row }) => (
            row.original.employment_status.toLowerCase() == "regular"?
            <Chip icon={<WorkspacePremiumIcon />} color='info' variant='filled' label={row.original.employment_status} /> :
            row.original.employment_status.toLowerCase() == "contractual"?
            <Chip icon={<HourglassTopIcon />} variant='outlined' label={row.original.employment_status} /> :
            <Chip variant='outlined' label={row.original.employment_status} />
        )
    },
    {
        accessorFn: (originalRow) => (new Date(originalRow.date_hired as string).toLocaleDateString()),
        header: "Date Hired",
        Cell: ({ row }) => (
            <Chip icon={<CalendarMonthIcon />} variant='outlined' label={new Date(row.original.date_hired.toString()).toDateString()} />
        )
    },
    {
        accessorKey: 'salary',
        header: "Salary",
        Cell: ({ row }) => (
            row.original.salary_basis == "monthly"?
            <Chip label={`₱ ${row.original.salary} / Month`} /> :
            row.original.salary_basis == "daily"?
            <Chip label={`₱ ${row.original.salary} / Daily`} /> :
            <Chip label={`₱ ${row.original.salary} / hourly`} />
        )
    }
];

const StyledEmployeesTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`
const EmployeesTable: React.FC = () => {
    const router = useRouter();
    const path = usePathname();
    const [data, setData] = React.useState<EmployeeTableData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [addEmployeeFormOpenState, setAddEmployeeFormOpenState] = React.useState(false);

    const table = useMaterialReactTable({
        columns,
        data,
        state: {isLoading, showProgressBars: isLoading},
        muiTablePaperProps: {
            sx: {
                width: '100%',
            },
        },
        renderTopToolbarCustomActions: () => (
            <Button sx={{color: "#fff", backgroundColor: "var(--primaryAppColor)", background: "linear-gradient(90deg,rgba(25, 118, 210, 1) 0%, var(--secondaryAppColor) 100%)"}} variant="contained" endIcon={<AddIcon />} onClick={() => setAddEmployeeFormOpenState(true)}>Add Employee</Button>
        ),
        enableRowActions: true,
        renderRowActionMenuItems: ({ closeMenu, row }) => [
            <MenuItem
            key={0}
            onClick={() => {
                router.push(`/admin/employees/${row.original.employee_id}?tab=information`)
            }}
            sx={{ m: 0 }}
            >
            <ListItemIcon>
                <AssignmentIndIcon />
            </ListItemIcon>
            Information
            </MenuItem>,
            <MenuItem
            key={1}
            onClick={() => {
                router.push(`/admin/employees/${row.original.employee_id}?tab=analytics`)
            }}
            sx={{ m: 0 }}
            >
            <ListItemIcon>
                <BarChartIcon />
            </ListItemIcon>
            Analytics
            </MenuItem>,
            <MenuItem
            key={2}
            onClick={() => {
                router.push(`/admin/employees/${row.original.employee_id}?tab=schedule`)
            }}
            sx={{ m: 0 }}
            >
            <ListItemIcon>
                <CalendarMonthIcon />
            </ListItemIcon>
            Schedule
            </MenuItem>
        ],
    });

    React.useEffect(() => {
        doApiRequest<EmployeeData[]>(
            "/api/private/get/get-employees",
            (data) => {
                setData([...data]);
                console.log(data)
            },
            (state) => setIsLoading(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
            },
        )
    }, [])
    return(
        <StyledEmployeesTable>
            <AddEmployeeFormDialog state={addEmployeeFormOpenState} onClose={() => setAddEmployeeFormOpenState(false)} onSuccess={(newData) => setData([...data, {...newData}])} />
            <MaterialReactTable 
            table={table}
            />
        </StyledEmployeesTable>  
    )
}



export default EmployeesTable;