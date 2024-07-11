import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {LoginForm} from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Basic: Story = {args: {}};
