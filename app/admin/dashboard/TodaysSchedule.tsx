"use client";
import { styled, css } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import doApiRequest from '@/app/helpers/doApiRequest';
import { TSchedulerTable } from '@/app/types/scheduler-table';

import { 
    Paper,
    Skeleton,
    Chip,
    Box,
    Avatar
} from '@mui/material';

import { enqueueSnackbar } from 'notistack';
import TodayIcon from '@mui/icons-material/Today';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';

const days = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

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

type TEmployeeSchedule = {
    employee_id: string | number;
    first_name: string,
    middle_name: string | null,
    surname: string,
    ext_name: string | null,
    time_in: string,
    time_out: string,
    display_picture: string | null;
}

const TodaysScheduleFC: React.FC<IStyledFC> = ({className}) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [todaysSchedule, setTodaysSchedule] = React.useState<TEmployeeSchedule[]>([])

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
                let filteredData:TEmployeeSchedule[] = [];

                data.forEach(item => {
                    const weeklySched = JSON.parse(item.weekly_schedule_json);
                    const todaySched = weeklySched[days[new Date().getDay()]];

                    if(todaySched == "dayoff" || todaySched == null) return 
                        
                    filteredData.push({...item, time_in: todaySched.in, time_out: todaySched.out}) 
                })

                console.log(filteredData)
                setTodaysSchedule(filteredData);
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: 'top', horizontal: "center"}})
        )
    }, [])
    
    return (
        <Paper className={className}>
            <div className="top-container">
                <TodayIcon />
               <h4 style={{marginLeft: "10px"}}>Today's Schedule</h4>
            </div>
            <div className="list">
                {
                    !isLoading? <>
                        {
                            todaysSchedule.length? <>
                                {
                                    todaysSchedule.map((item) => (
                                       <ScheduleItem key={item.employee_id} itemData={item} {...colors[Math.floor(Math.random() * colors.length)]}/>
                                    ))
                                }
                            </> : "No Data"
                        }
                    </> : <>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                        <div className="skeleton-item">
                            <Skeleton variant="rounded" width={"100%"} height={"100%"} />
                        </div>
                    </>
                }

            </div>
        </Paper>
    )
}

interface IScheduleItem extends IStyledFC {
    itemData: TEmployeeSchedule
}

const ScheduleItemFC:React.FC<IScheduleItem> = ({className, itemData}) => {
    return(
        <Box className={className}>
            <div className="border-left"></div>
            <Avatar
            sx={{height: '40px', width: '40px', marginRight: '10px'}}
            src={itemData.display_picture? `/images/avatar/${itemData.display_picture}` : undefined}
            alt=""
            />
            <div>
                <h4 style={{fontSize: '12px'}}>
                    {`${itemData.first_name.toUpperCase()} ${itemData.middle_name? itemData.middle_name[0].toUpperCase() + "." : ""} ${itemData.surname.toUpperCase()} ${itemData.ext_name? itemData.ext_name.toUpperCase() : ""}`}
                </h4>
                <div className="time-area">
                    <h6>{`${dayjs(`08-03-1998 ${itemData.time_in}`).format("h:mm A")}`}</h6>
                    <h5> - </h5>
                    <h6>{`${dayjs(`08-03-1998 ${itemData.time_out}`).format("h:mm A")}`}</h6>
                </div>
            </div>
        </Box>
    )
}

const ScheduleItem = styled(ScheduleItemFC)<{ backgroundColor: string, color: string}>`
    && {
        position: relative;
        display: flex;
        flex: 0 1 100%;
        height: 60px;
        border-radius: 5px;
        padding: 10px;
        align-items: center;
        text-align: left;
        background-color: ${(props) => props.backgroundColor};
        color: ${({theme, color }) => theme.palette.mode == "dark"? "#FFF" : color};

        > .border-left {
            height: 100%;
            border-radius: 5px;
            flex-shrink: 0;
            width: 5px;
            margin-right: 5px;
            background-color: ${(props) => props.color };
        }

        > div {
            display: flex;
            flex-direction: column;
            gap: 1px;

            > .time-area {
                display: flex;
                align-items: center;
                gap: 5px;
            }
        }
    }
`

const TodaysSchedule = styled(TodaysScheduleFC)`
    && {
        position: relative;
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
        }

        > .list {
            display: flex;
            flex: 0 1 100%;
            flex-wrap: wrap;
            height: fit-content;
            max-height: 400px;
            overflow-y: auto;
            gap: 5px;

            > .skeleton-item {
                display: flex;
                flex: 0 1 100%;
                height: 60px;
            }
        }
    }
`;

export default TodaysSchedule;