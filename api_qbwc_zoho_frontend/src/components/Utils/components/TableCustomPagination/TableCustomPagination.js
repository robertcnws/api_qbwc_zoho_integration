// import React from 'react';
// import { TableRow, TableCell, TablePagination } from '@mui/material';

// const TableCustomPagination = ({ columnsLength, data, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
//     const absPage = page < 0 ? 0 : page;
//     return (
//         <TableRow>
//             <TableCell colSpan={columnsLength} align="right" sx={{ borderBottom: 'none'}}>
//                 <TablePagination
//                     rowsPerPageOptions={[5, 10, 25, 50]}
//                     component="div"
//                     count={data.length}
//                     rowsPerPage={rowsPerPage}
//                     page={absPage}
//                     onPageChange={handleChangePage}
//                     onRowsPerPageChange={handleChangeRowsPerPage}
//                     labelRowsPerPage="Rows"
//                 />
//             </TableCell>
//         </TableRow>
//     );
// }

// export default TableCustomPagination;

import React, { useState } from 'react';
import { TableRow, TableCell, TablePagination, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Settings } from '@mui/icons-material';

const TableCustomPagination = ({ columnsLength, data, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const absPage = page < 0 ? 0 : page;

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleChangeRowsPerPage({ target: { value: newItemsPerPage } });
        handleMenuClose();
    };

    return (
        <TableRow sx={{ marginTop: '20px'}}>
            <TableCell colSpan={columnsLength} align="right" sx={{ borderBottom: 'none', paddingTop: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                    {/* Contenedor para Typography e IconButton */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        border: '1px solid #dcdcdc', 
                        borderTopLeftRadius: '10px',
                        borderBottomLeftRadius: '10px',
                        // borderRadius: '4px', 
                        padding: '0px', 
                        height: '48px',
                        marginBottom: '15px', 
                        backgroundColor: '#f7f7fe'
                        }}>
                        <IconButton
                            onClick={handleMenuOpen}
                            sx={{ color: 'gray', height: '100%' }}
                        >
                            <Settings />
                            <span style={{ fontSize: '13px', marginLeft: '5px' }}>{rowsPerPage} Per page</span>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => handleItemsPerPageChange(5)}>5 Per page</MenuItem>
                            <MenuItem onClick={() => handleItemsPerPageChange(10)}>10 Per page</MenuItem>
                            <MenuItem onClick={() => handleItemsPerPageChange(25)}>25 Per page</MenuItem>
                            <MenuItem onClick={() => handleItemsPerPageChange(50)}>50 Per page</MenuItem>
                        </Menu>
                    </div>

                    {/* Contenedor para TablePagination */}
                    <div style={{ 
                        border: '1px solid #dcdcdc', 
                        borderTopRightRadius: '10px',
                        borderBottomRightRadius: '10px',
                        padding: '0px', 
                        height: '48px', 
                        marginLeft: '-10px',
                        marginBottom: '15px',  
                        }}>
                        <TablePagination
                            rowsPerPageOptions={[]}
                            component="div"
                            count={data.length}
                            rowsPerPage={rowsPerPage}
                            page={absPage}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={() => { }}
                            labelRowsPerPage="Rows:"
                        />
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default TableCustomPagination;


