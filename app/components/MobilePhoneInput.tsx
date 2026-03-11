'use client'

import React, { useState } from 'react'
import { styled } from '@mui/material/styles';
import { IStyledFC } from '../types/IStyledFC'
import { Box, MenuItem, Select, TextField, SelectChangeEvent, Divider } from '@mui/material'
import theme from '../theme';

const countryCodes = [
  { code: '+63', label: 'Philippines' },
]

interface IPHPhoneNumberInput extends IStyledFC {
  value: string;
  required: boolean;
  disabled?: boolean;
  helperText?: string;
  onChange?: (value: string) => void
}

const PhoneInputFC: React.FC<IPHPhoneNumberInput> = ({className, value, onChange, required, disabled, helperText}) => {
  const [countryCode, setCountryCode] = useState('+63');

  const handleCodeChange = (event: SelectChangeEvent) => {
    setCountryCode(event.target.value)
  }

  return (
    <div className={className}>
      <div className="input">
        <Select
          value={countryCode}
          onChange={handleCodeChange}
          sx={{ minWidth: 120}}
          disabled={disabled}
        >
          {countryCodes.map((item) => (
            <MenuItem key={item.code} value={item.code}>
              {item.code} ({item.label})
            </MenuItem>
          ))}
        </Select>
        <Divider orientation="vertical" variant="middle" flexItem />
        <input disabled={disabled} maxLength={10} required={required} value={value} type='tel' placeholder='Mobile Number' onChange={(e) => onChange? onChange(e.target.value) : ''}/>
      </div>
      {
        helperText? <p>{helperText}</p> : ""
      }
    </div>
  )
}

const PhoneInput = styled(PhoneInputFC)<{error?: boolean}>`
  && {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    height: fit-content;

    > p {
      font-size: 13px;
      margin-top: 3px;
      color: ${(props) => props.error? theme.palette.mode == "light"? "#d32f2f" : "#c62828" : "inherit"};
    }

    > .input {
      display: flex;
      flex: 0 1 100%;
      height: fit-content;
      align-items: center;
      border: 1px solid gray;
      border-radius: 5px;
      border-color: ${(props) => props.error? theme.palette.mode == "light"? "#d32f2f" : "#c62828" : "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.23)"};

      fieldset {
          outline: 0;
          border: 0;
          margin-right: 20px;
      }

      > input {
          display: flex;
          flex: 1;
          height: 40px;
          outline: 0;
          border: 0;
          margin-left: 20px;
          background-color: transparent;
          font-size: 16px;
          color: ${(props) => props.error? theme.palette.mode == "light"? "#d32f2f" : "#c62828" : "inherit"};
      }
    }
  }
`

export default PhoneInput;