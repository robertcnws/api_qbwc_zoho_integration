// src/components/ApplicationSettingsContainer.js

import React, { useState, useEffect } from 'react';
import ApplicationSettingsForm from '../ApplicationSettingsForm/ApplicationSettingsForm';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const ApplicationSettingsContainer = () => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        axios.get(`${apiUrl}/application_settings/`)
            .then(response => {
                setFormData(response.data);
            })
            .catch(error => {
                console.error('Error fetching application settings:', error);
                setError('Error fetching application settings.');
            });
    }, []);

    const handleSubmit = (data) => {
        axios.post('/api/application-settings/', data, { withCredentials: true })
            .then(response => {
                setSuccess(response.data.message);
                setError(null);
            })
            .catch(error => {
                console.error('Error updating application settings:', error);
                setError('Error updating application settings.');
                setSuccess(null);
            });
    };

    return (
        <ApplicationSettingsForm
            formData={formData}
            onSubmit={handleSubmit}
            error={error}
            success={success}
        />
    );
};

export default ApplicationSettingsContainer;
