"use client";
import { styled, css } from '@mui/material/styles';
import Image from 'next/image';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import ITimesheet, { ITimesheetFromDB } from '@/app/types/timesheet';
import ServerClock from '@/app/components/ServerClock';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CreateTimesheetForm from '@/app/components/dialogs/CreateTimesheetForm';
import { enqueueSnackbar } from 'notistack';
import SkeletonAsideItem from './SkeletonAsideItem';
import TimesheetItem from './TimesheetItem';
import ManageTimesheetName from './ManageTimesheetName';
import AdjustTimesheetThresholdForm from '@/app/components/dialogs/AdjustTimesheetThreshold';
import dayjs, { Dayjs } from 'dayjs';
import TimeLogTable from './TimeLogTable';
import OffScheduleWorkEmployees from '@/app/components/dialogs/OffScheduleWorksEmployees';
import ManualTimeLogForm from '@/app/components/dialogs/ManualTimeLogForm';
import useDeleteModal from '@/app/components/DeleteModal/useDeleteModal';
import SkeletonTimesheet from './SkeletonTimesheet';

import { 
    Box,
    Button,
    IconButton,
    Paper,
    InputAdornment,
    Chip,
    ToggleButton,
    Skeleton,
    MenuList,
    Divider,
    Typography,
    Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import FilterListIcon from '@mui/icons-material/FilterList';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import doApiRequest from '@/app/helpers/doApiRequest';
import TuneIcon from '@mui/icons-material/Tune';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import EditIcon from '@mui/icons-material/Edit';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EventIcon from '@mui/icons-material/Event';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import playErrorSound from '@/app/components/helpers/playErrorSound';
import playNotifSound from '@/app/components/helpers/playNotifSound';

const LoaderContainer = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 50px;
        text-align: center;
        justify-content: center;

        > .loader {
            width: 20px;
            height: 12px;
            display: block;
            margin: auto;
            position: relative;
            border-radius: 4px;
            color: #c3c3c3;
            background: currentColor;
            box-sizing: border-box;
            animation: animloader 0.6s 0.3s ease infinite alternate;
        }

        > .loader::after,
        > .loader::before {
        content: '';  
            box-sizing: border-box;
            width: 20px;
            height: 12px;
            background: currentColor;
            position: absolute;
            border-radius: 4px;
            top: 0;
            right: 110%;
            animation: animloader  0.6s ease infinite alternate;
        }

        > .loader::after {
            left: 110%;
            right: auto;
            animation-delay: 0.6s;
        }

        @keyframes animloader {
            0% {
                width: 20px;
            }
            100% {
                width: 48px;
            }
        }
    }
