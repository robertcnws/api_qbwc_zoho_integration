// src/components/ApplicationSettingsContainer.js

import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../../../../utils'
import UsersForm from '../UsersForm/UsersForm';
import { useLocation } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const UsersFormContainer = () => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isNew, setIsNew] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const user = location.state.user;
        if (user) {
            setFormData(user);
            setIsNew(false);
        }
    }, []);

    const handleSubmit = async (data) => {
        try {
            data = { ...data, logged_username: localStorage.getItem('username') };
            data = JSON.stringify(data)
            const response = await fetchWithToken(`${apiUrl}/manage_user/`, 'POST', data, {}, apiUrl);
            setSuccess(response.data.message);
            setError(null);
        } catch (error) {
            console.error('Error updating user:', error);
            setError(`Error updating user: ${error}`);
            setSuccess(null);
        }
    };

    return (
        <UsersForm
            formData={formData}
            onSubmit={handleSubmit}
            error={error}
            success={success}
            isNew={isNew}
        />
    );
};

export default UsersFormContainer;
