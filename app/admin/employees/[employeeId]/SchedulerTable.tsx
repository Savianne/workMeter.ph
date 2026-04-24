"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import { TSchedulerTable, TDaySchedule, TWeeklySchedule } from '@/app/types/scheduler-table';
import computeTotalHours from '@/app/helpers/computeTotalHours';
import { IStyledFC } from '@/app/types/IStyledFC';
import dayjs from 'dayjs';
import UpdateEmployeeScheduleDialog from './UpdateEmployeeScheduleForm';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import playErrorSound from '@/app/components/helpers/playErrorSound';
import playNotifSound from '@/app/components/helpers/playNotifSound';

import {
    MRT_EditActionButtons,
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Avatar,
    Menu,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import NightShelterIcon from '@mui/icons-material/NightShelter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const colors = [
    {
        backgroundColor: "#9b27b022",
        color: "#9C27B0"
    },
    {
        backgroundColor: "#ff5b9322",
        color: "#ff5b93"
    },
    {
        backgroundColor: "#00968822",
        color: "#009688"
    },
    {
        backgroundColor: "#2196F322",
        color: "#2196F3"
    },
    {
        backgroundColor: "#FF572222",
        color: "#FF5722"
    }
]

type TUpdateScheduleDialogContextProvider = {
    dialogState: boolean,
    setDialogState: (state: boolean) => void,
    data: {schedule: TDaySchedule | "dayoff" | null, employee: { employee_id: string, first_name: string, middle_name: string | null, surname: string, ext_name: string | null, display_picture: string | null }, day: string} | null,
    setData: (data: {schedule: TDaySchedule | "dayoff" | null, employee: { employee_id: string, first_name: string, middle_name: string | null, surname: string, ext_name: string | null, display_picture: string | null }, day: string} | null) => void,
}

const UpdateScheduleContextProvider = React.createContext<TUpdateScheduleDialogContextProvider | undefined>(undefined);

export function useUpdateSchedule() {
    const context = React.useContext(UpdateScheduleContextProvider)
    if (!context) throw new Error('useUpdateSchedule must be used inside UpdateScheduleContextProvider');
    return context
}

interface ITableBodyScheduleCell extends IStyledFC {
    employee: { employee_id: string, first_name: string, middle_name: string | null, surname: string, ext_name: string | null, display_picture: string | null };
    day: string;
    schedule: TDaySchedule | "dayoff" | null;
    onChange?: (data: TWeeklySchedule) => void
}

