"use client";
import { styled, css } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from '@/app/types/IStyledFC';
import { useRouter, usePathname } from "next/navigation";
import AddEmployeeFormDialog from '@/app/components/dialogs/AddEmployeeForm';
import CreateTimesheetForm from '@/app/components/dialogs/CreateTimesheetForm';
import AddLeaveFormDialog from '@/app/components/dialogs/AddLeaveForm';
import AddLeaveTypeFormDialog from '@/app/components/dialogs/AddLeaveTypeForm';

import { 
    Paper,
    Chip
} from '@mui/material';

import { enqueueSnackbar } from 'notistack';

import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const QuickActionFC: React.FC<IStyledFC> = ({className}) => {
    const router = useRouter();
    const [addEmployeeForm, setAddEmployeeForm] = React.useState(false);
    const [createTimesheetForm, setCreateTimesheetForm] = React.useState(false);
    const [addLeaveRequestForm, setAddLeaveRequestForm] = React.useState(false);
    const [addLeaveTypeForm, setAddLeaveTypeForm] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 250; // Adjust for the scroll distance
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };
    return(
        <Paper className={className}>
            <AddLeaveTypeFormDialog onClose={() => setAddLeaveTypeForm(false)} state={addLeaveTypeForm} onSuccess={() => router.push('/admin/leave-types')}/>
            <AddLeaveFormDialog state={addLeaveRequestForm} onClose={() => setAddLeaveRequestForm(false)} onSuccess={() => router.push('/admin/leaves')}/>
            <CreateTimesheetForm state={createTimesheetForm} onClose={() => setCreateTimesheetForm(false)} onSuccess={(data) => router.push('/admin/attendance')}/>
            <AddEmployeeFormDialog onSuccess={(data) => router.push(`/admin/employees/${data.employee_id}?tab=information`)} onClose={() => setAddEmployeeForm(false)} state={addEmployeeForm} />
            <div className="top-container">
               <ElectricBoltIcon />
                <h4 style={{marginLeft: "10px"}}>Quick Actions</h4>
                <div className="scrollbtn-group">
                    <span className="scroll-left" onClick={() => scroll("left")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 73.4-73.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-128 128z"/></svg>
                    </span>
                    <span className="scroll-right" onClick={() => scroll("right")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"/></svg>
                    </span>
                </div>
            </div>
            <div className="actions-container" ref={scrollRef}>
                <div className="action-item">
                    <div className="icon">
                        <PersonAddAlt1Icon sx={{fontSize: "30px"}} />
                    </div>
                    <h5>Add Employee</h5>
                    <div className="action-btn" onClick={() => setAddEmployeeForm(true)}>
                        <ArrowForwardIosIcon />
                    </div>
                </div>
                <div className="action-item">
                    <div className="icon">
                        <AssignmentAddIcon sx={{fontSize: "30px"}} />
                    </div>
                    <h5>Create Timesheet</h5>
                    <div className="action-btn" onClick={() => setCreateTimesheetForm(true)}>
                        <ArrowForwardIosIcon />
                    </div>
                </div>
                <div className="action-item">
                    <div className="icon">
                        <EventBusyIcon sx={{fontSize: "30px"}} />
                    </div>
                    <h5>Add Leave</h5>
                    <div className="action-btn" onClick={() => setAddLeaveRequestForm(true)}>
                        <ArrowForwardIosIcon />
                    </div>
                </div>
                <div className="action-item">
                    <div className="icon">
                        <AssignmentAddIcon sx={{fontSize: "30px"}} />
                    </div>
                    <h5>Add Leave Type</h5>
                    <div className="action-btn" onClick={() => setAddLeaveTypeForm(true)}>
                        <ArrowForwardIosIcon />
                    </div>
                </div>
                <div className="action-item">
                    <div className="icon">
                        <AssignmentAddIcon sx={{fontSize: "30px"}} />
                    </div>
                    <h5>Add Leave Type</h5>
                    <div className="action-btn">
                        <ArrowForwardIosIcon />
                    </div>
                </div>
            </div>
        </Paper>
    )
}

const QuickAction = styled(QuickActionFC)`
    && {
        display: flex;
        flex:  0 1 100%;
        height: fit-content;
        padding: 20px;
        flex-wrap: wrap;
        gap: 20px;
        min-width: 0;

        > .top-container {
            display: flex;
            flex: 0 1 100%;
            min-width: 0;

            > .scrollbtn-group {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                margin: 10px 0;
                margin-left: auto;
                height: 0;
                gap: 5px;

                > .scroll-left, > .scroll-right {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-radius: 50%;
                    border: 1px solid #e6e6e6;

                    > svg {
                        height: 15px;
                        transition: fill 300ms;
                        fill: ${({theme}) => theme.palette.text.primary};
                    }
                }

                > .scroll-left:hover, > .scroll-right:hover {
                    background-color: black;
                    transition: background-color 300ms;

                    > svg {
                        fill: white;
                    }
                }
            }
        }

        > .actions-container {
            display: flex;
            flex: 0 1 100%;
            gap: 5px;
            overflow-x: auto;
            /* grid-gap: 5px;    
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); */

            > .action-item {
                display: flex;
                height: 60px;
                border-radius: 10px;
                border: 1px solid ${({theme}) => theme.palette.divider};
                align-items: center;
                flex: 1;
                min-width: 250px;

                > h5 {
                    text-align: center;
                }

                > .icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 50px;
                    height: 50px;
                    border-radius: 5px;
                }

                > .action-btn {
                    display: flex;
                    height: 100%;
                    width: 60px;
                    align-items: center;
                    justify-content: center;
                    margin-left: auto;
                    border-radius: 0 10px 10px 0;
                    color: white;
                    background: var(--primaryAppColor);
                    background: linear-gradient(90deg,rgba(25, 118, 210, 1) 0%, var(--secondaryAppColor) 100%);
                    cursor: pointer;
                }
            }
        }

         > .actions-container::-webkit-scrollbar {
            display: none;
        }
    }
`

export default QuickAction;