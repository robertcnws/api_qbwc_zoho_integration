import axios from 'axios';


const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;


export const clearLocalStorage = () => {
  localStorage.removeItem('invoicesListPage');
  localStorage.removeItem('invoicesListRowsPerPage');
  localStorage.removeItem('invoicesListFilterDate');
};

export const getCsrfToken = async () => {
  try {
      const response = await axios.get(`${apiUrl}/get_csrf_token/`, { withCredentials: true });
      return response.data.csrftoken;
  } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw new Error('Failed to get CSRF token');
  }
};

export const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          let cookie = cookies[i].trim();
          if (cookie.indexOf(name + '=') === 0) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

export const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

export const getComparator = (order, orderBy) => {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

export function getComparatorUndefined(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparatorUndefined(a, b, orderBy)
      : (a, b) => -descendingComparatorUndefined(a, b, orderBy);
  }

export const descendingComparator = (a, b, orderBy) => {
    if (b.fields[orderBy] < a.fields[orderBy]) {
        return -1;
    }
    if (b.fields[orderBy] > a.fields[orderBy]) {
        return 1;
    }
    return 0;
}

function descendingComparatorUndefined(a, b, orderBy) {
  if (!a || !b || !a[orderBy] || !b[orderBy]) {
    return 0;
  }
  
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

// JWT TOKENS

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const refreshToken = async (apiUrl) => {
  const refreshToken = getRefreshToken();
  try {
      const response = await axios.post(`${apiUrl}/api/token/refresh/`, {
          refresh: refreshToken
      });
      const { access } = response.data;
      setTokens(access, refreshToken);
      return access;
  } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
  }
};

export const fetchWithToken = async (url, method = 'GET', data = null, headers = {}, apiUrl) => {
  let accessToken = getAccessToken();
  
  const makeRequest = async (token) => {
      const config = {
          method: method,
          url: url,
          withCredentials: true,
          headers: {
              ...headers,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          ...(method === 'GET' ? { params: data } : { data: data })
      };
      return axios(config);
  };

  try {
      return await makeRequest(accessToken);
  } catch (error) {
      if (error.response && error.response.status === 401) {
          const newAccessToken = await refreshToken(apiUrl);
          if (newAccessToken) {

              return await makeRequest(newAccessToken);
          }
      }
      throw error;
  }
};
