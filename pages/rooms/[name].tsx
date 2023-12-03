'use client';
import {
  LiveKitRoom,
  LocalUserChoices,
  formatChatMessageLinks
} from '@livekit/components-react';
import {
  LogLevel
} from 'livekit-client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DebugMode } from '../../lib/Debug';
import { VideoConference } from '../../lib/chat/VideoConference';

// const PreJoinNoSSR = dynamic(
//   async () => {
//     return (await import('@livekit/components-react')).PreJoin;
//   },
//   { ssr: false },
// );

// const Home: NextPage = () => {
//   const router = useRouter();
//   const { name: roomName } = router.query;
//   const e2eePassphrase =
//     typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));

//   const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);

//   function handlePreJoinSubmit(values: LocalUserChoices) {
//     if (values.e2ee) {
//       location.hash = encodePassphrase(values.sharedPassphrase);
//     }
//     setPreJoinChoices(values);
//   }
//   return (
//     <>
//       <Head>
//         <title>LiveKit Meet</title>
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <main data-lk-theme="default">
//         {roomName && !Array.isArray(roomName) && preJoinChoices ? (
//           <ActiveRoom
//             roomName={roomName}
//             userChoices={preJoinChoices}
//             onLeave={() => {
//               router.push('/');
//             }}
//           ></ActiveRoom>
//         ) : (
//           <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
//             <PreJoinNoSSR
//               onError={(err) => console.log('error while setting up prejoin', err)}
//               defaults={{
//                 username: '',
//                 videoEnabled: true,
//                 audioEnabled: true,
//                 e2ee: !!e2eePassphrase,
//                 sharedPassphrase: e2eePassphrase || randomString(64),
//               }}
//               onSubmit={handlePreJoinSubmit}
//               showE2EEOptions={true}
//             ></PreJoinNoSSR>
//           </div>
//         )}
//       </main>
//     </>
//   );
// };


type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  region?: string;
};

const Home = ({ userChoices}: ActiveRoomProps) => {
  const router = useRouter();
  const session = useSession();
  const { name: roomName } = router.query;

  const room = roomName;
  const name = session.data?.user?.name;
  const [token, setToken] = useState('');


  useEffect(() => {
    (async () => {
      const resp = await fetch(`/api/get_lk_token?room=${room}&username=${name}`);
      const data = await resp.json();
      setToken(data.token);
    })();
  }, []);

  if (token === '') {
    return <div>Getting token...</div>;
  }
  const onLeave = () => {
    router.push('/');
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={true}
      onDisconnected={onLeave}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <VideoConference chatMessageFormatter={formatChatMessageLinks} />
      <DebugMode logLevel={LogLevel.info} />
    </LiveKitRoom>
  );
};

export default Home;