import React from 'react';

import styles from './QbwcCustomersListPage.css';

export interface QbwcCustomersListPageProps {
  prop?: string;
}

export function QbwcCustomersListPage({prop = 'default value'}: QbwcCustomersListPageProps) {
  return <div className={styles.QbwcCustomersListPage}>QbwcCustomersListPage {prop}</div>;
}
