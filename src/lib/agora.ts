import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

class Stream {
  client: IAgoraRTCClient;
  appId: string;
  channelId: string;
  token: string;
  userId: number;
  localAudioTrack: IMicrophoneAudioTrack | null = null;
  localVideoTrack: ILocalVideoTrack | null = null;

  constructor(appId: string, channelId: string, userId: number, token: string) {
    this.appId = appId;
    this.channelId = channelId;
    this.userId = userId;
    this.token = token;
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.client.on('user-published', this.onUserPublished);
  }

  async join() {
    await this.client.join(this.appId, this.channelId, this.token, this.userId);
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
    // TODO: Create video container on the DOM
    const localPlayerContainer = document.createElement('div');
    localPlayerContainer.id = this.userId.toString();
    localPlayerContainer.textContent = 'Local user ' + this.userId;
    localPlayerContainer.style.width = '640px';
    localPlayerContainer.style.height = '480px';
    document.body.append(localPlayerContainer);
    this.localVideoTrack.play(localPlayerContainer);
  }

  async leave() {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    // TODO: Destroy local stream container
    const localPlayerContainer = document.getElementById(
      this.userId.toString()
    );
    localPlayerContainer && localPlayerContainer.remove();
    // TODO: Destroy all remote streams
    this.client.remoteUsers.forEach((user) => {
      // Destroy the dynamically created DIV containers.
      const playerContainer = document.getElementById(user.uid.toString());
      playerContainer && playerContainer.remove();
    });
    await this.client.leave();
  }

  async onUserPublished(
    user: IAgoraRTCRemoteUser,
    mediaType: 'video' | 'audio'
  ) {
    await this.client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      const remoteVideoTrack = user.videoTrack;
      const remotePlayerContainer = document.createElement('div');
      remotePlayerContainer.id = user.uid.toString();
      remotePlayerContainer.textContent = 'Remote user ' + user.uid.toString();
      remotePlayerContainer.style.width = '640px';
      remotePlayerContainer.style.height = '480px';
      document.body.append(remotePlayerContainer);
      remoteVideoTrack!.play(remotePlayerContainer);
    }

    if (mediaType === 'audio') {
      const remoteAudioTrack = user.audioTrack;
      remoteAudioTrack!.play();
    }
  }

  async onUserUnpublished(user: IAgoraRTCRemoteUser) {
    const remotePlayerContainer = document.getElementById(user.uid.toString());
    remotePlayerContainer!.remove();
  }
}

const generateToken = (
  appId: string,
  appCertificate: string,
  roomId: string,
  userId: number
) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimeInSeconds = 3600;
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      roomId,
      userId,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { Stream, generateToken };
