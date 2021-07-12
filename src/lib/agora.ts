import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const REMOTE_USER_OFFSET = 10000;

const ACTIVE_STREAM_CLASSNAME = 'agora-active-stream';

class Stream {
  selfMuted: boolean;
  joined: boolean;
  client: IAgoraRTCClient;
  screenClient: IAgoraRTCClient;
  appId: string;
  appCertificate: string;
  channelId: string;
  token: string;
  userId: number;
  localAudioTrack: IMicrophoneAudioTrack | null = null;
  localVideoTrack: ILocalVideoTrack | null = null;
  // screenVideoTrack: ILocalVideoTrack | null = null;
  // screenAudioTrack: ILocalAudioTrack | null = null;
  localScreenTrack:
    | ILocalVideoTrack
    | [ILocalVideoTrack, ILocalAudioTrack]
    | null = null;
  activeStreamId: string | null = null;

  constructor(
    appId: string,
    appCertificate: string,
    channelId: string,
    userId: number,
    token: string
  ) {
    this.selfMuted = false;
    this.joined = false;
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.channelId = channelId;
    this.userId = userId;
    this.token = token;
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.client.on('user-published', this.onUserPublished);
    this.client.on('user-unpublished', this.onUserUnpublished);
  }

  join = async () => {
    this.joined = true;
    await this.client.join(this.appId, this.channelId, this.token, this.userId);
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
    console.log('Logging client after publishing', this.client);
    const localPlayerContainer = document.createElement('div');
    localPlayerContainer.id = this.userId.toString();
    // localPlayerContainer.textContent = 'Local user ' + this.userId;
    localPlayerContainer.style.width = '20vw';
    localPlayerContainer.style.height = '11.25vw';
    localPlayerContainer.addEventListener('click', () => {
      this.changeActiveStream(localPlayerContainer.id);
    });
    document
      .getElementsByClassName('agora-streams')[0]
      .append(localPlayerContainer);
    this.localVideoTrack.play(localPlayerContainer);
  };

  leave = async () => {
    this.joined = false;
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
  };

  onUserPublished = async (
    user: IAgoraRTCRemoteUser,
    mediaType: 'video' | 'audio'
  ) => {
    await this.client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      const remoteVideoTrack = user.videoTrack;
      const remotePlayerContainer = document.createElement('div');
      remotePlayerContainer.id = user.uid.toString();
      remotePlayerContainer.addEventListener('click', () => {
        this.changeActiveStream(remotePlayerContainer.id);
      });
      // remotePlayerContainer.textContent = 'Remote user ' + user.uid.toString();
      remotePlayerContainer.style.width = '20vw';
      remotePlayerContainer.style.height = '11.25vw';
      document
        .getElementsByClassName('agora-streams')[0]
        .append(remotePlayerContainer);
      remoteVideoTrack!.play(remotePlayerContainer);
    }

    if (mediaType === 'audio') {
      const remoteAudioTrack = user.audioTrack;
      remoteAudioTrack!.play();
    }
  };

  startScreenShare = async () => {
    const newUserId = +this.userId + REMOTE_USER_OFFSET;
    const screenToken = generateToken(
      this.appId,
      this.appCertificate,
      this.channelId,
      newUserId
    );
    await this.screenClient.join(
      this.appId,
      this.channelId,
      screenToken,
      newUserId
    );
    const screenTrack = await AgoraRTC.createScreenVideoTrack(
      {
        encoderConfig: '1080p_1',
      },
      'auto'
    );
    this.localScreenTrack = screenTrack;
    // this.screenVideoTrack = screenTrack[0];
    // this.screenAudioTrack = screenTrack[1];

    await this.screenClient.publish(screenTrack);
    // const localPlayerContainer = document.createElement('div');
    // localPlayerContainer.id = this.userId.toString();
    // localPlayerContainer.textContent = 'Local screen ' + this.userId + REMOTE_USER_OFFSET;
    // localPlayerContainer.style.width = '20vw';
    // localPlayerContainer.style.height = '11.25vw';
    // screenTrack[0].play(localPlayerContainer);
    // screenTrack[1].play();
    return screenTrack;
  };

  stopScreenShare = async () => {
    await this.screenClient.unpublish(this.localScreenTrack!);
    if (Array.isArray(this.localScreenTrack)) {
      this.localScreenTrack[0]?.close();
    } else {
      this.localScreenTrack?.close();
    }
    const screenElement = document.getElementById(
      (this.userId + REMOTE_USER_OFFSET).toString()
    );
    screenElement && screenElement?.remove();
    await this.screenClient.leave();

    // this.screenAudioTrack?.close();
    // this.screenVideoTrack?.close();
  };

  onUserUnpublished = (user: IAgoraRTCRemoteUser) => {
    const remotePlayerContainer = document.getElementById(user.uid.toString());
    remotePlayerContainer && remotePlayerContainer.remove();
  };

  toggleMuteSelf = () => {
    this.localAudioTrack?.setVolume(this.selfMuted ? 100 : 0);
    this.selfMuted = !this.selfMuted;
  };

  changeActiveStream = (id: string) => {
    const currentActiveStream = document.getElementsByClassName(
      ACTIVE_STREAM_CLASSNAME
    )[0];
    currentActiveStream?.classList.remove(ACTIVE_STREAM_CLASSNAME);

    if (this.activeStreamId !== id) {
      const newActiveStream = document.getElementById(id);
      newActiveStream?.classList.add(ACTIVE_STREAM_CLASSNAME);
      this.activeStreamId = id;
    } else {
      this.activeStreamId = null;
    }
  };
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
