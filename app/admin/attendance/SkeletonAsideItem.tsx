"use client";
import { IStyledFC } from '@/app/types/IStyledFC';
import { styled } from '@mui/material/styles';
import React from "react";

import { 
    Skeleton
} from '@mui/material';

const SkeletonAsideItemFC: React.FC<IStyledFC> = ({className}) => {
    return(
        <div className={className}>
            <Skeleton variant='rounded' height={40} width={40}/>
            <div className="title">
                <Skeleton variant='rounded' height={20} width={200} />
                <Skeleton variant='rounded' height={15} width={150} />
            </div>
        </div>
    )
}

const SkeletonAsideItem = styled(SkeletonAsideItemFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 60px;
        padding: 0;
        align-items: center;
        padding: 0 10px;
        gap: 10px;

        > .title {
            display: flex;
            flex: 1;
            justify-content: center;
            flex-direction: column;
            gap: 5px;
        }
    }
`;

export default SkeletonAsideItem;