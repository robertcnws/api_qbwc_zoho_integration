import { Alert } from '@mui/material';
import React from 'react';


export const AlertLoading = ({ isSmallScreen, message }) => {
    return (
    <Alert severity="info" xs={12} sx={{
        mt: 3,
        p: 1,
        transition: 'margin-left 0.3s ease',
    }}>
        <b>Loading {message ? `(${message})` : ''}...</b>
    </Alert>
    )
}
