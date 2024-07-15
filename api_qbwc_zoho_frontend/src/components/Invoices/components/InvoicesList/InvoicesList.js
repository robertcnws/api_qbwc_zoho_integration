import React, { useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    IconButton,
    TablePagination,
    FormControl,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import ClearIcon from '@mui/icons-material/Clear';

const InvoicesList = ({ data }) => {
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [page, setPage] = useState(0);
    const [filterDate, setFilterDate] = useState(null); // Estado para almacenar la fecha seleccionada para filtrar
    const [searchTerm, setSearchTerm] = useState(''); // Estado para almacenar el término de búsqueda
    const [rowsPerPage, setRowsPerPage] = useState(10); // Filas por página

    // Función para cambiar la página en la paginación
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Función para cambiar el número de filas por página
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Función para manejar el click en el botón de sincronización forzada
    const handleForceToSync = () => {
        if (selectedInvoices.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one invoice to force sync.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to force sync selected invoices?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, force to sync!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Aquí puedes implementar la lógica para enviar las facturas seleccionadas al servidor para forzar la sincronización
                console.log('Force to sync selected invoices:', selectedInvoices);
                // Ejemplo de recargar la página después de la sincronización exitosa
                // window.location.reload();
            }
        });
    };

    // Función para determinar si una factura está seleccionada
    const isSelected = (invoiceId) => selectedInvoices.indexOf(invoiceId) !== -1;

    // Función para manejar el click en el checkbox de una factura
    const handleCheckboxClick = (event, invoiceId) => {
        const selectedIndex = selectedInvoices.indexOf(invoiceId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedInvoices, invoiceId];
        } else {
            newSelected = selectedInvoices.filter((id) => id !== invoiceId);
        }

        setSelectedInvoices(newSelected);
    };

    // Función para filtrar las facturas por fecha
    const filterByDate = (invoice) => {
        if (!filterDate) return true; // Si no hay fecha seleccionada, mostrar todas las facturas
        const invoiceDate = new Date(invoice.date); // Ajustar la fecha dependiendo del formato recibido
        return invoiceDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0]; // Comparar solo las fechas (sin hora)
    };

    // Función para filtrar las facturas por término de búsqueda
    const filterBySearchTerm = (invoice) => {
        if (!searchTerm) return true; // Si no hay término de búsqueda, mostrar todas las facturas
        const normalizedSearch = searchTerm.toLowerCase().trim();
        return (
            invoice.invoice_number.toLowerCase().includes(normalizedSearch) ||
            invoice.customer_name.toLowerCase().includes(normalizedSearch)
        );
    };

    // Función para limpiar los filtros de fecha y término de búsqueda
    const clearFilters = () => {
        setFilterDate(null);
        setSearchTerm('');
    };

    // Función para determinar el color de fondo basado en el estado de la factura
    const getBackgroundColor = (invoice) => {
        if (invoice.customer_unmatched || invoice.items_unmatched) {
            return 'rgba(255, 0, 0, 0.1)';
        } else if (invoice.inserted_in_qb) {
            return 'rgba(0, 255, 0, 0.1)';
        } else {
            return 'rgba(255, 255, 0, 0.1)';
        }
    };

    // Función para renderizar el estado de sincronización
    const renderSyncStatus = (invoice) => {
        if (invoice.customer_unmatched || invoice.items_unmatched) {
            return <b>ERROR</b>;
        } else if (!invoice.inserted_in_qb && !invoice.customer_unmatched && !invoice.items_unmatched) {
            return 'Not Synced';
        } else {
            return <b>SUCCESS</b>;
        }
    };

    // Función para renderizar el checkbox de sincronización forzada
    const renderForceSyncCheckbox = (invoice, isSelected) => {
        if (!(invoice.inserted_in_qb && !invoice.customer_unmatched && !invoice.items_unmatched)) {
            return (
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSelected}
                                onChange={(e) => handleCheckboxClick(e, invoice.id)}
                            />
                        }
                        label="Force to sync?"
                    />
                </FormControl>
            );
        } else {
            return <b>Synced</b>;
        }
    };

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'yyyy-MM-dd');
    };

    return (
        <Container sx={{ marginLeft: '-3%', marginTop: '-5%'}}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
                <Grid item xs={6}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        textTransform: 'uppercase',
                        color: 'info.main',
                        fontWeight: 'bold',
                    }}
                >Invoices List</Typography>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={2}>
                    <Alert severity="info" sx={{ fontSize: 'small' }}>
                        <b>{data.invoices.length}</b> found
                    </Alert>
                </Grid>
                <Grid item xs={2}>
                    <Alert severity="warning" sx={{ fontSize: 'small' }}>
                        <b>{data.unprocessedNumber}</b> not processed
                    </Alert>
                </Grid>
                <Grid item xs={2}>
                    <Alert severity="success" sx={{ fontSize: 'small' }}>
                        <b>{data.matchedNumber}</b> matched
                    </Alert>
                </Grid>
                <Grid item xs={2}>
                    <Alert severity="error" sx={{ fontSize: 'small' }}>
                        <b>{data.unmatchedNumber}</b> unmatched
                    </Alert>
                </Grid>
                <Grid item xs={2}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={() => setSearchTerm('')} size="small">
                                    <ClearIcon />
                                </IconButton>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}> {/* Envuelve tu componente con LocalizationProvider y proporciona el DateAdapter */}
                        <DatePicker
                            label="Filter by date"
                            inputFormat="yyyy-MM-dd"
                            value={filterDate}
                            onChange={(date) => setFilterDate(date)}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                    {(filterDate || searchTerm) && (
                        <Button variant="outlined" color="primary" size="small" onClick={clearFilters} sx={{ mt: 1 }}>
                            Clear Filters
                        </Button>
                    )}
                </Grid>
                <Grid item xs={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleForceToSync}
                    >
                        Sync Selected
                    </Button>
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Nr.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Sync?</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Force Sync?</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.invoices
                            .filter(filterByDate) // Aplicar filtro por fecha
                            .filter(filterBySearchTerm) // Aplicar filtro por término de búsqueda
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((invoice, index) => {
                                const isItemSelected = isSelected(invoice.fields.id);
                                return (
                                    <TableRow key={index} style={{ backgroundColor: getBackgroundColor(invoice) }}>
                                        <TableCell>{invoice.fields.invoice_number}</TableCell>
                                        <TableCell>{invoice.fields.customer_name}</TableCell>
                                        {/* <TableCell>{formatDate(invoice.date)}</TableCell> */}
                                        <TableCell>{invoice.fields.date}</TableCell>
                                        <TableCell>{invoice.fields.total}</TableCell>
                                        <TableCell align="center">
                                            {renderSyncStatus(invoice)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {renderForceSyncCheckbox(invoice, isItemSelected)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button variant="contained" color="info" size="small">
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.invoices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Container>
    );
};

export default InvoicesList;
