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

  const handleLeave = async () => {
    setClicked(true);
    await stream!.leave();
    setClicked(false);
  };

  const handleJoin = async () => {
    setClicked(true);
    await stream!.join();
    setClicked(false);
  };

  const handleSelfMute = () => {
    setClicked(true);
    stream!.toggleMuteSelf();
  };

  useEffect(() => {
    setClicked(false);
  }, [stream?.selfMuted]);

  if (!appId || !appCertificate || !channelId || !userId) {
    return (
      <div>
        Incorrect config. Please verify that you provided all of these: appId,
        appCertificate, channelId, userId.
      </div>
    );
  }

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
        {stream.joined && (
          <button
            disabled={clicked}
            onClick={handleSelfMute}
            className="button mute-btn"
          >
            {stream.selfMuted ? 'Unmute' : 'Mute'}
          </button>
        )}
      </div>
    );
  } else {
    return null;
  }
};
