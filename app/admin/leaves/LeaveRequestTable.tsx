"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import TLeaveRequestFromDB from '@/app/types/leave-request-from-db';
import AddLeaveTypeFormDialog from '@/app/components/dialogs/AddLeaveTypeForm';
import { object, mixed, number, string, ValidationError } from 'yup';
import debounce from "lodash/debounce";
import useDeleteModal from '@/app/components/DeleteModal/useDeleteModal';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import AddLeaveFormDialog from '@/app/components/dialogs/AddLeaveForm';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef
} from 'material-react-table';

import { 
    Box,
    Avatar,
    Chip,
    Tooltip,
    IconButton,
    InputAdornment,
    Button,
    MenuItem,
    ListItemIcon,
    CircularProgress
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

//MUI Icons
import PendingIcon from '@mui/icons-material/Pending';
import EventIcon from '@mui/icons-material/Event';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

const StyledLeaveRequestTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`

const defaultFormValidation: {
    paid:  string | null,
    status:  string | null
} = {
    paid: null,
    status: null
}

const LeaveRequestTable: React.FC = () => {
    const [data, setData] = React.useState<TLeaveRequestFromDB[]>([]);
    const deleteModal = useDeleteModal();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [formValidation, setFormValidation] = React.useState({...defaultFormValidation});
    const [yearFilter, setYearFilter] = React.useState(dayjs().toString());
    const [addLeaveFormState, setAddLeaveFormState] = React.useState(false);
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

    const columns = React.useMemo<MRT_ColumnDef<TLeaveRequestFromDB>[]>(() => [
        {
            accessorKey: 'employee_id', 
            header: 'Employee',
            id: "employee",
            enableEditing: false,
            muiTableHeadCellProps: {align: 'left'},
            Edit: () => null,
            Cell: ({ row }) => (
                <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '250px',
                    gap: '1rem',
                }}
                >
                    <Avatar src={row.original.display_picture? `/images/avatar/${row.original.display_picture}` : undefined} alt={row.original.first_name} />
                    <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    >
                        <strong style={{fontSize: "13px"}}>{`${row.original.first_name.toUpperCase()} ${row.original.middle_name? row.original.middle_name[0].toUpperCase() + "." : ""} ${row.original.surname.toUpperCase()} ${row.original.ext_name? row.original.ext_name.toUpperCase() : ""}`}</strong>
                        <p style={{textAlign: 'left'}}>{row.original.designation}</p>
                    </Box>
                </Box>
            ),
        },
        {
            accessorKey: 'title', 
            header: 'Leave Type',
            enableColumnFilter: false,
            enableSorting: false,
            enableEditing: false,
            Edit: () => null
        },
        {
            accessorKey: 'date', 
            header: 'Date',
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableEditing: false,
            Edit: () => null,
            Cell: ({row}) => (
                <Chip icon={<EventIcon />} label={new Date(row.original.date).toDateString()} variant="outlined" />
            )
        },
        {
            accessorKey: 'paid', 
            header: 'Paid',
            enableColumnOrdering: false,
            enableSorting: false,
            enableEditing: true,
            editVariant: 'select',
            editSelectOptions: ["paid", "not-paid"],
            muiEditTextFieldProps: {
                error: !!formValidation.paid,
                helperText: formValidation.paid,
                disabled: isSaving,
                onChange: (e) => {
                    handleInputValidation(() => mixed().oneOf(['paid', 'not-paid'] as const).defined().validate(e.target.value), (error) => setFormValidation({...formValidation, paid: error}), () => setFormValidation({...formValidation, paid: null}))
                }
            },
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
        {
            accessorKey: 'status', 
            header: 'Status',
            enableSorting: false,
            enableEditing: true,
            editVariant: 'select',
            editSelectOptions: ["pending", "approved", "denied"],
            muiEditTextFieldProps: {
                error: !!formValidation.status,
                helperText: formValidation.status,
                disabled: isSaving,
                onChange: (e) => {
                    handleInputValidation(() => mixed().oneOf(["pending", "approved", "denied"] as const).defined().validate(e.target.value), (error) => setFormValidation({...formValidation, status: error}), () => setFormValidation({...formValidation, status: null}))
                }
            },
            Cell: ({ row }) => (
                <Box
                >
                    {
                        row.original.status == "pending"?
                        <Chip icon={<PendingIcon />} label="Pending" color="info" /> :
                        row.original.status == "denied"?
                        <Chip icon={<DoNotDisturbOnIcon />} label="Denied" color="default" /> :
                        <Chip icon={<ThumbUpAltIcon />} label="Approved" color="success" />

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
        enableGrouping: true,
        initialState: {
            columnPinning: { left: ['employee'] },
            grouping: ['employee'],
        },
        enableEditing: true,
        editDisplayMode: "modal",
        renderTopToolbarCustomActions: () => (
            <Box sx={{display: 'flex', gap: "10px", alignItems: "center"}}>
                <DatePicker label="View by year" openTo="year" views={['year']}
                value={dayjs(yearFilter)}
                onChange={(e) => setYearFilter(dayjs(e).toString())}
                slotProps={{
                    popper: {
                        sx: {
                            zIndex: 2000,
                        },
                    },
                    textField: {
                        error: false,
                        size: "small",
                        InputProps: {
                            startAdornment: (
                            <InputAdornment position="start">
                                <FilterListIcon />
                            </InputAdornment>
                            ),
                        },
                    },
                }}/>
                <Button variant='contained' size='medium' startIcon={<AddIcon />} onClick={() => setAddLeaveFormState(true)}>Add Leave</Button>
            </Box>
        ),
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
                    paid: mixed().oneOf(['paid', 'not-paid'] as const).defined(),
                    status: mixed().oneOf(["pending", "approved", "denied"] as const).defined()
                }).validate({
                    paid: values.paid,
                    status: values.status
                });

                doApiRequest<{success: boolean}>(
                    "/api/private/update/update-leave-request",
                    (resdata) => {
                        const updatedData = [...data];

                        updatedData[row.index] = {
                            ...row.original,
                            ...values,
                        };

                        setData(updatedData);
                        enqueueSnackbar("Update Success", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
                        table.setEditingRow(null);
                    },
                    (state) => setIsSaving(state),
                    (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}}),
                    {
                        method: "POST",
                        body: JSON.stringify({...values, id: row.original.id, leave_type: row.original.leave_type})
                    }
                )
            }
            catch(err) {
                enqueueSnackbar("Unable to submit the form. Please make sure all required fields are filled out correctly and there are no errors.", {variant: "default", anchorOrigin: {vertical: "top", horizontal: "center"}})
            }
        },
        renderRowActions: ({ row, table }) => (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
                <Tooltip title="Edit">
                <IconButton onClick={() => table.setEditingRow(row)}>
                    <EditIcon />
                </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                <IconButton color="error" onClick={() => {
                    deleteModal(`Leave Request from ${row.original.first_name} ${row.original.surname}`, () => {
                        return new Promise<{success: boolean}>((res, rej) => {
                            doApiRequest<{success: boolean}>(
                                "/api/private/delete/delete-leave-request",
                                (resdata) => {
                                    const newData = [...data.filter(item => item.id != row.original.id)];
                                    setData(newData);
                                    res(resdata)
                                },
                                (state) => {/*I love you*/},
                                (error) => rej(error.message),
                                {
                                    method: "DELETE",
                                    body: JSON.stringify({id: row.original.id})
                                }
                            )
                        })
                    })
                }}>
                    <DeleteIcon />
                </IconButton>
                </Tooltip>
            </Box>
            ),
    })

    React.useEffect(() => {
        doApiRequest<TLeaveRequestFromDB[]>(
            `/api/private/get/get-leave-request?year=${dayjs(yearFilter).year()}`,
            (data) => {
                setData(data);
            },
            (state) => setIsLoading(state),
            (error) => enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: 'top', horizontal: "center"}})
        )
    }, [yearFilter])

    return(
        <StyledLeaveRequestTable>
            <AddLeaveFormDialog state={addLeaveFormState} onClose={() => setAddLeaveFormState(false)} onSuccess={(newData) => setData([...data, newData])} />
            <MaterialReactTable table={table} />
        </StyledLeaveRequestTable>
    )
}

export default LeaveRequestTable;