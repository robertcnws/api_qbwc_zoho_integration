import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ZohoLoading} from './ZohoLoading';

const meta: Meta<typeof ZohoLoading> = {
  component: ZohoLoading,
};

export default meta;

type Story = StoryObj<typeof ZohoLoading>;

export const Basic: Story = {args: {}};
