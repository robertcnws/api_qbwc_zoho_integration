import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../../../../utils'
import UsersForm from '../UsersForm/UsersForm';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const UsersFormContainer = () => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isNew, setIsNew] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const user = location.state.user;
        console.log(user);
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
            if(response.status === 200) {
                setError(null);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.data.message
                }).then(() => {
                    navigate('/integration/list_users');
                });
            }
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
