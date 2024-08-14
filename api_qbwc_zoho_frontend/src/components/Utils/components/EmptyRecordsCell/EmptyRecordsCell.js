import { TableCell, TableRow, Alert } from '@mui/material';
import React from 'react';

export const EmptyRecordsCell = ({ columns }) => {
  return (
    <TableRow>
      <TableCell colSpan={columns.length} align="center">
        <Alert severity="info" variant="outlined">
          No records to display.
        </Alert>
      </TableCell>
    </TableRow>
  );
}
