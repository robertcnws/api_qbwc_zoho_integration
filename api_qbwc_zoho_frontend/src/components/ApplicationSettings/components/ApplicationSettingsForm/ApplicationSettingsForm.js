import React, { useState, useEffect } from 'react';
import { Grid, Button, TextField, IconButton, Box, Container, Typography, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './ApplicationSettingsForm.css';
import { Link } from 'react-router-dom';

const ApplicationSettingsForm = ({ formData, onSubmit, error, success }) => {
    const [data, setData] = useState(formData);
    const [showZohoSecret, setShowZohoSecret] = useState(false);
    const [showQBPassword, setShowQBPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [formChanged, setFormChanged] = useState(false); // Estado para verificar cambios en el formulario

    useEffect(() => {
        setData(formData);
    }, [formData]);

    useEffect(() => {
        // Verificar si hay cambios comparando con formData
        const isFormChanged =
            data.zoho_client_id !== formData.zoho_client_id ||
            data.zoho_client_secret !== formData.zoho_client_secret ||
            data.zoho_org_id !== formData.zoho_org_id ||
            data.zoho_redirect_uri !== formData.zoho_redirect_uri ||
            data.qb_username !== formData.qb_username ||
            data.qb_password !== formData.qb_password;

        setFormChanged(isFormChanged);
    }, [data, formData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData({ ...data, [name]: value });
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: value ? '' : prevErrors[name],
        }));
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        const newErrors = { ...errors };
        if (!value) {
            newErrors[name] = `${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
        } else {
            newErrors[name] = '';
        }
        setErrors(newErrors);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!data.zoho_client_id) newErrors.zoho_client_id = 'Zoho Client ID is required';
        if (!data.zoho_client_secret) newErrors.zoho_client_secret = 'Zoho Client Secret is required';
        if (!data.zoho_org_id) newErrors.zoho_org_id = 'Zoho Organization ID is required';
        if (!data.zoho_redirect_uri) newErrors.zoho_redirect_uri = 'Zoho Redirect URI is required';
        if (!data.qb_username) newErrors.qb_username = 'QB Username is required';
        if (!data.qb_password) newErrors.qb_password = 'QB Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            onSubmit(data);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5, p: 3, bgcolor: 'white', boxShadow: 3 }}>
            <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    color: '#2196F3',
                    fontWeight: 'bold',
                }}
            >
                Application Settings
            </Typography>
            {success && <Alert severity="success">{success}<br/></Alert>}
            {error && <Alert severity="error">{error}<br/></Alert>}
            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3, bgcolor: '#E3F2FD'}}>
                    <Typography variant="h6" className="separator">Zoho Section</Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Zoho Client ID"
                            name="zoho_client_id"
                            value={data.zoho_client_id || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.zoho_client_id}
                            helperText={errors.zoho_client_id}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Zoho Client Secret"
                            name="zoho_client_secret"
                            type={showZohoSecret ? 'text' : 'password'}
                            value={data.zoho_client_secret || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.zoho_client_secret}
                            helperText={errors.zoho_client_secret}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={() => setShowZohoSecret(!showZohoSecret)}
                                        edge="end"
                                    >
                                        {showZohoSecret ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Zoho Organization ID"
                            name="zoho_org_id"
                            value={data.zoho_org_id || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.zoho_org_id}
                            helperText={errors.zoho_org_id}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Zoho Redirect URI"
                            name="zoho_redirect_uri"
                            value={data.zoho_redirect_uri || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.zoho_redirect_uri}
                            helperText={errors.zoho_redirect_uri}
                        />
                    </Grid>
                </Grid>
                <Box sx={{ mb: 3, mt: 3, bgcolor: '#E3F2FD' }}>
                    <Typography variant="h6" className="separator">QBWC Section</Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="QB Username"
                            name="qb_username"
                            value={data.qb_username || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.qb_username}
                            helperText={errors.qb_username}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="QB Password"
                            name="qb_password"
                            type={showQBPassword ? 'text' : 'password'}
                            value={data.qb_password || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.qb_password}
                            helperText={errors.qb_password}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={() => setShowQBPassword(!showQBPassword)}
                                        edge="end"
                                    >
                                        {showQBPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
                <Typography
                    sx={{
                        borderBottom: '2px solid #2196F3',
                        paddingBottom: '8px',
                        marginBottom: '20px',
                        color: '#2196F3',
                        fontWeight: 'bold',
                    }}
                ></Typography>
                <Box sx={{ mt: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!formChanged} // Deshabilitar si no hay cambios
                        sx={{ mr: 2 }}
                        size='small'
                    >
                        Update
                    </Button>
                    <Button
                        variant="contained"
                        component={Link}
                        color="warning"
                        to="/integration"
                        size='small'
                    >
                        Cancel
                    </Button>
                </Box>
            </form>
        </Container>
    );
};

export default ApplicationSettingsForm;
