
const apiUrl = process.env.REACT_APP_BACKEND_URL
export const getCsrfToken = async () => {
    const response = await fetch(`${apiUrl}/get_csrf_token/`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    const data = await response.json();
    return data.csrfToken;
  };