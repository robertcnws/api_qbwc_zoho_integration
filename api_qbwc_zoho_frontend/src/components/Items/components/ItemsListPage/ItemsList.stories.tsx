import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ItemsList} from './ItemsList';

const meta: Meta<typeof ItemsList> = {
  component: ItemsList,
};

export default meta;

type Story = StoryObj<typeof ItemsList>;

export const Basic: Story = {args: {}};
