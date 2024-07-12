import React from 'react';

import styles from './CustomersList.css';

export interface CustomersListProps {
  prop?: string;
}

export function CustomersList({prop = 'default value'}: CustomersListProps) {
  return <div className={styles.CustomersList}>CustomersList {prop}</div>;
}
