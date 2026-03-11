"use client"
import React, { ReactNode, createContext, useContext } from 'react';

type TConfirmDeleteFunctionReturnPromise = Promise<{success: boolean, error: string | null}>;

export type TConfirmDeleteFunction = () => TConfirmDeleteFunctionReturnPromise;

interface IDeleteModalContext {
    modalState: "close" | "active" | "open" | "remove" | "inactive";
    itemName: string;
    warning: string | null;
    closeDeleteModal: () => void;
    renderDeleteModal: (itemName: string, confirmBtnAction: TConfirmDeleteFunction, warning?: string) => void,
    confirmBtnAction: TConfirmDeleteFunction | null
}

export const DeleteModalContextProvider = createContext<IDeleteModalContext | undefined>(undefined);

const DeleteModalContext:React.FC<{children: ReactNode}> = ({children}) => {

    const [deleteModalState, updateDeleteModalState] = React.useState<"close" | "active" | "open" | "remove" | "inactive">("inactive");
    const [confirmBtnFunction, setConfirmBtnFunction] = React.useState<null |TConfirmDeleteFunction>(null);
    const [itemName, setItemName] = React.useState("");
    const [warning, setWarning] = React.useState<string | null>(null);

    React.useEffect(() => {
        if(deleteModalState == "close") {
            setTimeout(() => {
                updateDeleteModalState("inactive");
                setConfirmBtnFunction(null);
                setItemName("");
                setWarning(null);
            }, 100);
        }

        if(deleteModalState == "active") {
            setTimeout(() => {
                updateDeleteModalState("open");
            }, 10);
        }
    }, [deleteModalState]);

    return (
        <DeleteModalContextProvider.Provider value={{
            modalState: deleteModalState,
            itemName: itemName,
            warning: warning,
            confirmBtnAction: confirmBtnFunction,
            closeDeleteModal: () => updateDeleteModalState("close"),
            renderDeleteModal: (itemName, confirmBtnAction, warning) => {
                setItemName(itemName);
                setWarning(warning? warning : null);
                setConfirmBtnFunction(() => confirmBtnAction);
                updateDeleteModalState("active");
            }
        }}>
            { children }
        </DeleteModalContextProvider.Provider>
    )
}

export default DeleteModalContext;