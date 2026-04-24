"use client";
import { IStyledFC } from '@/app/types/IStyledFC';
import { styled } from '@mui/material/styles';
import React from "react";

import { 
    Skeleton
} from '@mui/material';

const SkeletonTimesheetFC: React.FC<IStyledFC> = ({className}) => {
    return(
        <div className={className}>
            <div className="top-container">
                <div className="title-area">
                    <Skeleton variant='rounded' height={20} width={200} />
                    <Skeleton variant='rounded' height={15} width={150} />
                </div>
                <div className="toogle-area">
                    <Skeleton variant='rounded' height={35} width={35} />
                    <Skeleton variant='rounded' height={35} width={35} />
                    <Skeleton variant='rounded' height={35} width={35} />
                    <Skeleton variant='rounded' height={35} width={35} />
                </div>
            </div>
            <div className="body-area">
                <Skeleton variant='rounded' height={300} width={"100%"} />
            </div>
        </div>
    )
}

const SkeletonTimesheet = styled(SkeletonTimesheetFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        padding: 0;
        flex-wrap: wrap;
        align-items: center;
        padding: 0 10px;
        gap: 10px;

        > .top-container {
            display: flex;
            flex: 0 1 100%;
            padding: 30px 0;
            align-items: center;
            
            > .title-area {
                display: flex;
                gap: 10px;
                width: fit-content;
                height: fit-content;
                flex-direction: column;
            }

            > .toogle-area {
                display: flex;
                width: fit-content;
                margin-left: auto;
                height: fit-content;
                gap: 10px;
            }
        }

        > .body-area {
            display: flex;
            flex: 0 1 100%;
        }

    }
`;

export default SkeletonTimesheet;