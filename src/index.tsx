import React, {
  FC,
  HTMLAttributes,
  ReactChild,
  useEffect,
  useState,
} from 'react';
import { generateToken, Stream } from './lib/agora';

export interface Props extends HTMLAttributes<HTMLDivElement> {
  /** custom content, defaults to 'the snozzberries taste like snozzberries' */
  children?: ReactChild;
}

// Please do not use types off of a default export module or else Storybook Docs will suffer.
// see: https://github.com/storybookjs/storybook/issues/9556
/**
 * A custom Thing component. Neat!
 */
export const Thing: FC<Props> = ({ children }) => {
  return <div>{children || `the snozzberries taste like snozzberries`}</div>;
};

export interface VideoCallProps {
  appId: string;
  appCertificate: string;
  userId: number;
  channelId: string;
}

export const VideoCall: FC<VideoCallProps> = ({
  appId,
  appCertificate,
  userId,
  channelId,
}) => {
  const [stream, setStream] = useState<Stream>();

  useEffect(() => {
    const newStream = new Stream(
      appId,
      channelId,
      userId,
      generateToken(appId, appCertificate, channelId, userId)!
    );
    setStream(newStream);
  }, [appId, userId, channelId]);

  if (stream) {
    return (
      <div>
        <h1>Hello</h1>
        <button onClick={() => stream.join()}>Join</button>
        <button onClick={() => stream.leave()}>Leave</button>
      </div>
    );
  } else {
    return null;
  }
};
