import React from 'react';

import styles from './QbwcSimilarCustomersListPage.css';

export interface QbwcSimilarCustomersListPageProps {
  prop?: string;
}

export function QbwcSimilarCustomersListPage({prop = 'default value'}: QbwcSimilarCustomersListPageProps) {
  return <div className={styles.QbwcSimilarCustomersListPage}>QbwcSimilarCustomersListPage {prop}</div>;
}
