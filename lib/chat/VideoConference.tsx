import { isEqualTrackRef, isWeb, log } from '@livekit/components-core';
import { CarouselLayout, ConnectionStateToast, ControlBar, FocusLayout, FocusLayoutContainer, GridLayout, LayoutContextProvider, MessageDecoder, MessageEncoder, MessageFormatter, ParticipantTile, RoomAudioRenderer, useCreateLayoutContext, usePinnedTracks, useTracks } from '@livekit/components-react';
import type { Participant, TrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { Chat } from './Chat';



/**
 * @public
 */
export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
}

/**
 * The `VideoConference` ready-made component is your drop-in solution for a classic video conferencing application.
 * It provides functionality such as focusing on one participant, grid view with pagination to handle large numbers
 * of participants, basic non-persistent chat, screen sharing, and more.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 * You can use this components as a starting point for your own custom video conferencing application.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export function VideoConference({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  ...props
}: VideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const widgetUpdate = (state: WidgetState) => {
    log.debug('updating widget state', state);
    setWidgetState(state);
  };

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  React.useEffect(() => {
    // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] });
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid ===
          lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      log.debug('Auto clearing screen share focus.');
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
      lastAutoFocusedScreenShareTrack.current = null;
    }
  }, [
    screenShareTracks
      .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
  ]);

  return (
    <div className="lk-video-conference" {...props}>
      {isWeb() && (
        <LayoutContextProvider
          value={layoutContext}
          // onPinChange={handleFocusStateChange}
          onWidgetChange={widgetUpdate}
        >
          <div className="lk-video-conference-inner">
            {!focusTrack ? (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile />
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer>
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile />
                  </CarouselLayout>
                  {focusTrack && <FocusLayout trackRef={focusTrack} />}
                </FocusLayoutContainer>
              </div>
            )}
            <ControlBar controls={{ chat: true }} />
          </div>
          <Chat
            style={{ display: widgetState.showChat ? 'flex' : 'none' }}
            messageFormatter={chatMessageFormatter}
            messageEncoder={chatMessageEncoder}
            messageDecoder={chatMessageDecoder}
          />
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}

// ## PinState Type
export type PinState = TrackReferenceOrPlaceholder[];
export const PIN_DEFAULT_STATE: PinState = [];

// ## WidgetState Types
export type WidgetState = {
  showChat: boolean;
  unreadMessages: number;
};
export const WIDGET_DEFAULT_STATE: WidgetState = { showChat: false, unreadMessages: 0 };

// ## Track Source Types
export type TrackSourceWithOptions = { source: Track.Source; withPlaceholder: boolean };

export type SourcesArray = Track.Source[] | TrackSourceWithOptions[];

// ### Track Source Type Predicates
export function isSourceWitOptions(source: SourcesArray[number]): source is TrackSourceWithOptions {
  return typeof source === 'object';
}

export function isSourcesWithOptions(sources: SourcesArray): sources is TrackSourceWithOptions[] {
  return (
    Array.isArray(sources) &&
    (sources as TrackSourceWithOptions[]).filter(isSourceWitOptions).length > 0
  );
}

// ## Loop Filter Types
export type TrackReferenceFilter = Parameters<TrackReferenceOrPlaceholder[]['filter']>['0'];
export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];

// ## Other Types
export interface ParticipantClickEvent {
  participant: Participant;
  track?: TrackPublication;
}

export type TrackSource<T extends Track.Source> = RequireAtLeastOne<
  { source: T; name: string; participant: Participant },
  'name' | 'source'
>;

/**
 * The TrackIdentifier type is used to select Tracks either based on
 * - Track.Source and/or name of the track, e.g. `{source: Track.Source.Camera}` or `{name: "my-track"}`
 * - TrackReference (participant and publication)
 */
export type TrackIdentifier<T extends Track.Source = Track.Source> =
  | TrackSource<T>
  | TrackReference;

// ## Util Types
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type AudioSource = Track.Source.Microphone | Track.Source.ScreenShareAudio;
export type VideoSource = Track.Source.Camera | Track.Source.ScreenShare;

/**
 * The TrackReference type is a logical grouping of participant publication and/or subscribed track.
 *
 */

// ## TrackReference Types

export type TrackReferencePlaceholder = {
  participant: Participant;
  publication?: never;
  source: Track.Source;
};

export type TrackReference = {
  participant: Participant;
  publication: TrackPublication;
  source: Track.Source;
};

export type TrackReferenceOrPlaceholder = TrackReference | TrackReferencePlaceholder;

// ### TrackReference Type Predicates
export function isTrackReference(trackReference: unknown): trackReference is TrackReference {
  if (typeof trackReference === 'undefined') {
    return false;
  }
  return (
    isTrackReferenceSubscribed(trackReference as TrackReference) ||
    isTrackReferencePublished(trackReference as TrackReference)
  );
}

function isTrackReferenceSubscribed(trackReference?: TrackReferenceOrPlaceholder): boolean {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('track') &&
    typeof trackReference.publication?.track !== 'undefined'
  );
}

function isTrackReferencePublished(trackReference?: TrackReferenceOrPlaceholder): boolean {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('publication') &&
    typeof trackReference.publication !== 'undefined'
  );
}

export function isTrackReferencePlaceholder(
  trackReference?: TrackReferenceOrPlaceholder,
): trackReference is TrackReferencePlaceholder {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    typeof trackReference.publication === 'undefined'
  );
}
