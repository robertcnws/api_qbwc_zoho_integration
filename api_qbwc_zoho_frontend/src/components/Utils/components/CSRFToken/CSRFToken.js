import React, { useState, useEffect} from 'react'
import axios from 'axios'

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const CSRFToken = () => {
    const [csrftoken, setcsrftoken] = useState('');

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            let cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();

                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                await axios.get(`${apiUrl}/get_csrf_token/`)
                setcsrftoken(getCookie('csrftoken'));
            } catch (err) {
                console.log("error");
            }
        }
        fetchData();
        
    }, []);
    
  return (
    <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
  );
}

export default CSRFToken