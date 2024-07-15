import React from 'react';

import styles from './QbwcMatchedCustomersList.css';

export interface QbwcMatchedCustomersListProps {
  prop?: string;
}

export function QbwcMatchedCustomersList({prop = 'default value'}: QbwcMatchedCustomersListProps) {
  return <div className={styles.QbwcMatchedCustomersList}>QbwcMatchedCustomersList {prop}</div>;
}
