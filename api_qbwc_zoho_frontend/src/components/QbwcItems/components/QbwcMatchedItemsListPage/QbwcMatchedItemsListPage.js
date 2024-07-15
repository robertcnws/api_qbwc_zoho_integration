import React from 'react';

import styles from './QbwcMatchedItemsListPage.css';

export interface QbwcMatchedItemsListPageProps {
  prop?: string;
}

export function QbwcMatchedItemsListPage({prop = 'default value'}: QbwcMatchedItemsListPageProps) {
  return <div className={styles.QbwcMatchedItemsListPage}>QbwcMatchedItemsListPage {prop}</div>;
}