`
const InfiniteScroll: React.FC<{ loadMore: () => void }> = ({loadMore}) => {
    const ref = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setTimeout(() => loadMore(), 1000)
            }
        },
        { threshold: 0 }
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [loadMore]);

    return (
        <LoaderContainer ref={ref}>
            <span className="loader"></span>
        </LoaderContainer>
    )
}

interface IAttendancePageContex {
    timesheets: ITimesheetFromDB[],
    activeTimesheet: ITimesheetFromDB | null,
    setTimesheets: (newList: ITimesheetFromDB[]) => void
}

export const AttendancePageProvider = React.createContext<IAttendancePageContex | undefined>(undefined)

const StyledPageFC:React.FC<IStyledFC> = ({className}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const headRef = React.useRef<HTMLDivElement>(null);
    const deleteModal = useDeleteModal();
    const [createTimesheetState, setCreateTmesheetState] = React.useState(false);
    const [adjustTimesheetState, setAdjustTimesheetState] = React.useState(false);
    const [offScheduleEmployeesState, setoffScheduleEmployeesState] = React.useState(false);
    const [manualTimeLogDialogState, setManualTimeLogDialogState] = React.useState(false);
    const [asideOpen, setAsideOpen] = React.useState(true);
    const [activeTimesheet, setActiveTimesheet] = React.useState<ITimesheetFromDB | null>(null);
    const [loadingTimesheets, setLoadingTimesheets] = React.useState(true);
    const [deletingTimesheets, setDeletingTimesheets] = React.useState(false);
    const [loadedTimesheets, setLoadedTimesheets] = React.useState<ITimesheetFromDB[]>([]);
    const [onFullScreenMode, setOnFullscreenMode] = React.useState(false);
    const [dateFilter, setDateFilter] = React.useState<string | null>(null);
    const [pagination, setPagination] = React.useState<{
        limit: number,
        total: number,
        hasNext: boolean,
    } | null>(null);
    // const [pagination, setPagination] = React.useState<{
    //     page: number,
    //     limit: number,
    //     total: number,
    //     totalPages: number,
    //     hasNext: boolean,
    // } | null>(null);

    const toggleFullscreen = () => {
        setOnFullscreenMode(!onFullScreenMode);
    };

    const handleNext = (firstItemId: string, lastItemId: string, limit: number, dateFilter: string | null) => {
        doApiRequest<{
            limit: number,
            total: number,
            pageData: ITimesheetFromDB[],
        }>(
            dateFilter? "/api/private/get/get-timesheet-by-date": "/api/private/get/get-timesheets",
            (data) => {
                const sortData = [...loadedTimesheets, ...data.pageData].sort((a, b) => Number(b.id) - Number(a.id));
                const unique = new Map<string,  ITimesheetFromDB>();
                sortData.forEach(item => {
                    unique.set(String(item.id), item);
                });

                const merged = Array.from(unique.values());

                setLoadedTimesheets(merged);
                setPagination({limit: data.limit, total: data.total, hasNext: data.total > merged.length});
            },
            (state) => {},
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
            {
                method: "POST",
                body: JSON.stringify({date_filter: dateFilter, firstItemId, lastItemId, limit})
            }
        )
    }

    const handleDeleteTimesheet = () => {
        deleteModal(activeTimesheet?.title as string, () => {
            return new Promise<{success: boolean}>((resolve, reject) => {
                doApiRequest(
                    "/api/private/delete/delete-timesheet",
                    (data) => {
                        playNotifSound();
                        enqueueSnackbar(`Deleted 1 item:  ${activeTimesheet?.title}`, {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                        const newTimesheetList = loadedTimesheets.filter(item => item.id !== activeTimesheet?.id);
                        setLoadedTimesheets([...newTimesheetList]);
                        if(newTimesheetList.length) {
                            setActiveTimesheet(newTimesheetList[0]);
                        }
                        resolve({success: true})
                    },
                    (loading) => setDeletingTimesheets(loading),
                    (error) => {
                        playErrorSound()
                        enqueueSnackbar(error.message, {variant: "error", style: {zIndex: 10000}, anchorOrigin: {vertical: "top", horizontal: "center"}})
                        reject({success: false})
                    },
                    {
                        method: "DELETE",
                        body: JSON.stringify({timesheet_id: activeTimesheet?.id})
                    }
                )
            })
        })
    }

    const handleGetInitList = () => {
        setActiveTimesheet(null);
        doApiRequest<{
            limit: number,
            total: number,
            pageData: ITimesheetFromDB[],
        }>(
            dateFilter? "/api/private/get/get-timesheet-by-date-init-list": "/api/private/get/get-timesheet-init-list",
            (data) => {
                setLoadedTimesheets([...data.pageData]);
                setPagination({limit: data.limit, total: data.total, hasNext: data.total > data.pageData.length});
                if(data.pageData.length) {
                    setActiveTimesheet(data.pageData[0])
                }
            },
            (state) => setLoadingTimesheets(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
            {
                method: "POST",
                body: JSON.stringify({limit: 10, date_filter: dateFilter})
            }
        )
    }

    React.useEffect(() => {
        handleGetInitList();
    }, [dateFilter]);

    return(
        <AttendancePageProvider.Provider value={{
            timesheets: loadedTimesheets,
            setTimesheets: (newList) => setLoadedTimesheets(newList),
            activeTimesheet,
        }}>
            <Box ref={ref} className={className} component={'div'} 
            sx={
                onFullScreenMode? 
                {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 2000,
                    width: '100%',
                    height: '100vh',
                } : {
                    height: "calc(100vh - 70px)"
                }
            }>
                <CreateTimesheetForm container={headRef.current} state={createTimesheetState} onClose={() => setCreateTmesheetState(false)} 
                    onSuccess={(newTimesheet) => {
                        handleGetInitList();
                    }}/>
                <Paper className="head" ref={headRef}>
                    {/* <div className="toggle-btn">
                        <Tooltip title={asideOpen? "Close Sidebar" : "Open Sidebar"}>
                            <IconButton onClick={() => setAsideOpen(!asideOpen)}>
                                {
                                    asideOpen? <MenuIcon /> : <MenuOpenIcon />
                                }
                            </IconButton>
                        </Tooltip>
                    </div> */}
                    <ServerClock sx={{marginLeft: '20px'}}/>
                    <Box sx={{marginLeft: "auto"}}>
                        <DatePicker label="Filter by date" 
                        value={dateFilter? dayjs(dateFilter) : null}
                        onChange={(e) => setDateFilter(e? dayjs(e).format("YYYY/MM/DD") : null)}
                        slotProps={{
                            popper: {
                                sx: {
                                    zIndex: 2000,
                                },
                            },
                            field: {
                                clearable: true,
                            },
                            textField: {
                                error: false,
                                size: "small",
                                InputProps: {
                                    startAdornment: (
                                    <InputAdornment position="start">
                                        <FilterListIcon />
                                    </InputAdornment>
                                    ),
                                },
                            },
                        }}/>
                    </Box>
                    <div className="toggle-btn">
                        <Tooltip title={asideOpen? "Close Sidebar" : "Open Sidebar"}>
                            <IconButton onClick={() => setAsideOpen(!asideOpen)}>
                                {
                                    asideOpen? <MenuIcon sx={{fill: "url(#gradient)"}} /> : <MenuOpenIcon sx={{fill: "url(#gradient)"}} />
                                }
                            </IconButton>
                        </Tooltip>
                    </div>
                    {/* <div className="toggle-fullscreen-btn">
                        <Tooltip title="Toogle Full-screen">
                            <IconButton onClick={() => toggleFullscreen()}>
                                <FullscreenIcon />
                            </IconButton>
                        </Tooltip>
                    </div> */}
                </Paper>
                <div className="body">
                    
                    <Paper className="scrollable-container">
                        {
                            loadingTimesheets? <>
                                <SkeletonTimesheet />
                            </> : <>
                                {
                                    loadedTimesheets.length? <>
                                        {
                                            activeTimesheet? <>
                                            <ManualTimeLogForm timesheet={activeTimesheet} container={headRef.current} state={manualTimeLogDialogState} onClose={() => setManualTimeLogDialogState(false)} />
                                            <OffScheduleWorkEmployees container={headRef.current} state={offScheduleEmployeesState} onClose={() => setoffScheduleEmployeesState(false)} timesheet={activeTimesheet} />
                                            <AdjustTimesheetThresholdForm 
                                            container={headRef.current}
                                            state={adjustTimesheetState} 
                                            onClose={() =>  setAdjustTimesheetState(false)} 
                                            timesheet={activeTimesheet}
                                            onSuccess={(updatedTimesheetThreshold) => {
                                                console.log(updatedTimesheetThreshold);
                                                setLoadedTimesheets(loadedTimesheets.map(item => item.id == activeTimesheet.id? ({...activeTimesheet, ...updatedTimesheetThreshold}) : item));
                                                setActiveTimesheet({...activeTimesheet, ...updatedTimesheetThreshold});
                                            }}/>
                                            <Box className="content-header">
                                                <Box className="title">
                                                    <ManageTimesheetName 
                                                    timesheet={activeTimesheet}
                                                    onEditSuccess={(newName) => {
                                                        setLoadedTimesheets(loadedTimesheets.map(item => item.id == activeTimesheet.id? ({...item, title: newName}) : item));
                                                        setActiveTimesheet({...activeTimesheet, title: newName})
                                                    }}/>
                                                    <Chip size='small' sx={{width: "fit-content", color: "#FFF", background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)"}} color='primary' icon={<EventIcon />} label={new Date(activeTimesheet?.date).toDateString()} />
                                                </Box>
                                                <Box className="action-btn-group">
                                                    <Tooltip title="Delete this Timesheet">
                                                        <IconButton loading={deletingTimesheets} color='error' size="large" onClick={handleDeleteTimesheet}>
                                                            <DeleteIcon  />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Divider orientation='vertical' sx={{height: "30px"}} />
                                                    <Tooltip title="Off-Schedule Work">
                                                        <IconButton size="large" onClick={() => setoffScheduleEmployeesState(true)}>
                                                            <PeopleIcon sx={{ fill: "url(#gradient)" }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Divider orientation='vertical' sx={{height: "30px"}} />
                                                    <Tooltip title="Manual Time Log">
                                                        <IconButton aria-label="delete" size="large" onClick={() => setManualTimeLogDialogState(true)}>
                                                            <MoreTimeIcon sx={{ fill: "url(#gradient)" }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Divider orientation='vertical' sx={{height: "30px"}} />
                                                    <Tooltip title="Timesheet Settings">
                                                        <IconButton aria-label="delete" size="large" onClick={() => setAdjustTimesheetState(true)}>
                                                            <TuneIcon sx={{ fill: "url(#gradient)" }}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                            <Box className="content-body">
                                                <TimeLogTable />
                                            </Box>
                                            </> 
                                            : ""
                                        }
                                    </> : <div className="no-data">
                                        <h1>No records available.</h1>
                                        <h3>Create a timesheet to begin attendance tracking.</h3>
                                        <div className="btn-container">
                                            <Button startIcon={<AddIcon />} size='small' onClick={() => setCreateTmesheetState(true)} variant='contained'>Add Timesheet</Button>
                                        </div>
                                    </div>
                                }
                            </>
                        }
                    </Paper>
                    <Paper className='menu-list' style={{width: asideOpen? '300px' : "75px"}}>
                        <Box className="menu-header">
                            {
                                asideOpen? <>
                                    <h4>Timesheets</h4>
                                    <Button startIcon={<AddIcon />} variant="contained" size='small' sx={{marginLeft: 'auto', marginRight: '10px', background: "linear-gradient(90deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%)", color: "#FFF"}} onClick={() => setCreateTmesheetState(true)}>Add Timesheet</Button>
                                </> : <Tooltip title="Create new timesheet">
                                    <IconButton onClick={() => setCreateTmesheetState(true)}>
                                        <AddIcon sx={{fill: "url(#gradient)"}}/>
                                    </IconButton>
                                </Tooltip>
                            }
                        </Box>
                        {
                            loadingTimesheets? <>
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                                <SkeletonAsideItem />
                            
                            </> : <>
                            {
                                loadedTimesheets.length? <>
                                {
                                    loadedTimesheets.map(timesheet => (
                                        <TimesheetItem navOpen={asideOpen} active={!!(activeTimesheet && activeTimesheet.id == timesheet.id)} key={timesheet.id} 
                                        timesheetData={timesheet} 
                                        onClick={() => {
                                            setActiveTimesheet(timesheet);
                                        }} />
                                    ))
                                }
                                {
                                    pagination? pagination.hasNext? <InfiniteScroll loadMore={() => handleNext(String(loadedTimesheets[0].id), String(loadedTimesheets[loadedTimesheets.length - 1].id), pagination.limit, dateFilter)}/> : <Typography sx={{textAlign: "center", flex: "0 1 100%", padding: "15px", fontSize: "11px"}}>End of list</Typography> : ""
                                }
                                
                                </> : <div className='no-data'>
                                    <SentimentVeryDissatisfiedIcon />
                                    <p style={{textAlign: "center"}}>No data to Display</p>
                                </div>
                            }
                            </>
                        }
                    </Paper>
                </div>
            </Box>
        </AttendancePageProvider.Provider>
    )
}   

const StyledPage = styled(StyledPageFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        min-width: 0;
        gap: 15px;
        flex-wrap: wrap;
        transition: 400ms ease-in-out;

        > .head {
            display: flex;
            flex: 0 1 100%;
            height: 70px;
            align-items: center;
            /* border-bottom: 1px solid ${({theme}) => theme.palette.divider}; */

            > .toggle-btn {
                width: fit-content;
                height: fit-content;
                margin: 0 20px;
                border-radius: 50%;
                border: 1px solid ${({theme}) => theme.palette.divider};
                background-color: ${({theme}) => theme.palette.background.default};
            }

            > .toggle-fullscreen-btn {
                width: fit-content;
                height: fit-content;
                margin: 0 15px;
                border-radius: 5px;
                border: 1px solid ${({theme}) => theme.palette.divider};
                background-color: ${({theme}) => theme.palette.background.default};
            }
        }

        > .body {
            position: relative;
            display: flex;
            flex: 0 1 100%;
            min-width: 0;
            gap: 15px;
            overflow-y: auto;
            height: calc(100% - 70px);

            > .menu-list {
                position: sticky;
                top: 0;
                display: flex;
                width: 300px;
                height: calc(100% - 15px);
                overflow-y: auto;
                overflow-x: hidden;
                flex-wrap: wrap;
                align-content: flex-start;
                /* border-left: 1px solid ${({theme}) => theme.palette.divider}; */
                transition: 100ms width ease-in-out;

                > .no-data {
                    display: flex;
                    flex: 0 1 100%;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    opacity: 0.5;
                    margin-top: 50px;
                    
                }

                > .menu-header {
                    position: sticky;
                    top: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 300px;
                    padding: 20px 0;
                    height: 70px;
                    z-index: 110;
                    background-color: ${(props) => props.theme.palette.background.paper};
                    border-bottom: 1px solid ${({theme}) => theme.palette.divider};

                    > h4 {
                        margin-left: 15px;
                    }

                    > .toggle-btn {
                        width: fit-content;
                        height: fit-content;
                        position: absolute;
                        right: -20px;
                        border-radius: 50%;
                        border: 1px solid ${({theme}) => theme.palette.divider};
                        background-color: ${({theme}) => theme.palette.background.default};
                    }
                }
            }

            > .menu-list::-webkit-scrollbar {
                display: none;
            }

            > .scrollable-container {
                display: flex;
                flex: 1;
                min-width: 0;
                padding: 0 20px;
                flex-wrap: wrap;
                /* background-color: orange; */
                height: fit-content;

                > .content-header {
                    display: flex;
                    flex: 0 1 100%;
                    min-width: 0;
                    padding: 20px 0;
                    align-items: center;

                    > .title {
                        display: flex;
                        width: fit-content;
                        flex-direction: column;
                        gap: 5px;
                    }

                    > .action-btn-group {
                        display: inline-flex;
                        height: fit-content;
                        align-items: center;
                        margin-left: auto;
                    }
                }

                > .content-body {
                    display: flex;
                    flex: 0 1 100%;
                    min-width: 0;
                    padding: 20px 0;
                    align-items: center;
                    flex-wrap: wrap;
                }

                > .no-data {
                    display: flex;
                    flex: 0 1 100%;
                    height: 400px;
                    align-items: center;
                    align-content: center;
                    flex-wrap: wrap;

                    > h1, > h3 {
                        flex: 0 1 100%;
                        opacity: 0.5;
                        height: fit-content;
                        text-align: center;
                    }

                    > .btn-container {
                        display: flex;
                        margin-top: 10px;
                       flex: 0 1 100%;
                       height: fit-content;
                       justify-content: center;
                       align-items: center;
                    }

                }
            }
        }
    }
`;

export default StyledPage;