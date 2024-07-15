import React from 'react';

import styles from './QbwcMatchedCustomersListPage.css';

export interface QbwcMatchedCustomersListPageProps {
  prop?: string;
}

export function QbwcMatchedCustomersListPage({prop = 'default value'}: QbwcMatchedCustomersListPageProps) {
  return <div className={styles.QbwcMatchedCustomersListPage}>QbwcMatchedCustomersListPage {prop}</div>;
}
