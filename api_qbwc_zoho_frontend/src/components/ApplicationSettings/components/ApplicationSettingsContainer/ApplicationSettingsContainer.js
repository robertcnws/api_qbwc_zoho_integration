import React, { useState, useEffect } from 'react';
import ApplicationSettingsForm from '../ApplicationSettingsForm/ApplicationSettingsForm';
import { fetchWithToken } from '../../../../utils'

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const ApplicationSettingsContainer = () => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithToken(`${apiUrl}/application_settings/`, 'GET', null, {}, apiUrl);
                setFormData(response.data);
            } catch (error) {
                console.error('Error fetching application settings:', error);
                setError('Error fetching application settings.');
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (data) => {
        try {
            data = JSON.stringify(data)
            const response = await fetchWithToken(`${apiUrl}/application_settings/`, 'POST', data, {}, apiUrl);
            setSuccess(response.data.message);
            setError(null);
        } catch (error) {
            console.error('Error updating application settings:', error);
            setError(`Error updating application settings: ${error}`);
            setSuccess(null);
        }
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
