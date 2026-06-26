import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  url: string;
  thumbnail: string;
  category: string;
  sub_type: string;
  description: string;
}

interface PlaybackContextType {
  player: any;
  status: any;
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  activeTrackIndex: number;
  setActiveTrackIndex: (index: number) => void;
  activeTrack: Track | undefined;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  playerVolume: number;
  setPlayerVolume: (vol: number) => void;
  playTrack: (track: any) => void;
  togglePlay: () => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playerVolume, setPlayerVolume] = useState<number>(1.0);
  
  const activeTrack = tracks[activeTrackIndex];

  // Initialize Audio Player with bell_sound as placeholder
  const player = useAudioPlayer(require('../assets/Sound/bell_sound.mp3'));
  const status = useAudioPlayerStatus(player);

  const isInitialMount = useRef(true);

  // Sync track playback source swap
  useEffect(() => {
    if (activeTrack && activeTrack.url) {
      player.replace(activeTrack.url);
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackSpeed);
      player.volume = playerVolume;
      
      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else {
        player.play();
      }
    }
  }, [activeTrackIndex, tracks]);

  // Sync speed & volume changes
  useEffect(() => {
    if (player) {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackSpeed);
      player.volume = playerVolume;
    }
  }, [playbackSpeed, playerVolume, player]);

  const mapTrack = (b: any): Track => {
    const durationSec = b.durationSec || b.duration || 200;
    let durationStr = '';
    if (typeof durationSec === 'number') {
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      durationStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
      durationStr = String(durationSec);
    }
    return {
      id: b.id,
      title: b.title || 'Devotional Chant',
      artist: b.artist || b.category || 'Vedic Devotion',
      duration: durationStr,
      durationSec: typeof durationSec === 'number' ? durationSec : 200,
      url: b.url,
      thumbnail: b.thumbnail,
      category: b.category,
      sub_type: b.sub_type,
      description: b.description || ''
    };
  };

  const playTrack = (track: any) => {
    if (!track || !track.url) return;
    const mapped = mapTrack(track);
    
    // Find index or add it
    let index = tracks.findIndex(t => t.id === mapped.id || t.url === mapped.url);
    if (index === -1) {
      const newTracks = [...tracks, mapped];
      setTracks(newTracks);
      index = newTracks.length - 1;
    }
    isInitialMount.current = false;
    setActiveTrackIndex(index);
  };

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <PlaybackContext.Provider
      value={{
        player,
        status,
        tracks,
        setTracks,
        activeTrackIndex,
        setActiveTrackIndex,
        activeTrack,
        playbackSpeed,
        setPlaybackSpeed,
        playerVolume,
        setPlayerVolume,
        playTrack,
        togglePlay,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};
