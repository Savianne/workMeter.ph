"use client";
import { styled, css } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from "@/app/types/IStyledFC";
import ServerClock from '@/app/components/ServerClock';
import SummaryBoad from './SummaryBoard';
import QuickAction from './QuickAction';
import TodaysSchedule from './TodaysSchedule';

const StyledPageFC:React.FC<IStyledFC> = ({className}) => {
    return(
        <div className={className}>
            <div className="top-container">
                <div className="left-area">
                    <h3>Welcome, Admin</h3>
                    <p>Here's what's happening with the team today</p>
                </div>
                <div className="server-clock-area">
                    <ServerClock />
                </div>
            </div>
            <div className="container">
                <div className="left-container">
                    <SummaryBoad />
                    <QuickAction />
                </div>
                <div className='right-container'>
                    <TodaysSchedule />
                </div>
            </div>
        </div>
    )
}

const StyledPage = styled(StyledPageFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        min-width: 0;
        flex-wrap: wrap;
        transition: 400ms ease-in-out;

        > .top-container {
            display: flex;
            flex: 0 1 100%;
            color: #fff;
            min-width: 0;
            background: var(--primaryAppColor);
            background: linear-gradient(90deg,rgba(25, 118, 210, 1) 0%, var(--secondaryAppColor) 100%);
            padding: 30px 20px;
            border-radius: 10px;

            > .left-area {
                display: flex;
                width: fit-content;
                flex-direction: column;

                > p {
                    font-size: 13px;
                    /* color: ${({theme}) => theme.palette.text.secondary}; */
                }
            }

            > .server-clock-area {
                width: fit-content;
                height: fit-content;
                margin-left: auto;
            }
        }

        > .container {
            display: flex;
            margin-top: 20px;
            flex: 0 1 100%;
            height: fit-content;
            min-width: 0;
            gap: 20px;

            > .left-container, > .right-container {
                display: flex;
                min-width: 0;
                height: fit-content;
                flex-wrap: wrap;
                gap: 20px;
                flex: 1;
            }

            > .right-container {
                flex: 0 0 350px;    
                height: 500px;
            }
        }
    }
`;

export default StyledPage;