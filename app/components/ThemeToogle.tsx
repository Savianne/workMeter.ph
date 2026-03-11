'use client'
import { IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useColorMode } from '../context/ThemeModeProvider'

import SunnyIcon from '@mui/icons-material/Sunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export default function ThemeToggle() {
  const theme = useTheme();
  const { toggleColorMode } = useColorMode()

  return (
    <IconButton onClick={toggleColorMode} color="primary" sx={{marginRight: "15px", flexShrink: 0, flexGrow: 0, width: '40px', height: '40px' }}>
      {theme.palette.mode === 'dark' ? <SunnyIcon sx={{width: '30px', height: '30px'}} /> : <DarkModeIcon sx={{width: '30px', height: '30px'}}/>}
    </IconButton>
  )
}