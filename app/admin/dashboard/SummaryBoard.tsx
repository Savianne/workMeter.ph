"use client";
import { styled, css } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';

import { 
    Paper,
    Chip,
    Skeleton
} from '@mui/material';

import { enqueueSnackbar } from 'notistack';

import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RunningWithErrorsIcon from '@mui/icons-material/RunningWithErrors';
import doApiRequest from '@/app/helpers/doApiRequest';

type TTodaysStats = {
    totalActiveEmployees: number,
    totalOnLeaveTodayEmployees: number,
    totalPendingLeaveRequest: number,
    totalPresentToday: number
}

const SummaryBoadFC: React.FC<IStyledFC> = ({className}) => {
    const [todaysStats, setTodaysStats] = React.useState<TTodaysStats | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 250; // Adjust for the scroll distance
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    React.useEffect(() => {
        doApiRequest<TTodaysStats>(
            "/api/private/get/get-todays-stats",
            (data) => {
                setTodaysStats(data)
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
        );
    }, [])

    return (
        <Paper className={className}>
            <div className="top-container">
                <AutoGraphIcon />
                <h4 style={{marginLeft: "10px"}}>Today's Stats</h4>
                {
                    !isLoading?
                    <div className="scrollbtn-group">
                        <span className="scroll-left" onClick={() => scroll("left")}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 73.4-73.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-128 128z"/></svg>
                        </span>
                        <span className="scroll-right" onClick={() => scroll("right")}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"/></svg>
                        </span>
                    </div> : ''
                }
            </div>
            <div className="summary-boxes-container" ref={scrollRef}>
                 {
                    isLoading? <>
                    <div className="summary-box-skeleton">
                        <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                    </div>
                     <div className="summary-box-skeleton">
                        <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                    </div>
                     <div className="summary-box-skeleton">
                        <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                    </div>
                     <div className="summary-box-skeleton">
                        <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                    </div>
                     <div className="summary-box-skeleton">
                        <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                    </div>
                    </> : <>
                    <div className="summary-box" style={{backgroundColor: "#FF5722", background: "linear-gradient(0deg, #FF5722 0%, var(--secondaryAppColor)", color: "white"}}>
                        <div className="top">
                            <div className="icon-container">
                                <PeopleIcon sx={{fontSize: "40px"}}/>
                            </div>
                            <div className="title-container">
                                <h6>Total Active Employees</h6>
                                <h2>{todaysStats?.totalActiveEmployees}</h2>
                            </div>
                        </div>
                        <Chip sx={{color: "white"}} label="View List" onClick={() => {}} />
                    </div>
                    <div className="summary-box" style={{backgroundColor: "#2b3a8e", background: "linear-gradient(0deg,rgba(25, 118, 210, 1) 0%, var(--secondaryAppColor) 100%)", color: "white"}}>
                        <div className="top">
                            <div className="icon-container">
                                <EventBusyIcon sx={{fontSize: "40px"}}/>
                            </div>
                            <div className="title-container">
                                <h6>On Leave Today</h6>
                                <h2>{todaysStats?.totalOnLeaveTodayEmployees}</h2>
                            </div>
                        </div>
                        <Chip sx={{color: "white"}} label="View List" onClick={() => {}} />
                    </div>
                    <div className="summary-box" style={{backgroundColor: "rgb(25 148 164)", background: "linear-gradient(0deg,rgba(25, 148, 164, 1) 0%, var(--secondaryAppColor) 100%)", color: "white"}}>
                        <div className="top">
                            <div className="icon-container">
                                <HowToRegIcon sx={{fontSize: "40px"}}/>
                            </div>
                            <div className="title-container">
                                <h6>Present Today</h6>
                                <h2>{todaysStats?.totalPresentToday}</h2>
                            </div>
                        </div>
                        <Chip sx={{color: "white"}} label="View List" onClick={() => {}} />
                    </div>
                    <div className="summary-box" style={{backgroundColor: "#cf1eba", background: "linear-gradient(0deg, #cf1eba 0%, var(--secondaryAppColor) 100%)", color: "white"}}>
                        <div className="top">
                            <div className="icon-container">
                                <PlaylistAddCheckCircleIcon sx={{fontSize: "40px"}}/>
                            </div>
                            <div className="title-container">
                                <h6>Pending Leave Request</h6>
                                <h2>{todaysStats?.totalPendingLeaveRequest}</h2>
                            </div>
                        </div>
                        <Chip sx={{color: "white"}} label="View List" onClick={() => {}} />
                    </div>
                    <div className="summary-box" style={{backgroundColor: "#607D8B", background: "linear-gradient(0deg, #607D8B 0%, var(--secondaryAppColor) 100%)", color: "white"}}>
                        <div className="top">
                            <div className="icon-container">
                                <ReceiptIcon sx={{fontSize: "40px"}} />
                            </div>
                            <div className="title-container">
                                <h6>Pending Payrolls</h6>
                                <h2>3</h2>
                            </div>
                        </div>
                        <Chip sx={{color: "white"}} label="View List" onClick={() => {}} />
                    </div>
                    <div className="summary-box">
                        <div className="top">
                            <div className="icon-container">
                                <RunningWithErrorsIcon sx={{fontSize: "40px"}} />
                            </div>
                            <div className="title-container">
                                <h6>Late Today</h6>
                                <h2>3</h2>
                            </div>
                        </div>
                        <Chip label="View List" onClick={() => {}} />
                    </div> 
                    </>
                }
            </div>
        </Paper>
    )
}

const SummaryBoad = styled(SummaryBoadFC)`
    && {
        display: flex;
        flex:  0 1 100%;
        height: fit-content;
        padding: 20px;
        flex-wrap: wrap;
        gap: 20px;
        min-width: 0;

        > .top-container {
            display: flex;
            flex: 0 1 100%;
            min-width: 0;

            > .scrollbtn-group {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                margin: 10px 0;
                margin-left: auto;
                height: 0;
                gap: 5px;

                > .scroll-left, > .scroll-right {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-radius: 50%;
                    border: 1px solid #e6e6e6;

                    > svg {
                        height: 15px;
                        transition: fill 300ms;
                        fill: ${({theme}) => theme.palette.text.primary};
                    }
                }

                > .scroll-left:hover, > .scroll-right:hover {
                    background-color: black;
                    transition: background-color 300ms;

                    > svg {
                        fill: white;
                    }
                }
            }
        }

        > .summary-boxes-container::-webkit-scrollbar {
            display: none;
        }

        > .summary-boxes-container {
            display: flex;
            flex: 0 1 100%;
            gap: 20px;
            overflow-x: auto;
            

            > .summary-box {
                display: flex;
                width: 250px;
                min-width: 250px;
                height: 130px;
                padding: 15px;
                border-radius: 10px;
                flex-wrap: wrap;
                border: 1px solid ${({theme}) => theme.palette.divider};
                

                > .top {
                    display: flex;
                    flex: 0 1 100%;

                    > .icon-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 50px;
                        height: 50px;
                        border-radius: 5px;
                        background-color: #fefefe7f;
                    }

                    > .title-container {
                        margin-left: 10px;
                    }
                }
            }

            > .summary-box-skeleton {
                display: flex;
                width: 280px;
                min-width: 280px;
                height: 160px;
                border-radius: 10px;
                flex-wrap: wrap;
            }
        }
    }
`;

export default SummaryBoad