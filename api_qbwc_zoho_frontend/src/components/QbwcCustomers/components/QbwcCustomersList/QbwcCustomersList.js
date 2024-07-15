import React from 'react';

import styles from './QbwcCustomersList.css';

export interface QbwcCustomersListProps {
  prop?: string;
}

export function QbwcCustomersList({prop = 'default value'}: QbwcCustomersListProps) {
  return <div className={styles.QbwcCustomersList}>QbwcCustomersList {prop}</div>;
}
