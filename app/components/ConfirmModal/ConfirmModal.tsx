import { Button, Divider, Paper, styled } from '@mui/material';

import {
    Backdrop,
    Box,
    Alert
} from "@mui/material";

type TModalContext = {
    closeModal: () => void;
    confirmText: string;
    confirmedCB: (() => void) | null;
    cancelledCB: (() => void) | null;
    modalState: "close" | "active" | "open" | "remove" | "inactive"
}

const ConfirmModal: React.FC<{context: TModalContext, severity?: "info" | "error" | "warning" | "success", buttonText?: string,}> = ({context, severity, buttonText}) => {

    return (
        <Backdrop open={!(context.modalState == "inactive")} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 10 }}>
            <Mover state={context.modalState}>
                <Modal>
                    <Alert severity={severity? severity : "info"} sx={{ width: '100%' }}>
                        {context.confirmText}
                    </Alert>
                    <div className="button-container">
                        <Button onClick={() => {
                            context.cancelledCB && context.cancelledCB()
                            context.closeModal();
                        }} size="small">
                            Cancel
                        </Button>
                        <Divider orientation="vertical" variant="middle"/>
                        <Button onClick={() => {
                            context.confirmedCB && context.confirmedCB();
                            context.closeModal();
                        }}  variant="contained" size="small">
                            {
                                buttonText? buttonText : "Confirm" 
                            }
                        </Button>
                    </div>
                </Modal>
            </Mover>
        </Backdrop>
    )
}

const Modal = styled(Paper)`
    display: flex;
    width: fit-content;
    max-width: 500px;
    flex-wrap: wrap;
    height: fit-content;

    .button-container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 5px;
        padding: 10px;
        flex: 0 1 100%;
    }
`
const Mover = styled(Box)<{state: string}>`
    position: absolute;
    top: ${prop => prop.state == "open"? 0 : '-20%'};
    opacity: ${prop => prop.state == "open"? 1 : 0.1};
    left: 0;
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: top 200ms, opacity 200ms;

`;

export default ConfirmModal;

