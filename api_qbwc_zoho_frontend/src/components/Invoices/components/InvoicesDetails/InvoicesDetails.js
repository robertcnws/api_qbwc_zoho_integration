import React from 'react';

import styles from './InvoicesDetails.css';

export interface InvoicesDetailsProps {
  prop?: string;
}

export function InvoicesDetails({prop = 'default value'}: InvoicesDetailsProps) {
  return <div className={styles.InvoicesDetails}>InvoicesDetails {prop}</div>;
}
