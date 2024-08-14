import React from 'react';
import { TableRow, TableCell, TablePagination } from '@mui/material';

const TableCustomPagination = ({ columnsLength, data, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
    const absPage = page < 0 ? 0 : page;
    return (
        <TableRow>
            <TableCell colSpan={columnsLength} align="right" sx={{ borderBottom: 'none'}}>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={absPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Rows"
                />
            </TableCell>
        </TableRow>
    );
}

export default TableCustomPagination;
