import { TableCell, TableRow, Alert } from '@mui/material';
import React from 'react';

export const EmptyRecordsCell = ({ columns, isColspanTable=false }) => {
  const colSpan = isColspanTable ? columns.length + 1 : columns.length;
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">
        <Alert severity="info" variant="outlined">
          No records to display.
        </Alert>
      </TableCell>
    </TableRow>
  );
}
