'use client' 

import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { PaletteMode } from '@mui/material'

const ThemeModeContext = createContext<{ toggleColorMode: () => void } | undefined>(undefined)

export function useColorMode() {
    const context = useContext(ThemeModeContext)
    if (!context) throw new Error('useColorMode must be used inside ColorModeProvider')
    return context
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<PaletteMode>('light')

    const toggleColorMode = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
    }

    const theme = useMemo(() =>
    createTheme({
        palette: {
            mode,
        },
        cssVariables: true,
    }), [mode]);

    return (
        <ThemeModeContext.Provider value={{ toggleColorMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    )
}
