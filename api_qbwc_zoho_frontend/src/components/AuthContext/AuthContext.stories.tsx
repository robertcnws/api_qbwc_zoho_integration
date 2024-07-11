import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {AuthContext} from './AuthContext';

const meta: Meta<typeof AuthContext> = {
  component: AuthContext,
};

export default meta;

type Story = StoryObj<typeof AuthContext>;

export const Basic: Story = {args: {}};
