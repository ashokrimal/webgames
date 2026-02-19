import { useState, useEffect, useCallback } from 'react';

interface SoundConfig {
  volume: number;
  enabled: boolean;
}

interface SoundEffects {
  playMove: () => void;
  playWin: () => void;
  playLose: () => void;
  playDraw: () => void;
  playClick: () => void;
  playHover: () => void;
  playNotification: () => void;
}

const SOUND_URLS = {
  move: '/sounds/move.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  draw: '/sounds/draw.mp3',
  click: '/sounds/click.mp3',
  hover: '/sounds/hover.mp3',
  notification: '/sounds/notification.mp3'
};

export const useSoundEffects = () => {
  const [config, setConfig] = useState<SoundConfig>({
    volume: 0.5,
    enabled: true
  });
  const [audioCache, setAudioCache] = useState<Record<string, HTMLAudioElement>>({});

  // Load sounds on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load user preferences from localStorage
    const savedConfig = localStorage.getItem('sound-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading sound config:', error);
      }
    }

    // Preload audio files
    const preloadAudio = async () => {
      const cache: Record<string, HTMLAudioElement> = {};

      for (const [key, url] of Object.entries(SOUND_URLS)) {
        try {
          const audio = new Audio(url);
          audio.volume = config.volume;
          audio.preload = 'auto';

          // Wait for audio to load
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.load();
          });

          cache[key] = audio;
        } catch (error) {
          console.warn(`Failed to load sound: ${key}`, error);
          // Create silent audio as fallback
          cache[key] = new Audio();
        }
      }

      setAudioCache(cache);
    };

    preloadAudio();
  }, []);

  // Update volume when config changes
  useEffect(() => {
    Object.values(audioCache).forEach(audio => {
      audio.volume = config.volume;
    });

    // Save config to localStorage
    localStorage.setItem('sound-config', JSON.stringify(config));
  }, [config, audioCache]);

  const playSound = useCallback((soundName: keyof typeof SOUND_URLS) => {
    if (!config.enabled || !audioCache[soundName]) return;

    try {
      const audio = audioCache[soundName].cloneNode() as HTMLAudioElement;
      audio.volume = config.volume;
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }, [config, audioCache]);

  const updateConfig = useCallback((newConfig: Partial<SoundConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const sounds: SoundEffects = {
    playMove: () => playSound('move'),
    playWin: () => playSound('win'),
    playLose: () => playSound('lose'),
    playDraw: () => playSound('draw'),
    playClick: () => playSound('click'),
    playHover: () => playSound('hover'),
    playNotification: () => playSound('notification')
  };

  return {
    sounds,
    config,
    updateConfig,
    isEnabled: config.enabled,
    volume: config.volume
  };
};

// Sound toggle component
export const SoundToggle = () => {
  const { config, updateConfig } = useSoundEffects();

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => updateConfig({ enabled: !config.enabled })}
        className={`p-2 rounded-lg transition-colors ${
          config.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}
        title={config.enabled ? 'Disable sound' : 'Enable sound'}
      >
        {config.enabled ? '🔊' : '🔇'}
      </button>

      {config.enabled && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.volume}
            onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 w-8">{Math.round(config.volume * 100)}%</span>
        </div>
      )}
    </div>
  );
};

// Hook for game-specific sounds
export const useGameSounds = (gameType: string) => {
  const { sounds, config } = useSoundEffects();

  const gameSounds = {
    chess: {
      move: sounds.playMove,
      check: sounds.playNotification,
      checkmate: sounds.playWin,
      draw: sounds.playDraw
    },
    uno: {
      playCard: sounds.playMove,
      drawCard: sounds.playClick,
      win: sounds.playWin,
      skip: sounds.playNotification
    },
    bingo: {
      markNumber: sounds.playClick,
      bingo: sounds.playWin,
      lose: sounds.playLose
    },
    geoguessr: {
      guess: sounds.playClick,
      correct: sounds.playWin,
      incorrect: sounds.playLose,
      hint: sounds.playNotification
    },
    'gartic-phone': {
      draw: sounds.playMove,
      guess: sounds.playClick,
      correct: sounds.playWin,
      timeUp: sounds.playLose
    },
    guessword: {
      letter: sounds.playClick,
      correct: sounds.playWin,
      incorrect: sounds.playLose,
      hint: sounds.playNotification
    }
  };

  return gameSounds[gameType as keyof typeof gameSounds] || {};
};
