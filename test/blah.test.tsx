import React from 'react';
import { Default as VideoCall } from '../stories/VideoCall.stories';
import { render } from '@testing-library/react';

describe('VideoCall', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VideoCall />);
    const div = getByText('Hello')
    expect(div).toBeTruthy()
  });
});
