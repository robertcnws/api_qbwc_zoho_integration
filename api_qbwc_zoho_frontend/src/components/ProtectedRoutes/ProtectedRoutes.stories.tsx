import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ProtectedRoutes} from './ProtectedRoutes';

const meta: Meta<typeof ProtectedRoutes> = {
  component: ProtectedRoutes,
};

export default meta;

type Story = StoryObj<typeof ProtectedRoutes>;

export const Basic: Story = {args: {}};
