"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import { TSchedulerTable } from '@/app/types/scheduler-table';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Avatar 
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import SkedulerTimeRangePicker from './SkedulerTimeRangePicker';
import computeTotalHours from '@/app/helpers/computeTotalHours';

const StyledSchedulerTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`

const SchedulerTable: React.FC = () => {
    const [data, setData] = React.useState<TSchedulerTable[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const columns = React.useMemo<MRT_ColumnDef<TSchedulerTable>[]>(() => [
        {
            accessorFn: (originalRow) => (`${originalRow.first_name.toUpperCase()} ${originalRow.middle_name? originalRow.middle_name[0].toUpperCase() + "." : ""} ${originalRow.surname.toUpperCase()}`), //you should also get type hints for your accessorFn
            header: 'Employee',
            size: 300,
            muiTableHeadCellProps: {align: 'left'},
            muiTableBodyCellProps: {align: 'left'},
            Cell: ({ row }) => (
                <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}
                >
                <Avatar src={row.original.display_picture? `/images/avatar/${row.original.display_picture}` : undefined} alt={row.original.first_name} />
                {`${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()}`}
                </Box>
            ),
        },
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Monday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'monday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    // flexWrap: "wrap",
                    gap: '1rem',
                }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='monday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Tuesday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'tuesday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='tuesday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Wednesday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'wednesday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='wednesday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Thursday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'thursday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='thursday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Friday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'friday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='friday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Saturday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'saturday',
            size: 200,
            Cell: ({ row }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='saturday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Sunday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'sunday',
            size: 200,
            Cell: ({ row, table }) => (
                <Box
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    }}
                >
                    <SkedulerTimeRangePicker employee_id={row.original.employee_id} day='sunday' weekly_schedule={row.original.weekly_schedule} onChange={(e) => {
                        setData(prev => prev.map((item, i) => i === row.index? ({...item, weekly_schedule: e}) : item))
                    }} />
                </Box>
            ),
        }, 
        {
            header: 'Total Hours / Week',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'total_hours',
            size: 200,
            Cell: ({ row }) => {
                let hasDayoff = false;
                const schedule = Object.entries(row.original.weekly_schedule);
                const totalHours = schedule.reduce((total, c) => {
                    if(c[1] == "dayoff") hasDayoff = true;
                
                    if((c[1] && c[1] != "dayoff" && c[1].in && c[1].out)) {
                        return total + computeTotalHours(c[1].in, c[1].out)
                    } else {
                        return total;
                    }
                }, 0)
                return (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: "center",
                        gap: '1ch',
                        fontSize: '12px'
                    }}
                >
                    <strong>{totalHours} Hrs</strong>{` ${hasDayoff? "+ day off" : "with no day off"}`}
                </Box>)
            },
        }
    ], [data])

    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: false,
        enableColumnPinning: true,
        state: {
            isLoading
        },
        muiTablePaperProps: {
            sx: {
                width: '100%',
            },
        },
        muiTableHeadCellProps: {align: 'center'},
        muiTableBodyCellProps: {align: 'center'},
        initialState: {
            columnPinning: { left: ['Employee'], right: ['total_hours'] },
        },
    })

    React.useEffect(() => {
        doApiRequest<({
            employee_id: string;
            first_name: string,
            middle_name: string | null,
            surname: string,
            ext_name: string | null,
            display_picture: string | null,
            weekly_schedule_json: string
        })[]>(
            "/api/private/get/get-schedules",
            (data) => {
                const mappedData = data.map(item => ({...item, weekly_schedule: JSON.parse(item.weekly_schedule_json)}))
                setData(mappedData);
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: 'top', horizontal: "center"}})
        )
    }, [])
    return(
        <StyledSchedulerTable>
            <MaterialReactTable 
            table={table}
            />
        </StyledSchedulerTable>
    )
}

export default SchedulerTable;