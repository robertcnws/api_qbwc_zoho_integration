import React from 'react';

import styles from './QbwcSimilarCustomersList.css';

export interface QbwcSimilarCustomersListProps {
  prop?: string;
}

export function QbwcSimilarCustomersList({prop = 'default value'}: QbwcSimilarCustomersListProps) {
  return <div className={styles.QbwcSimilarCustomersList}>QbwcSimilarCustomersList {prop}</div>;
}
