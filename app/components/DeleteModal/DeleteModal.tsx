"use client"
import React from "react";
import { styled, keyframes } from '@mui/material/styles';
import { IStyledFC } from '@/app/types/IStyledFC';
import { enqueueSnackbar } from "notistack";
import { DeleteModalContextProvider } from "@/app/context/DeleteModalContext";

import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { 
    Button,
    IconButton,
    Divider,
    CircularProgress,
    Alert,
    Paper,
    AlertTitle
} from "@mui/material";


const FCDeleteModal: React.FC<IStyledFC> = ({className}) => {
    const deleteModalContext = React.useContext(DeleteModalContextProvider);
    const [showBlinker, updateShowBlinker] = React.useState(false);
    const [isDeleting, updateIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if(showBlinker) {
            setTimeout(() => {
                updateShowBlinker(false);
            }, 600)
        }
    }, [showBlinker]);
    return (
        !(deleteModalContext?.modalState == "inactive")? 
        <div className={className}>
            <div className="mover" onClick={() => deleteModalContext?.closeDeleteModal()} style={{top: deleteModalContext?.modalState == "open"? "0": '-100%', opacity: deleteModalContext?.modalState == "open"? 1 : 0.1}}>
                <Paper className="delete-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-body">
                        <div className="close-btn-area">
                            <span className="close-btn-container">
                                <IconButton 
                                aria-label="close"
                                onClick={(e) => deleteModalContext?.closeDeleteModal()}>
                                    <CloseIcon />
                                </IconButton>
                            </span>
                        </div>
                        <h1>Are you sure about this action?</h1>
                        <h2>You are about to delete <strong style={{fontSize: "12px"}}>"{deleteModalContext?.itemName}"</strong></h2>
                        <p style={{fontSize: '15px'}}>This action cannot be undone.</p>
                        {
                            deleteModalContext?.warning? <Alert severity="warning" sx={{flex: "0 1 100%", margin: "15px 0"}}>
                                <AlertTitle>Warning</AlertTitle>
                                {deleteModalContext.warning}
                            </Alert> : ""
                        }
                        <div className="modal-btn-container">
                            <Button 
                            startIcon={isDeleting? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />} 
                            color="error"
                            onClick={(e) => {
                                updateIsDeleting(true);
                                deleteModalContext?.confirmBtnAction && deleteModalContext?.confirmBtnAction()
                                .then(res => {
                                    if(res.success) {
                                        updateIsDeleting(false);
                                        deleteModalContext.closeDeleteModal();
                                        enqueueSnackbar("Delete Success", {variant: "default", anchorOrigin: {horizontal: "center", vertical: "top"}})
                                    } else throw res
                                })
                                .catch((err) => {
                                    updateIsDeleting(false);
                                    enqueueSnackbar("Failed to delete", {variant: "error", anchorOrigin: {horizontal: "center", vertical: "top"}})
                                })
                            }} 
                            >Continue delete</Button>
                            <Divider orientation="vertical" sx={{height: '30px'}} />
                            <Button  
                            variant="contained"
                            disabled={isDeleting}
                            onClick={(e) => deleteModalContext?.closeDeleteModal()} 
                            >Cancel</Button>
                        </div>
                    </div>
                </Paper>
            </div>
        </div>
        : null 
    )
}

const blinkAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

const DeleteModalStyled = styled(FCDeleteModal)`
    position: fixed;
    display: flex;
    width: 100%;
    height: 100vh;
    background-color: ${({theme}) => theme.palette.mode == "dark"? "#00000073" : "#1e1e1e38"};
    z-index: 5000;
    left: 0;
    top: 0;

    && > .mover {
        position: absolute;
        left: 0;
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        /* background-color: orange; */
        transition: top 100ms ease-in-out, opacity 200ms;

        > .delete-modal {
            position: relative;
            display: flex;
            flex: 0 1 450px;
            background-color: ${({theme}) => theme.palette.mode == "dark"? "#303030" : "#e7e7e7"};
            box-shadow: 17px 20px 61px 21px rgb(0 0 0 / 25%);
            flex-wrap: wrap;
            border-radius: 3px;
            padding: 30px;

            > .modal-body {
                display: flex;
                flex: 0 1 100%;
                flex-wrap: wrap;
                justify-content: center;

                > .close-btn-area {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    display: flex;
                    align-items: center;
                    width: 40px;
                    height: 40px;
                }

                > h1, > h2, > h3 {
                    font-size: 15px;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    text-align: center;
                }

                > h1 {
                    font-size: 13px;
                    font-weight: bold;
                    padding: 15px 0;
                }

                > h2 {
                    font-weight: 100;
                }

                > h3 {
                    text-decoration: underline;
                }

                > .modal-btn-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 30px;
                    gap: 10px;
                    flex: 0 1 100%;
                    height: 40px;
                    padding: 20px 0;
                }
            }
        }    
    }
`;

const DeleteModal: React.FC = () => {
    return <DeleteModalStyled />
}

export default DeleteModal;
