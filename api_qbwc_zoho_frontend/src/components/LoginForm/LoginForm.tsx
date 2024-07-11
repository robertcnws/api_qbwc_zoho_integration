import React from 'react';

import styles from './LoginForm.css';

export interface LoginFormProps {
  prop?: string;
}

export function LoginForm({prop = 'default value'}: LoginFormProps) {
  return <div className={styles.LoginForm}>LoginForm {prop}</div>;
}
