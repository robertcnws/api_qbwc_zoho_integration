import { Alert } from '@mui/material';
import React from 'react';

export const AlertError = ({isSmallScreen, error}) => {
  return <Alert severity="error" xs={12} sx={{
              mt: 3,
              p: 1,
              marginLeft: isSmallScreen ? '0' : '-19%',
              transition: 'margin-left 0.3s ease', 
              minWidth: '83.5vw',
          }}>
              {error}
          </Alert>
}
