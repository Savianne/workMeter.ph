import {useState, useEffect} from 'react';

export default function useConfirmModal() {
    const [modalState, setModalState] = useState<"close" | "active" | "open" | "remove" | "inactive">("inactive");
    const [confirmText, setConfirmText] = useState("");
    const [confirmedCB, setConfirmedCB] = useState<(() => void) | null>(null);
    const [cancelledCB, setCancelledCB] = useState<(() => void) | null>(null);

    useEffect(() => {
        if(modalState == "close") {
            setTimeout(() => {
                setModalState("inactive");
            }, 100);
        }

        if(modalState == "active") {
            setTimeout(() => {
                setModalState("open");
            }, 10);
        }
    }, [modalState]);

    return {
        modal: {
            closeModal: () => setModalState("close"),
            modalState,
            confirmText,
            confirmedCB,
            cancelledCB,
        },
        confirm: (question: string, confirmed: () => void, cancelled?: () => void) => {
            setConfirmText(question);
            setConfirmedCB(() => confirmed);
            cancelled && setCancelledCB(() => cancelled);
            setModalState('active')
        },

    }
}