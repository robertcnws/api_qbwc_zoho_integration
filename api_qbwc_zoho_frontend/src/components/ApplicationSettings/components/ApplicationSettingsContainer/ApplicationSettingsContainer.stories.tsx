import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

import {ApplicationSettingsContainer} from './ApplicationSettingsContainer';

const meta: Meta<typeof ApplicationSettingsContainer> = {
  component: ApplicationSettingsContainer,
};

export default meta;

type Story = StoryObj<typeof ApplicationSettingsContainer>;

export const Basic: Story = {args: {}};
