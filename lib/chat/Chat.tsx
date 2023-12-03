
import type { ChatMessage, MessageDecoder, MessageEncoder } from '@livekit/components-core';
import { ChatEntry, MessageFormatter, useChat, useMaybeLayoutContext } from '@livekit/components-react';
import React from 'react';


/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
    messageFormatter?: MessageFormatter;
    messageEncoder?: MessageEncoder;
    messageDecoder?: MessageDecoder;
}

/**
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function Chat({ messageFormatter, messageDecoder, messageEncoder, ...props }: ChatProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const ulRef = React.useRef<HTMLUListElement>(null);
    //my code begin
    // const [isModa10pen, setIsModalOpen] = useState(false);
    // const handleClick1 = () => {
    //     if (inputRef.current) {
    //         inputRef.current.value = "😀";
    //     }
    // };
    //my code end
    const chatOptions = React.useMemo(() => {
        return { messageDecoder, messageEncoder };
    }, [messageDecoder, messageEncoder]);



    const { send, chatMessages, isSending } = useChat(chatOptions);

    const layoutContext = useMaybeLayoutContext();
    const lastReadMsgAt = React.useRef<ChatMessage['timestamp']>(0);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (inputRef.current && inputRef.current.value.trim() !== '') {
            if (send) {
                await send(inputRef.current.value);
                inputRef.current.value = '';
                inputRef.current.focus();
            }
        }
    }

    React.useEffect(() => {
        if (ulRef) {
            ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
        }
    }, [ulRef, chatMessages]);

    React.useEffect(() => {
        if (!layoutContext || chatMessages.length === 0) {
            return;
        }

        if (
            layoutContext.widget.state?.showChat &&
            chatMessages.length > 0 &&
            lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
        ) {
            lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp;
            return;
        }

        const unreadMessageCount = chatMessages.filter(
            (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current,
        ).length;

        const { widget } = layoutContext;
        if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
            widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount });
        }
    }, [chatMessages, layoutContext?.widget]);

    return (
        <>
            <div {...props} className=" min-w-fit md:w-auto flex-col flex items-stretch bg-[var(--lk-bg2)] border-l">

                <ul className="lk-list lk-chat-messages " ref={ulRef}>
                    {props.children
                        ? chatMessages.map((msg, idx) =>
                            cloneSingleChild(props.children, {
                                entry: msg,
                                key: idx,
                                messageFormatter,
                            }),
                        )
                        : chatMessages.map((msg, idx, allMsg) => {
                            const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
                            // If the time delta between two messages is bigger than 60s show timestamp.
                            const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

                            return (
                                <ChatEntry
                                    key={idx}
                                    hideName={false}
                                    hideTimestamp={hideName === false ? false : hideTimestamp} // If we show the name always show the timestamp as well.
                                    entry={msg}
                                    messageFormatter={messageFormatter}
                                />
                            );
                        })}
                </ul>
                <form className="lk-chat-form" onSubmit={handleSubmit}>
                    <input
                        className=" input input-bordered input-primary w-full max-w-xs"
                        disabled={isSending}
                        ref={inputRef}
                        type="text"
                        placeholder="Enter a message..."
                    />

                    {/* <details className="dropdown dropdown-top">
                    <summary className="m-1 btn">open or close</summary>
                    <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
                        <li><a>Item 1</a></li>
                        <li><a>Item 2</a></li>
                    </ul>
                </details> */}
                    <button type="submit" className="btn btn-primary lk-chat-form-button" disabled={isSending}>
                        Send
                    </button>
                    <button className='btn btn-primary' onClick={() => (document.getElementById('my_modal_zzz') as HTMLDialogElement)?.showModal()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cake" viewBox="0 0 16 16">
                            <path d="m7.994.013-.595.79a.747.747 0 0 0 .101 1.01V4H5a2 2 0 0 0-2 2v3H2a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2h-1V6a2 2 0 0 0-2-2H8.5V1.806A.747.747 0 0 0 8.592.802l-.598-.79ZM4 6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v.414a.911.911 0 0 1-.646-.268 1.914 1.914 0 0 0-2.708 0 .914.914 0 0 1-1.292 0 1.914 1.914 0 0 0-2.708 0A.911.911 0 0 1 4 6.414V6Zm0 1.414c.49 0 .98-.187 1.354-.56a.914.914 0 0 1 1.292 0c.748.747 1.96.747 2.708 0a.914.914 0 0 1 1.292 0c.374.373.864.56 1.354.56V9H4V7.414ZM1 11a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.793l-.354.354a.914.914 0 0 1-1.293 0 1.914 1.914 0 0 0-2.707 0 .914.914 0 0 1-1.292 0 1.914 1.914 0 0 0-2.708 0 .914.914 0 0 1-1.292 0 1.914 1.914 0 0 0-2.708 0 .914.914 0 0 1-1.292 0L1 11.793V11Zm11.646 1.854a1.915 1.915 0 0 0 2.354.279V15H1v-1.867c.737.452 1.715.36 2.354-.28a.914.914 0 0 1 1.292 0c.748.748 1.96.748 2.708 0a.914.914 0 0 1 1.292 0c.748.748 1.96.748 2.707 0a.914.914 0 0 1 1.293 0Z" />
                        </svg>
                    </button>
                </form>
                <dialog id="my_modal_zzz" >
                    <div className="">
                        <p className="py-4">Select emoji</p>
                        <div>
                            <form method="dialog" className=' border-8'>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '😀';
                                    }
                                }}>😀</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '🥲';
                                    }
                                }}>🥲</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '😍';
                                    }
                                }}>😍</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '🔞';
                                    }
                                }}>🔞</button>
                                <br />
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '💯';
                                    }
                                }}>💯</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '🀄';
                                    }
                                }}>🀄</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '🚾';
                                    }
                                }}>🚾</button>
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '🏧';
                                    }
                                }}>🏧</button>
                                <br />
                                <button className='btn btn-primary' onClick={() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.value += '⛔';
                                    }
                                }}>⛔</button>
                                <br />
                                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
        </>
    );
}
export function cloneSingleChild(
    children: React.ReactNode | React.ReactNode[],
    props?: Record<string, any>,
    key?: any,
) {
    return React.Children.map(children, (child) => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (React.isValidElement(child) && React.Children.only(children)) {
            return React.cloneElement(child, { ...props, key });
        }
        return child;
    });
}