const TableBodyScheduleCellFC: React.FC<ITableBodyScheduleCell> = ({className, schedule, employee, day, onChange}) => {
    const updateScheduleContext = useUpdateSchedule();
    const [editOnSubmit, setEditOnSubmit] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleUpdateTime = () => {
        updateScheduleContext.setData({ employee, day, schedule });
        updateScheduleContext.setDialogState(true);
    }

    const handleRemoveTime = async () => {
        const snackbarId = enqueueSnackbar("Please Wait", {variant: "default", persist: true, anchorOrigin: {vertical: "top", horizontal: 'center'}});
        doApiRequest<TWeeklySchedule>(
            "/api/private/update/update-employee-schedule",
            (data) => {
                onChange && onChange(data);
                closeSnackbar(snackbarId);
                playNotifSound();
                enqueueSnackbar("Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            (state) => {
                setEditOnSubmit(state);
            },
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            {
                method: "POST",
                body: JSON.stringify({
                    day,
                    time: null,
                    employee_id: employee.employee_id
                })
            }
        )
    }

    const handleSetDayoff = async () => {
        const snackbarId = enqueueSnackbar("Please Wait", {variant: "default", persist: true, anchorOrigin: {vertical: "top", horizontal: 'center'}});
        doApiRequest<TWeeklySchedule>(
            "/api/private/update/update-employee-schedule",
            (data) => {
                onChange && onChange(data);
                closeSnackbar(snackbarId);
                playNotifSound();
                enqueueSnackbar("Done", {variant: "default", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            (state) => {
                setEditOnSubmit(state);
            },
            (error) => {
                enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: 'center'}});
            },
            {
                method: "POST",
                body: JSON.stringify({
                    day,
                    time: "dayoff",
                    employee_id: employee.employee_id
                })
            }
        )
    }

    return(
        <Box className={className}>
            {
                editOnSubmit?
                <div className="loading">
                    <CircularProgress size="20px" />
                </div> : ""
            }
            <div className="border-left"></div>
            <div className="content">
                {
                    schedule && schedule !== "dayoff"? <>
                    <strong>{`${dayjs(`08-03-1998 ${schedule.in}`).format("h:mm A")} - ${dayjs(`08-03-1998 ${schedule.out}`).format("h:mm A")}`}</strong>
                    <div className='break-hour'>
                        <RestaurantIcon sx={{fontSize: '15px'}} />
                        <p>{schedule.break_time_hours} hour(s) break time</p>
                    </div>
                    </> :
                    schedule && schedule == "dayoff"? 
                    <>
                        <NightShelterIcon />
                        <h5 style={{marginLeft: "5px"}}>Rest day</h5>
                    </> : <>
                    <CalendarTodayIcon />
                        <h5 style={{marginLeft: "5px"}}>No schedule</h5>
                    </>
                }
            </div>
            <span className="more-action" onClick={handleClick}>
                <MoreVertIcon sx={{fontSize: 'inherit'}}/>
            </span>
            <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            >
                {
                    schedule == "dayoff"? [
                        <MenuItem key={0} 
                        onClick={() => {
                            handleUpdateTime();
                            handleClose();
                        }}>
                            Add Time
                        </MenuItem>,
                        <MenuItem key={1}
                        onClick={() => {
                            handleRemoveTime();
                            handleClose();
                        }}>
                            Remove Dayoff
                        </MenuItem>
                    ] : 
                    schedule !== null?
                    [
                        <MenuItem key={2}
                        onClick={() => {
                            handleUpdateTime()
                            handleClose();
                        }}>
                            Edit Time
                        </MenuItem>,
                        <MenuItem key={3}
                        onClick={() => {
                            handleSetDayoff();
                            handleClose();
                        }}>
                            Set as Day off
                        </MenuItem>,
                        <MenuItem key={4}
                        onClick={() => {
                            handleRemoveTime();
                            handleClose();
                        }}>
                            Remove Schedule
                        </MenuItem>
                    ] : [
                        <MenuItem key={2}
                        onClick={() => {
                            handleUpdateTime()
                            handleClose();
                        }}>
                            Add Time
                        </MenuItem>,
                        <MenuItem key={3}
                        onClick={() => {
                            handleSetDayoff()
                            handleClose();
                        }}>
                            Set {day.toWellFormed()} as Day off
                        </MenuItem>
                    ]
                }
            </Menu>
        </Box>
    )
}

const TableBodyScheduleCell = styled(TableBodyScheduleCellFC)<{ backgroundColor: string, color: string}>`
    && {
        position: relative;
        display: flex;
        flex: 0 1 100%;
        height: 55px;
        border-radius: 5px;
        padding: 10px;
        align-items: center;
        text-align: left;
        background-color: ${(props) =>  props.schedule && props.schedule !== "dayoff"? props.backgroundColor : 
                                        props.schedule && props.schedule == "dayoff"? "#4CAF5022" : "#80808022"
                            };
        color: ${({theme, color, schedule}) => theme.palette.mode == "dark"? "#fff" : schedule && schedule  !== "dayoff"? color : schedule && schedule == "dayoff"? "#4CAF50" : "#808080"};
        
        > .loading {
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            width: 100%;
            height: 100%;
            background-color: ${({theme}) => theme.palette.background.default};
            opacity: 0.7;
            align-items: center;
            justify-content: center;
        }


        > .border-left {
            height: 100%;
            border-radius: 5px;
            flex-shrink: 0;
            width: 5px;
            background-color: ${(props) =>  props.schedule && props.schedule !== "dayoff"? props.color :
                                            props.schedule && props.schedule == "dayoff"? "#4CAF50" : "#808080"
                                };
        }
        
        > .content {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 2px;
            margin-left: 10px;
       
            > strong {
                flex: 0 1 100%;
                font-size: 12px;
            }
    
            > .break-hour {
                flex: 0 1 100%;
                display: flex;
                align-items: center;

                > p {
                    margin-left: 7px;
                    font-size: 10px;
                }
            }
        }

        > .more-action {
            margin-left: auto; 
            display: flex;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
        }
    }
`;

const StyledSchedulerTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`


const SchedulerTable: React.FC<{employeeId: string}> = ({employeeId}) => {
    const [data, setData] = React.useState<TSchedulerTable[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [editScheduleDialogState, setEditScheduleDialogState] = React.useState(false);
    const [editScheduleData, setEditScheduleData] = React.useState<{schedule: TDaySchedule | "dayoff" | null, employee: { employee_id: string, first_name: string, middle_name: string | null, surname: string, ext_name: string | null, display_picture: string | null }, day: string} | null>(null);
    
    const columns = React.useMemo<MRT_ColumnDef<TSchedulerTable>[]>(() => [
        {
            accessorFn: (row) => `${row.weekly_schedule}`, //access nested data with dot notation
            header: 'Monday',
            enableColumnActions: false,
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            id: 'monday',
            size: 200,
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['monday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='monday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            },
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
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['tuesday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='tuesday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }   
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
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['wednesday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='wednesday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }
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
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['thursday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='thursday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }
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
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['friday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='friday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }
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
            Cell: ({ row }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['saturday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='saturday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }
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
            Cell: ({ row, table }) => {
                const Memoised = React.useMemo(() => {
                    return <TableBodyScheduleCell schedule={row.original.weekly_schedule['sunday']} {...colors[Math.floor(Math.random() * colors.length)]} employee={{...row.original}} day='sunday'
                    onChange={(update) => {
                        data[row.index].weekly_schedule = update;
                        setData([...data]);
                    }}/>
                }, [row.original.weekly_schedule])
                
                return Memoised;
            }
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
                        // return total + computeTotalHours(c[1].in, c[1].out)
                        return total + c[1].work_hours;
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
        enablePagination: false,
         enableTopToolbar: false,
        state: {
            isLoading
        },
        muiTablePaperProps: {
            sx: {
                width: '100%',
            },
        },
        muiTableHeadCellProps: {align: 'center'},
        muiTableBodyCellProps: {align: 'center', sx: {padding: '5px'}},
        initialState: {
            columnPinning: { right: ['total_hours'] },
        }
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
            "/api/private/get/get-schedule",
            (data) => {
                const mappedData = data.map(item => ({...item, weekly_schedule: JSON.parse(item.weekly_schedule_json)}))
                setData(mappedData);
                console.log(mappedData)
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: 'top', horizontal: "center"}}),
            {
                method: "POST",
                body: JSON.stringify({employee_id: employeeId})
            }
        )
    }, [])
    return(
        <UpdateScheduleContextProvider.Provider value={{
            dialogState: editScheduleDialogState,
            setDialogState: (state) => setEditScheduleDialogState(state),
            data: editScheduleData,
            setData: (data) => setEditScheduleData(data),
        }}>
            <StyledSchedulerTable>
                <UpdateEmployeeScheduleDialog onSuccess={(res) => {
                    const mappedData = data.map(item => item.employee_id == res.employeeId? {...item, weekly_schedule: {...res.newSchedule}} : item);
                    setData(mappedData);
                }}/>
                <MaterialReactTable 
                table={table}
                />
            </StyledSchedulerTable>
        </UpdateScheduleContextProvider.Provider>
    )
}

export default SchedulerTable;