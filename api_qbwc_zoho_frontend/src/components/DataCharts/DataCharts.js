import React from 'react';

import styles from './DataCharts.css';

export interface DataChartsProps {
  prop?: string;
}

export function DataCharts({prop = 'default value'}: DataChartsProps) {
  return <div className={styles.DataCharts}>DataCharts {prop}</div>;
}
