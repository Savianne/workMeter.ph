"use client"
import React from "react"
import { styled } from '@mui/material/styles';
import { IStyledFC } from "@/app/types/IStyledFC"
import WhatshotIcon from '@mui/icons-material/Whatshot';
import RunPayrollForm from "./RunPayrollForm";
import { 
    Paper,
    Chip
} from '@mui/material';

const StyledPageFC: React.FC<IStyledFC> = ({className}) => {

    return(
        <div className={className}>
            <div className="header">
                <span>
                    <h1>SMART</h1>
                    <h1>PAYROLL</h1>
                </span>
                <div className="feature-text">
                    <h2> <WhatshotIcon /> Accurate</h2>
                    <h2> <WhatshotIcon /> Automated</h2>
                    <h2> <WhatshotIcon /> Effortless</h2>
                </div>
                <h4>Simply complete the form to run payroll.</h4>
            </div>
            <div className="form-container">
                <RunPayrollForm />
            </div>
        </div>
    )
}


const StyledPage = styled(StyledPageFC)`
    && {
        display: flex;
        flex: 0 1 100%;
        flex-wrap: wrap;
        height: fit-content;
        
        > .header {
            position: relative;
            transition: all 0.3s ease-in-out;
            overflow: hidden;
            display: flex;
            flex: 0 1 100%;
            padding: 70px 20px 130px 20px;
            margin-top: 20px;
            justify-content: center;
            border-radius: 20px;
            background: #1976D2;
            background: linear-gradient(0deg, var(--primaryAppColor) 0%, var(--secondaryAppColor) 100%);
            color: white;
            flex-wrap: wrap;

            > span {
                display: flex;
                gap: 1.5ch;
                
                > h1 {
                    font-size: 3.5vw;
                }
            }

            > .feature-text {
                display: flex;
                flex: 0 1 100%;
                justify-content: center;
                gap: 10px;

                > h2 {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 50px;
                    font-size: 15px;
                    border: 1px solid white;
                }
            }

            > h4 {
                margin-top: 20px;
            }

            ::before {
                animation: shine 3.5s ease-out infinite;
            }


            ::before {
            content: "";
                position: absolute;
                width: 500px;
                height: 100%;
                background-image: linear-gradient(
                    120deg,
                    rgba(255, 255, 255, 0) 30%,
                    rgba(247, 201, 252, 0.379),
                    rgba(255, 255, 255, 0) 70%
                );
                top: 0;
                left: -100px;
                opacity: 0.6;
            }
        }

        > .form-container {
            display: flex;
            flex: 0 1 100%;
            z-index: 10;
            justify-content: center;
        }
    }


    @keyframes shine {
        0% {
            left: -100px;
        }

        60% {
            left: 100%;
        }

        to {
            left: 100%;
        }
    }
`;

export default StyledPage;