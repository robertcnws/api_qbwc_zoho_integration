import React from 'react';

import styles from './QbwcSimilarItemsList.css';

export interface QbwcSimilarItemsListProps {
  prop?: string;
}

export function QbwcSimilarItemsList({prop = 'default value'}: QbwcSimilarItemsListProps) {
  return <div className={styles.QbwcSimilarItemsList}>QbwcSimilarItemsList {prop}</div>;
}
