import React from 'react';
import { Box, FormControl, ListSubheader, MenuItem, Select, TextField } from '@mui/material';

const CustomFilter = ({ configCustomFilter, fontSize }) => {
  return (
    <FormControl variant="outlined" size="small" style={{ marginBottom: configCustomFilter.hasSearch ? configCustomFilter.marginBottomInDetails : '0' }}>
      {/* <InputLabel>{configCustomFilter.items.length}</InputLabel> */}
      <Select
        value={configCustomFilter.filter}
        onChange={configCustomFilter.handleFilterChange}
        label="Filter"
        sx={{
          fontSize: fontSize ? fontSize : '22px',
          border: 'none',
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiSelect-select': {
            padding: '10px',
          },
          '& .MuiInputLabel-root': {
            top: '-6px',
          },
          color: '#212529',
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              position: 'absolute',
              top: '100%',  // Sitúa el menú justo debajo del select
              left: 0,
              width: 'auto',
              // paddingLeft: '5px',
              overflowX: 'auto',
              boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.15)',
              zIndex: 1300,
              // maxHeight: '200px',  // Ajusta la altura máxima si es necesario
              display: 'flex',
              flexDirection: 'column',
            },
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        }}
      >
        {configCustomFilter.listValues.map((item, index) => (
          <MenuItem key={index} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
        {configCustomFilter.hasSearch && (
          <ListSubheader>
            <Box>
              <TextField
                label={configCustomFilter.searchPlaceholder}
                variant="outlined"
                size="small"
                value={configCustomFilter.searchSelectTerm}
                onChange={configCustomFilter.handleSearchSelectChange}
                onFocus={(e) => { e.target.select(); }}
                sx={{ width: '100%' }}
              />
            </Box>
          </ListSubheader>
        )}
      </Select>
    </FormControl>
  );
}

export default CustomFilter;
