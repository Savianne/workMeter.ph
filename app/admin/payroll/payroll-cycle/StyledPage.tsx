"use client"
import React from "react"
import { styled } from '@mui/material/styles';
import { IStyledFC } from "@/app/types/IStyledFC"

const StyledPageFC: React.FC<IStyledFC> = ({className}) => {

    return(
        <div className={className}>
            <h1>
            Payroll Cycles
            </h1>
        </div>
    )
}


const StyledPage = styled(StyledPageFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: fit-content;
    }
`;

export default StyledPage;