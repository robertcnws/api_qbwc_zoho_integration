import React from 'react';

import styles from './CustomersListPage.css';

export interface CustomersListPageProps {
  prop?: string;
}

export function CustomersListPage({prop = 'default value'}: CustomersListPageProps) {
  return <div className={styles.CustomersListPage}>CustomersListPage {prop}</div>;
}
