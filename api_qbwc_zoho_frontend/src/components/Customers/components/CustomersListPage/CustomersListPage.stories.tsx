import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {CustomersListPage} from './CustomersListPage';

const meta: Meta<typeof CustomersListPage> = {
  component: CustomersListPage,
};

export default meta;

type Story = StoryObj<typeof CustomersListPage>;

export const Basic: Story = {args: {}};
