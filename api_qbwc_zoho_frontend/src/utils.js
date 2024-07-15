
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