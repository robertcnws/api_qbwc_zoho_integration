import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationHook = ({ notification }) => {
    // Mostrar el toast cuando llega una nueva notificación
    React.useEffect(() => {
        if (notification) {
            toast.info(`Tienes una nueva notificación: ${notification.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }, [notification]);

    return (
        <div>
            {/* Renderizar el contenedor de Toast */}
            <ToastContainer />
        </div>
    );
};

export default NotificationHook;