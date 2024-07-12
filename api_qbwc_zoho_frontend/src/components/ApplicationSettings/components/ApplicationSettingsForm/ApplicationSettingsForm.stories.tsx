import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ApplicationSettings} from './ApplicationSettingsForm';

const meta: Meta<typeof ApplicationSettings> = {
  component: ApplicationSettings,
};

export default meta;

type Story = StoryObj<typeof ApplicationSettings>;

export const Basic: Story = {args: {}};
