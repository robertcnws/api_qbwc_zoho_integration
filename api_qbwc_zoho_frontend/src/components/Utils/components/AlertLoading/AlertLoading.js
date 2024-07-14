import { Alert } from '@mui/material';
import React from 'react';


export function AlertLoading( {isSmallScreen} ) {
  return <Alert severity="info" xs={12} sx={{
              mt: 5,
              p: 2,
              marginLeft: isSmallScreen ? '0' : '3%',
              transition: 'margin-left 0.3s ease', 
          }}>
              Loading...
          </Alert>;
}
