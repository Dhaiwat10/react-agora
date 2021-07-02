import React, { FC, useEffect, useState } from 'react';
import { generateToken, Stream } from './lib/agora';
import './index.css';

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
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const newStream = new Stream(
      appId,
      channelId,
      userId,
      generateToken(appId, appCertificate, channelId, userId)!
    );
    setStream(newStream);
  }, [appId, userId, channelId]);

  useEffect(() => {
    setClicked(false);
  }, [stream?.joined]);

  const handleLeave = () => {
    setClicked(true);
    stream!.leave();
  };

  const handleJoin = () => {
    setClicked(true);
    stream!.join();
  };

  if (stream) {
    return (
      <div className="agora-container">
        <div
          className="agora-streams"
          style={{ marginBottom: stream?.joined ? '50px' : '0' }}
        ></div>
        {stream.joined ? (
          <button
            disabled={clicked}
            className="button leave-btn"
            onClick={handleLeave}
          >
            Leave
          </button>
        ) : (
          <button
            disabled={clicked}
            className="button join-btn"
            onClick={handleJoin}
          >
            Join
          </button>
        )}
      </div>
    );
  } else {
    return null;
  }
};
