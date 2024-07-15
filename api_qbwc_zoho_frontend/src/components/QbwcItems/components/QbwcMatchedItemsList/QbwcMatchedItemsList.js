import React from 'react';

import styles from './QbwcMatchedItemsList.css';

export interface QbwcMatchedItemsListProps {
  prop?: string;
}

export function QbwcMatchedItemsList({prop = 'default value'}: QbwcMatchedItemsListProps) {
  return <div className={styles.QbwcMatchedItemsList}>QbwcMatchedItemsList {prop}</div>;
}
