"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import ITimesheet, { ITimesheetFromDB } from '@/app/types/timesheet';
import ServerClock from '@/app/components/ServerClock';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CreateTimesheetForm from '@/app/components/dialogs/CreateTimesheetForm';
import { enqueueSnackbar } from 'notistack';
import SkeletonAsideItem from './SkeletonAsideItem';
import TimesheetItem from './TimesheetItem';

import { 
    Box,
    Button,
    IconButton,
    Paper,
    InputAdornment,
    ToggleButton,
    Skeleton,
    MenuList
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import FilterListIcon from '@mui/icons-material/FilterList';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import doApiRequest from '@/app/helpers/doApiRequest';
import EventIcon from '@mui/icons-material/Event';

const StyledLayoutFC:React.FC<IStyledFC> = ({className, children}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [createTimesheetState, setCreateTmesheetState] = React.useState(false);
    const [asideOpen, setAsideOpen] = React.useState(true);
    const [activeTimesheet, setActiveTimesheet] = React.useState<ITimesheetFromDB | null>(null);
    const [loadingTimesheets, setLoadingTimesheets] = React.useState(true);
    const [timesheets, setTimesheets] = React.useState<ITimesheetFromDB[]>([]);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            ref.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    React.useEffect(() => {
        doApiRequest<ITimesheetFromDB[]>(
            "/api/private/get/get-timesheet",
            (data) => {
                setTimesheets([...data])
            },
            (state) => setLoadingTimesheets(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
        )
    }, []);

    return(
        <Paper ref={ref} className={className} component={'div'}>
            <CreateTimesheetForm state={createTimesheetState} onClose={() => setCreateTmesheetState(false)} />
            <div className="head">
                <Box className="aside">
                    <h4>Timesheets</h4>
                    <Button startIcon={<AddIcon />} size='small' sx={{marginLeft: 'auto', marginRight: '30px'}} onClick={() => setCreateTmesheetState(true)}>Add Timesheet</Button>
                    <div className="toggle-btn">
                        <IconButton onClick={() => setAsideOpen(!asideOpen)}>
                            {
                                asideOpen? <MenuOpenIcon /> : <MenuIcon />
                            }
                        </IconButton>
                    </div>
                </Box>
                <ServerClock sx={{marginLeft: '50px'}}/>
                <Box sx={{marginLeft: "auto"}}>
                    <DatePicker label="Filter by date" 
                    slotProps={{
                        textField: {
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
                <div className="toggle-fullscreen-btn">
                    <IconButton onClick={() => toggleFullscreen()}>
                        <FullscreenIcon />
                    </IconButton>
                </div>
            </div>
            <div className="body">
                <aside className='menu-list' style={{width: asideOpen? '300px' : "52px"}}>
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
                            timesheets.length? <>
                            {
                                timesheets.map(timesheet => (
                                    <TimesheetItem active={!!(activeTimesheet && activeTimesheet.id == timesheet.id)} key={timesheet.id} 
                                    timesheetData={timesheet} 
                                    onClick={() => {
                                        setActiveTimesheet(timesheet);
                                    }} />
                                ))
                            }
                            </> : <h1>No data</h1>
                        }
                        </>
                    }
                </aside>
                <div className="scrollable-container">
                    {
                        activeTimesheet? 
                        <Box className="content-header">
                            <Box className="title">
                                <h3>{activeTimesheet?.title}</h3>
                                <p>{new Date(activeTimesheet?.date).toDateString()}</p>
                            </Box>
                        </Box> : "Attendance Analytics"
                    }
                    {
                        children
                    }
                </div>
            </div>
        </Paper>
    )
}   

const StyledLayout = styled(StyledLayoutFC)`
    && {
        display: flex;
        flex: 1;
        height: calc(100vh - 70px);
        flex-wrap: wrap;

        > .head {
            display: flex;
            flex: 0 1 100%;
            height: 70px;
            align-items: center;
            border-bottom: 1px solid ${({theme}) => theme.palette.divider};

            > .aside {
                position: relative;
                display: flex;
                align-items: center;
                width: 300px;
                height: 100%;
                border-right: 1px solid ${({theme}) => theme.palette.divider};

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
            display: flex;
            flex: 0 1 100%;
            height: calc(100% - 70px);

            > .menu-list {
                position: relative;
                display: flex;
                width: 300px;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                flex-wrap: wrap;
                align-content: flex-start;
                border-right: 1px solid ${({theme}) => theme.palette.divider};
                transition: 100ms width ease-in-out;
            }

            > .menu-list::-webkit-scrollbar {
                display: none;
            }

            > .scrollable-container {
                display: flex;
                flex: 1;
                padding: 0 20px;
                flex-wrap: wrap;
                height: fit-content;

                > .content-header {
                    display: flex;
                    flex: 0 1 100%;
                    padding: 20px 0;
                    align-items: center;

                    > .title {
                        display: flex;
                        width: fit-content;
                        flex-direction: column;
                    }
                }
            }
        }
    }
`;

export default StyledLayout;