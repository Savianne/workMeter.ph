"use client"
import React from "react";
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

const NotiStackProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    return (
        <SnackbarProvider maxSnack={1}>
            {children}
        </SnackbarProvider>
    )
}

export default NotiStackProvider;