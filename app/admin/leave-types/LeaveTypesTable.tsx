"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import { ILeaveTypesFromDB } from '@/app/types/leave-types-from-db';
import AddLeaveTypeFormDialog from '@/app/components/dialogs/AddLeaveTypeForm';
import { object, number, string, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import useDeleteModal from '@/app/components/DeleteModal/useDeleteModal';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Chip,
    Button,
    MenuItem,
    ListItemIcon,
    CircularProgress
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

//MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledLeaveTypesTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`

const defaultFormValidation: {
    title: string | null,
    yearly_credits: string | null,
    paid: string | null
} = {
    title: null,
    yearly_credits: null,
    paid: null
}

const LeaveTypesTable: React.FC = () => {
    const [data, setData] = React.useState<ILeaveTypesFromDB[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [addLeaveTypeState, setAddLeaveTypeState] = React.useState(false);
    const [formValidation, setFormValidation] = React.useState({...defaultFormValidation});
    const deleteLeaveType = useDeleteModal();
    
    const handleInputValidation = React.useCallback(
        debounce(async (scheme: () => Promise<any>, onInvalid: (error: string) => void, onValid: () => void) => {
            try {
                await scheme();
                onValid();
            }
            catch(err) {
                if (err instanceof ValidationError) {
                    onInvalid(err.message)
                }
            }
        }, 500), 
    []);

    const columns = React.useMemo<MRT_ColumnDef<ILeaveTypesFromDB>[]>(() => [
        {
            accessorKey: 'title', 
            header: 'Title',
            muiEditTextFieldProps: {
                error: !!formValidation.title,
                helperText: formValidation.title,
                disabled: isSaving,
                onChange: (e) => {
                    handleInputValidation(() => string().max(35).required().validate(e.target.value), (error) => setFormValidation({...formValidation, title: error}), () => setFormValidation({...formValidation, title: null}))
                }
            }
        },
        {
            accessorKey: 'yearly_credits',
            header: 'Yearly Credits',
            muiEditTextFieldProps: {
                type: 'number',
                error: !!formValidation.yearly_credits,
                helperText: formValidation.yearly_credits,
                disabled: isSaving,
                onChange: (e) => {
                    handleInputValidation(() => number().min(1).required().validate(e.target.value), (error) => setFormValidation({...formValidation, yearly_credits: error}), () => setFormValidation({...formValidation, yearly_credits: null}))
                }
            }
        },
        {
            accessorKey: 'paid',
            header: 'Paid Leave',
            editVariant: 'select',
            muiEditTextFieldProps: {
                disabled: isSaving,
                error: !!formValidation.paid,
                helperText: formValidation.paid,
                onChange: (e) => {
                    handleInputValidation(() => string().required().validate(e.target.value), (error) => setFormValidation({...formValidation, paid: error}), () => setFormValidation({...formValidation, paid: null}))
                }
            },
            editSelectOptions: ['paid', 'not-paid'],
            size: 80,
            Cell: ({ row }) => (
                <Box
                >
                    {
                        row.original.paid == "paid"?
                        <Chip label="Paid" color="primary" /> : <Chip label="Not Paid" color="default" />
                    }
                </Box>
            ),
        },
    ], [data, formValidation, isSaving])

    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: false,
        enableColumnPinning: true,
        enableEditing: true,
        state: {
            isLoading,
            isSaving
        },
        muiTablePaperProps: {
            sx: {
                width: '100%',
            },
        },
        muiTableHeadCellProps: {align: 'center'},
        muiTableBodyCellProps: {align: 'center'},
        renderTopToolbarCustomActions: () => (
            <Button variant="contained" endIcon={<AddIcon />} onClick={() => setAddLeaveTypeState(true)}>Add Leave Type</Button>
        ),
        enableRowActions: true,
        renderRowActionMenuItems: ({ closeMenu, row }) => [
            <MenuItem
            key={1}
            color='error'
            onClick={() => {
                closeMenu();
                deleteLeaveType(row.original.title, () => {
                    return new Promise((res, rej) => {
                        doApiRequest<{success: boolean}>(
                            "/api/private/delete/delete-leave-type",
                            (resdata) => { 
                                const newData = [...data.filter(item => item.id != row.original.id)];
                                setData(newData);
                                res(resdata);
                            },
                            (state) => {/*I love you*/},
                            (error) => rej(error.message),
                            {
                                method: "DELETE",
                                body: JSON.stringify({id: row.original.id})
                            }
                        )
                    })
                }, "After deletion, this item may still appear in some parts of the application.")
            }}
            sx={{ m: 0 }}
            >
            <ListItemIcon>
                <DeleteIcon />
            </ListItemIcon>
            Delete
            </MenuItem>,
        ],
        onEditingRowSave: async ({ table, values, row, exitEditingMode }) => {
            const originalData = row.original;

            // Check if something changed
            const hasChanges = Object.keys(values).some((key) => {
                return values[key] !== originalData[key as keyof typeof originalData];
            });

            if (!hasChanges) {
                // No changes → just close dialog
                table.setEditingRow(null);
                return;
            }

            try {
                await object({
                    title: string().max(35).required(),
                    yearly_credits: number().min(1).required(),
                    paid: string().required()
                }).validate({...values});

                doApiRequest<{success: boolean}>(
                    "/api/private/update/update-leave-type",
                    (resdata) => {
                        const updatedData = [...data];
        
                        updatedData[row.index] = {
                            ...row.original,
                            ...values,
                        };
        
                        setData(updatedData);
                        enqueueSnackbar("Edit Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                        table.setEditingRow(null);
                    },
                    (state) => setIsSaving(state),
                    (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
                    {
                        method: "POST",
                        body: JSON.stringify({...values, id: row.original.id})
                    }
                )
            }
            catch(err) {
                enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }
    
        },
    })

    React.useEffect(() => {
        doApiRequest<ILeaveTypesFromDB[]>(
            "/api/private/get/get-leave-types",
            (data) => {
                setData(data);
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: 'top', horizontal: "center"}})
        )
    }, [])
    return(
        <StyledLeaveTypesTable>
            <AddLeaveTypeFormDialog state={addLeaveTypeState} onSuccess={(newData) => setData([...data, {...newData}])} onClose={() => setAddLeaveTypeState(false)} />
            <MaterialReactTable 
            table={table}
            />
        </StyledLeaveTypesTable>
    )
}

export default LeaveTypesTable;