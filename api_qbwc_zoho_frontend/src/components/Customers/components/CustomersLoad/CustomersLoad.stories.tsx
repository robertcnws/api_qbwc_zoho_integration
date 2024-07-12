import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {CustomersLoad} from './CustomersLoad';

const meta: Meta<typeof CustomersLoad> = {
  component: CustomersLoad,
};

export default meta;

type Story = StoryObj<typeof CustomersLoad>;

export const Basic: Story = {args: {}};
