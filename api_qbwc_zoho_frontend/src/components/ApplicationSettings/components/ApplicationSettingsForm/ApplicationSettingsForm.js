import React, { useState, useEffect } from 'react';
import { Button, TextField, IconButton, Box, Container, Typography, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './ApplicationSettingsForm.css';

const ApplicationSettingsForm = ({ formData, onSubmit, error, success }) => {
    const [data, setData] = useState(formData);
    const [showZohoSecret, setShowZohoSecret] = useState(false);
    const [showQBPassword, setShowQBPassword] = useState(false);
    const [errors, setErrors] = useState({});

    // Actualiza `data` cuando `formData` cambie
    useEffect(() => {
        setData(formData);
    }, [formData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData({ ...data, [name]: value });
        // Clear the specific field error when user inputs data
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: value ? '' : prevErrors[name], // Clear error if the field has a value
        }));
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        // Validar el campo cuando el usuario sale de él
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
            <Typography variant="h4" align="center" gutterBottom>
                Application Settings
            </Typography>
            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" className="separator">Zoho Section</Typography>
                </Box>
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
                <Box sx={{ mb: 3, mt: 3 }}>
                    <Typography variant="h6" className="separator">QBWC Section</Typography>
                </Box>
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
                <Box sx={{ mt: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ mr: 2 }}
                        size='small'
                    >
                        Update
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        href="/integration"
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
