import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ItemsDetails} from './ItemsDetails';

const meta: Meta<typeof ItemsDetails> = {
  component: ItemsDetails,
};

export default meta;

type Story = StoryObj<typeof ItemsDetails>;

export const Basic: Story = {args: {}};
