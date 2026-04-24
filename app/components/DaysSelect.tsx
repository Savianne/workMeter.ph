"use client"
import React from "react"
import { styled } from '@mui/material/styles';
import { IStyledFC } from "@/app/types/IStyledFC"
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckIcon from '@mui/icons-material/Check';

import { 
    Paper,
    Chip,
    Box
} from '@mui/material';

interface IDaysSelect extends IStyledFC {
    value: {
        sunday: boolean;
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
    };
    onChange: (val: {
        sunday: boolean;
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
    }) => void
}

const DaysSelectFC: React.FC<IDaysSelect> = ({className, value, onChange}) => {

    return(
        <Box className={className}>
            {
                Object.entries(value).map(item => (
                    <div className={item[1]? "day-item selected" : "day-item"} key={item[0]} onClick={() =>  onChange({...value, [item[0]]: !item[1]})}>
                        <div className="radio">
                           {item[1]? <CheckIcon /> : ""}
                        </div>
                        <div className="day-text">
                            {item[0].slice(0, 3).toUpperCase()}
                        </div>
                    </div>
                ))
            }
        </Box>
    )
}

const DaysSelect = styled(DaysSelectFC)`
    && {
        display: flex;
        width: fit-content;
        height: fit-content;
        gap: 10px;

        > .day-item {
            display: flex;
            width: fit-content;
            height: fit-content;
            padding: 5px;
            border-radius: 19px;
            background-color: #cdcdcd;
            flex-direction: column; 

            > .radio, > .day-text {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 13px;
                background-color: #FFF;
            }

            > .radio {
                font-size: 20px;
                cursor: pointer;
                border: 1px solid ${({theme}) => theme.palette.divider};
            }
            
            > .day-text {
                background-color: transparent;
                height: 30px;
                font-size: 13px;
                font-weight: bold;
                color: #FFF;
            }
            
        }

        > .selected {
            background: #1976D2;
            background: linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%);
            color: var(--secondaryAppColor);
            
        }

    }
`;

export default DaysSelect;