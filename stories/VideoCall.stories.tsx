import React from 'react';
import { Meta, Story } from '@storybook/react';
import { VideoCall, VideoCallProps } from '../src';

const meta: Meta = {
  title: 'VideoCall',
  component: VideoCall,
  argTypes: {
    appId: {
      control: {
        type: 'text',
      },
    },
    appCertificate: {
      control: {
        type: 'text',
      },
    },
    channelId: {
      control: {
        type: 'text',
      },
    },
    userId: {
      control: {
        type: 'number',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<VideoCallProps> = (args) => <VideoCall {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {
  appId: '',
  appCertificate: '',
  channelId: '',
  userId: 1
};
