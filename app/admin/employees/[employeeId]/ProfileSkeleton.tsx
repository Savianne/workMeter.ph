"use client"
import React from "react"
import { styled } from '@mui/material/styles';

import {
    Box,
    Skeleton,
    Paper
} from "@mui/material";


const StyledProfileSkeleton = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        flex-wrap: wrap;

        > .head {
            display: flex;
            flex: 0 1 100%;
            align-items: center;
            padding: 15px;

            > .avatar {
                display: inline-block;
                width: 100px;
                height: 100px;
            }

            > .name {
                display: flex;
                flex-direction: column;
                justify-content: center;
                margin-left: 15px;
                gap: 5px;
            }

            > .qr {
                margin-left: auto;
            }
        }

        > .tabs {
            display: flex;
            flex: 0 1 100%;
            gap: 15px;
            padding: 15px 0;
        }

        > .input-row {
            display: flex;
            flex: 0 1 100%;
            gap: 10px;
            margin: 10px 0;

            > .input {
                flex: 1;
            }
        }
    }
`;

const ProfileSkeleton: React.FC = () => {
    return(
        <StyledProfileSkeleton>
            <Paper className="head">
                <Skeleton className="avatar" variant="rounded" />
                <div className="name">
                    <h2>
                        <Skeleton className="avatar" variant="rounded" width={200} />
                    </h2>
                    <h5>
                        <Skeleton className="avatar" variant="rounded" width={300} />
                    </h5>
                    <Skeleton className="avatar" variant="rounded" width={100}/>
                </div>
                <Skeleton className="qr" variant="rounded" height={100} width={100} />
            </Paper>
            <div className="tabs">
                <Skeleton className="qr" variant="rounded" height={90} width={120} />
                <Skeleton className="qr" variant="rounded" height={90} width={120} />
                <Skeleton className="qr" variant="rounded" height={90} width={120} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
            <div className="input-row">
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
                <Skeleton className="input" variant="rounded" height={50} />
            </div>
        </StyledProfileSkeleton>
    )
} 

export default ProfileSkeleton;