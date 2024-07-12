// src/components/ApplicationSettingsForm.js

import React, { useState } from 'react';
import { Button, TextField, IconButton, Box, Container, Typography, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './ApplicationSettingsForm.css';

const ApplicationSettingsForm = ({ formData, onSubmit, error, success }) => {
    const [data, setData] = useState(formData);
    const [showZohoSecret, setShowZohoSecret] = useState(false);
    const [showQBPassword, setShowQBPassword] = useState(false);

    const handleChange = (event) => {
        setData({ ...data, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(data);
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
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Zoho Client Secret"
                    name="zoho_client_secret"
                    type={showZohoSecret ? 'text' : 'password'}
                    value={data.zoho_client_secret || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
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
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Zoho Redirect URI"
                    name="zoho_redirect_uri"
                    value={data.zoho_redirect_uri || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <Box sx={{ mb: 3, mt: 3 }}>
                    <Typography variant="h6" className="separator">QBWC Section</Typography>
                </Box>
                <TextField
                    label="QB Username"
                    name="qb_username"
                    value={data.qb_username || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="QB Password"
                    name="qb_password"
                    type={showQBPassword ? 'text' : 'password'}
                    value={data.qb_password || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
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
