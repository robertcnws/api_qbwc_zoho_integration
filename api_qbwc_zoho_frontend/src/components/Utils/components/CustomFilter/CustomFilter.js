import React from 'react';
import { Box, FormControl, ListSubheader, MenuItem, Select, TextField } from '@mui/material';

const CustomFilter = ({ configCustomFilter }) => {
  return (
    <FormControl variant="outlined" size="small" style={{ marginBottom: configCustomFilter.hasSearch ? configCustomFilter.marginBottomInDetails : '0'}}>
      {/* <InputLabel>{configCustomFilter.items.length}</InputLabel> */}
      <Select
        value={configCustomFilter.filter}
        onChange={configCustomFilter.handleFilterChange}
        label="Filter"
        sx={{
          fontSize: '22px',
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
