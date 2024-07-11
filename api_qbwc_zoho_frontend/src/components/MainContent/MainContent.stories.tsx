import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {MainContent} from './MainContent';

const meta: Meta<typeof MainContent> = {
  component: MainContent,
};

export default meta;

type Story = StoryObj<typeof MainContent>;

export const Basic: Story = {args: {}};
