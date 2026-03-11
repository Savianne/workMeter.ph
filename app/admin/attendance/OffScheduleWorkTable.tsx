"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import doApiRequest from '@/app/helpers/doApiRequest';
import ITimeLogFromDb from '@/app/types/timelog-from-db';
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
    Avatar,
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

const StyledTimeLogTable = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        min-width: 0;
        overflow: hidden;
        padding: 5px;
        height: fit-content;
    }
`

const OffScheduleWorkTable: React.FC = () => {
    const [data, setData] = React.useState<ITimeLogFromDb[]>([
]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const columns = React.useMemo<MRT_ColumnDef<ITimeLogFromDb>[]>(() => [
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
            accessorKey: 'source', 
            header: 'Source',
        },
        {
            accessorFn: (row) => {/*Call the function that handles the computation of status*/}, 
            header: 'Status',
        },
        {
            accessorKey: 'time_in', 
            header: 'Time In',
        },
        {
            accessorKey: 'time_out', 
            header: 'Time Out',
        },
    ], [data, isSaving]);

    const table = useMaterialReactTable({
            columns,
            data,
            enableStickyHeader: false,
            enableTopToolbar: false,
            enableColumnPinning: true,
            state: {
                isLoading,
                isSaving
            },
            muiTablePaperProps: {
                sx: {
                    width: '100%',
                    minWidth: 0
                },
            },
        }
    )

    return(
        <StyledTimeLogTable>
            <MaterialReactTable table={table} />
        </StyledTimeLogTable>
    )
}

export default OffScheduleWorkTable;