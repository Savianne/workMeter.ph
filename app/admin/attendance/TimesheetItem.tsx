"use client";
import { IStyledFC } from '@/app/types/IStyledFC';
import { styled } from '@mui/material/styles';
import { ITimesheetFromDB } from '@/app/types/timesheet';
import React from "react";

import { 
    Box,
    MenuItem,
    Tooltip
} from '@mui/material';

import EventIcon from '@mui/icons-material/Event';

interface ITimesheetItem extends IStyledFC {
    timesheetData: ITimesheetFromDB,
    navOpen: boolean,
    onClick: () => void
}

const TimesheetItemFC: React.FC<ITimesheetItem> = ({className, navOpen, timesheetData, onClick}) => {
    return(
        <div className={className} onClick={onClick}>
            <div className="border-left"></div>
            {
                navOpen? 
                <MenuItem className="item">
                    <EventIcon sx={{width: "30px", height: "30px"}} />
                    <div className="title">
                        <h5>{timesheetData.title}</h5>
                        <p>{new Date(timesheetData.date).toDateString()}</p>
                    </div>
                </MenuItem> : <Tooltip title={timesheetData.title}>
                     <MenuItem className="item">
                        <EventIcon sx={{width: "30px", height: "30px"}} />
                        <div className="title">
                            <h5>{timesheetData.title}</h5>
                            <p>{new Date(timesheetData.date).toDateString()}</p>
                        </div>
                    </MenuItem>
                </Tooltip>
            }
           
        </div>
    )
}

const TimesheetItem = styled(TimesheetItemFC)<{active?: boolean}>`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 60px;
        padding: 10px;
        align-items: center;
        overflow: hidden;
        background-color: ${(props) => props.active? props.theme.palette.mode == "dark"? props.theme.palette.background.paper : "white" : "transparent"};
        /* background-color: ${({theme, active}) => active? "rgba(var(--mui-palette-primary-mainChannel) / calc(var(--mui-palette-action-selectedOpacity)))" : "transparent"}; */
        /* background-color: ${(props) => props.active? props.theme.palette.mode == "dark"? props.theme.palette.background.paper : "#f3f3f3" : "transparent"}; */
        /* border-bottom: 1px solid ${({theme}) => theme.palette.divider};
        border-left: 4px solid ${(props) => props.active? props.theme.palette.info.main : 'transparent'}; */
        position:  ${(props) => props.active? "sticky" : 'static'};
        top: 70px;
        bottom: 0;
        z-index: ${(props) => props.active? 100 : 0};
        
        > .border-left {
            height: 90%;
            border-radius: 5px;
            flex-shrink: 0;
            width: 5px;
            margin-right: 5px;
            background: linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%);
            /* background-color: ${({theme, active}) => active? theme.palette.primary.main : "transparent"}; */
        }
        
        > .item {
            display: flex;
            gap: 15px;
            width: 300px;
            height: 100%;
            padding: 0 10px;
            z-index: 0;
            color: ${({theme, active}) => active? theme.palette.primary.main : theme.palette.text.primary};
            
            > .title {
                display: flex;
                flex: 1;
                justify-content: center;
                flex-direction: column;
                gap: 1px;
    
                > p {
                    font-size: 11px;
                }
            }
        }

        > .item:hover {
            background: none;
        }

    }
`

export default TimesheetItem;