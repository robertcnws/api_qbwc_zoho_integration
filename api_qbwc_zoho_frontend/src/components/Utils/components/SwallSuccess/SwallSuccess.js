import React, { useEffect } from 'react';

import Swal from 'sweetalert2';

import { useNavigate } from 'react-router-dom';


const SwallSuccess = ({ message, navigateUrl }) => {

    const navigate = useNavigate()

    useEffect(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            willClose: () => {
                navigate(navigateUrl);
            }
        });
    }, [message, navigate, navigateUrl]);

    return null;
}

export default SwallSuccess;
