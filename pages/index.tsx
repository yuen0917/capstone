import { Room } from 'livekit-server-sdk';
import type { GetServerSideProps } from 'next';
import { InferGetServerSidePropsType } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect, useState } from 'react';
import Typed from 'typed.js';
import { generateRoomId } from '../lib/client-utils';
import styles from '../styles/Home.module.css';

interface TabsProps {
  children: ReactElement[];
  selectedIndex?: number;
  onTabSelected?: (index: number) => void;
}

function Tabs(props: TabsProps) {
  const activeIndex = props.selectedIndex ?? 0;
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <>
        {activeIndex === index ? (
          <button
            className="tab tab-active tab-lifted"
            onClick={() => {
              if (props.onTabSelected) props.onTabSelected(index);
            }}
            aria-pressed={activeIndex === index}
          >
            {child?.props.label}
          </button>
        ) : (
          <button
            className="tab"
            onClick={() => {
              if (props.onTabSelected) props.onTabSelected(index);
            }}
            aria-pressed={activeIndex === index}
          >
            {child?.props.label}
          </button>
        )}
      </>
    );

  });
  return (
    <>
      <div className="tabs tabs-boxed">{tabs}</div>
      {props.children[activeIndex]}
    </>
  );
}

function DemoMeetingTab({ label }: { label: string }) {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };
  return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0 }} className=' text-center'>Start a new room</p>
      <button style={{ marginTop: '1rem' }} className="btn btn-primary  text-[#ffffff]" onClick={startMeeting}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-square-fill" viewBox="0 0 16 16">
          <path d="M0 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v12zm4.5-6.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5a.5.5 0 0 1 0-1z" />
        </svg>
        Start streaming
      </button>
    </div>
  );
}

function AnonymouslyTab({ label }: { label: string }) {
  return (
    <div className={styles.tabContent}>
      <p>You need to login in to start a streaming</p>
    </div>
  );
}

function CustomConnectionTab({ label }: { label: string }) {
  const router = useRouter();
  // const [inputString, setInputString] = useState('');
  const [rooms, setRooms] = useState([])
  const activeRooms = rooms.filter((room: Room) => room.numParticipants > 0)
  const getRooms = async () => {
    try {
      const resp = await fetch(`/api/room?user=${label}`)
      const data = await resp.json()
      setRooms(data.rooms)
      console.log("get")
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    getRooms()
  }, [])

  useEffect(() => {
    let id = setInterval(() => {
      getRooms();
    }, 3000);
    return () => clearInterval(id);
  }, [])

  // const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputString(event.target.value);
  // };
  const startMeeting = (name: string) => {
    router.push(`/rooms/${name}`);
  };
  if (activeRooms.length) return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0 }}>Enter the room number of you want to join</p>
      <div className='flex justify-left flex-wrap w-auto'>
        {
          activeRooms.map((room: Room, index) => (
            <button
              key={index}
              className="m-2 btn btn-outline btn-primary"
              onClick={() => startMeeting(room.name)}
            >
              {room.name}
            </button>
          ))
        }
      </div>
    </div>
  );

  return (
    <div className={styles.tabContent}>
      <p>No streaming room</p>
    </div>
  )
}


export const getServerSideProps: GetServerSideProps<{ tabIndex: number }> = async ({
  query,
  res,
}) => {
  res.setHeader('Cache-Control', 'public, max-age=7200');
  const tabIndex = query.tab === 'custom' ? 1 : 0;
  return { props: { tabIndex } };
};

