import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {CustomersList} from './CustomersList';

const meta: Meta<typeof CustomersList> = {
  component: CustomersList,
};

export default meta;

type Story = StoryObj<typeof CustomersList>;

export const Basic: Story = {args: {}};
