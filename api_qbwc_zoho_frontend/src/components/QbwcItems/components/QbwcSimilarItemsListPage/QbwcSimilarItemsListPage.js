import React from 'react';

import styles from './QbwcSimilarItemsListPage.css';

export interface QbwcSimilarItemsListPageProps {
  prop?: string;
}

export function QbwcSimilarItemsListPage({prop = 'default value'}: QbwcSimilarItemsListPageProps) {
  return <div className={styles.QbwcSimilarItemsListPage}>QbwcSimilarItemsListPage {prop}</div>;
}