const Login = ({ tabIndex }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [test, setTest] = useState(0);
  const { data, status } = useSession();
  const router = useRouter();
  const [inputString, setInputString] = useState('');
  const el = React.useRef(null);

  React.useEffect(() => {
    const typed = new Typed(el.current, {
      strings: ['PROJECT', 'TEAM', 'MEETING'],
      typeSpeed: 150,
      backSpeed: 150,
      loop: true,
    });

    return () => {
      // Destroy Typed instance during cleanup to stop animation
      typed.destroy();
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputString(event.target.value);
  };

  function onTabSelected(index: number) {
    const tab = test === 1 ? index === 1 ? 'custom' : 'anonymously' : index === 1 ? 'custom' : 'demo';
    // const tab = index === 1 ? 'custom' : 'demo';
    router.push({ query: { tab } });
  }

  if (status === "unauthenticated" && test === 0) return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div>
          <h1 className="App text-3xl font-black">
            OUR <span ref={el} className=' text-[#8692f9] text-center w-96' />
          </h1>
        </div>
        <div >
          <form onSubmit={(event) => { event.preventDefault(); if (inputString) setTest(1) }}>
            <input type="text" value={inputString} placeholder="Username" onChange={handleInputChange} className="input input-bordered input-primary max-w-xs w-72 mb-6" />
            <br />
            <button className="btn btn-primary w-72 text-[#ffffff]" type="submit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-door-open-fill" viewBox="0 0 16 16">
                <path d="M1.5 15a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H13V2.5A1.5 1.5 0 0 0 11.5 1H11V.5a.5.5 0 0 0-.57-.495l-7 1A.5.5 0 0 0 3 1.5V15H1.5zM11 2h.5a.5.5 0 0 1 .5.5V15h-1V2zm-2.5 8c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1z" />
              </svg>
              Login anonymously
            </button>
          </form>
        </div>
        <div className='flex flex-col w-full'>
          <div className="divider mt-0 mb-0 w-96">or login with</div>
        </div>
        <div>
          <br />
          <div className=' flex'>
            <button className="btn btn-primary w-16 text-[#ffffff] mr-10" onClick={() => signIn('google')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
              </svg>
            </button>
            <br />
            <br />
            <button className="btn btn-primary w-16 text-[#ffffff] " onClick={() => signIn('github')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-github" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </button>
            {/* <br />
            <br />
            <button className="btn btn-primary w-16 text-[#ffffff] " onClick={() => signIn('facebook')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-facebook" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
              </svg>
            </button> */}
          </div>
        </div>
      </main>
      <footer >
        Hosted on{' '}
        <a href="https://livekit.io/cloud?ref=meet">
          LiveKit Cloud
        </a>
        .  My teacher source code{' '}
        <a href="https://github.com/zyx1121/ntust.live">
          GitHub
        </a>
        .
      </footer>
    </>
  )
  if (status === 'loading')
    return (
      <main className={styles.main} data-lk-theme="default">
        <div>
          <h1 className="App text-3xl font-black">
            OUR <span ref={el} className=' text-[#8692f9] text-center w-96' />
          </h1>
        </div>
        <span className="loading loading-spinner text-primary"></span>
      </main>
    );
  if (status === 'authenticated' || test === 1) {
    return (
      <>
        <main className={styles.main} data-lk-theme="default">
          <div>
            <h1 className="App text-3xl font-black">
              OUR <span ref={el} className=' text-[#8692f9] text-center w-96' />
            </h1>
          </div>
          <div className=' flex'>
            <h1 className='text-xl mr-2 bg-primary rounded-lg border-y-8 border-x-[16px] border-[#8692f9]'>Welcome</h1>
            {test ? (
              <>
                <h1 className='text-xl border-4 border-y-8 border-transparent'>{inputString}</h1>
              </>
            ) : (
              <>
                <Image width="40" height="40" src={data?.user?.image!} alt={data?.user?.name!} />
                <h1 className=' ml-2 text-xl border-4 border-y-8 border-transparent'>{data?.user?.name}</h1>
              </>
            )}
          </div>
          {test ? (
            <>
              <Tabs selectedIndex={tabIndex} onTabSelected={onTabSelected}>
                <AnonymouslyTab label="Anonymously" />
                <CustomConnectionTab label="Join" />
              </Tabs>
            </>
          ) : (
            <>
              <Tabs selectedIndex={tabIndex} onTabSelected={onTabSelected}>
                <DemoMeetingTab label="Start" />
                <CustomConnectionTab label="Join" />
              </Tabs>
            </>
          )}

          <div className='flex flex-col w-full'>
            <div className="divider mt-0 mb-0 w-full"></div>
          </div>
          <button className="btn btn-primary w-72 text-[#ffffff]" onClick={() => signOut()}>sign out</button>
        </main>
        <footer >
          Hosted on{' '}
          <a href="https://livekit.io/cloud?ref=meet">
            LiveKit Cloud
          </a>
          .  My teacher source code{' '}
          <a href="https://github.com/zyx1121/ntust.live">
            GitHub
          </a>
          .
        </footer>
      </>
    );
  }


}

export default Login;