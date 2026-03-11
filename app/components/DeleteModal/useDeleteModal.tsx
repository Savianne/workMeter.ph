"use client"
import { useContext } from "react";
import { DeleteModalContextProvider } from "@/app/context/DeleteModalContext";

function useDeleteModal() {
    const deleteModalContext = useContext(DeleteModalContextProvider);

    return deleteModalContext?.renderDeleteModal as (itemName: string, confirmBtnAction: () =>  Promise<{success: boolean}>, warning?: string) => void
}

export default useDeleteModal;