"use client";
import React from "react";
import { styled } from '@mui/material/styles';
import { useServerClock } from "./hooks/userServerClock";
import { IStyledFC } from "../types/IStyledFC";

import { 
    Box,
    Skeleton
} from "@mui/material";

const ServerClockFC: React.FC<IStyledFC> = ({className, ...rest}) =>  {
  const time = useServerClock();

  if (!time) return null;
  
  return (
    <Box className={className} {...rest}>
        <h6>Server Time</h6>
        <h3>{time.toLocaleTimeString()}</h3>
    </Box>
  )
}

const ServerClock = styled(ServerClockFC)`
    && {
        display: flex;
        width: fit-content;
        flex-direction: column;
    }
`

export default ServerClock;
