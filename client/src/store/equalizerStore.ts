import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EQPreset = 'flat' | 'bass' | 'treble' | 'vocal' | 'electronic' | 'rock' | 'custom';

interface EQBand {
  frequency: number;
  gain: number;
}

interface EqualizerState {
  enabled: boolean;
  preset: EQPreset;
  bands: EQBand[];
  
  setEnabled: (enabled: boolean) => void;
  setPreset: (preset: EQPreset) => void;
  setBandGain: (index: number, gain: number) => void;
  resetBands: () => void;
}

// Standard 10-band EQ frequencies
const DEFAULT_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const PRESETS: Record<EQPreset, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  treble: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
  vocal: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1],
  electronic: [5, 4, 2, 0, -2, -1, 0, 3, 4, 5],
  rock: [5, 4, 2, -1, -2, 0, 2, 4, 5, 5],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

const createDefaultBands = (): EQBand[] => 
  DEFAULT_FREQUENCIES.map(frequency => ({ frequency, gain: 0 }));

export const useEqualizerStore = create<EqualizerState>()(
  persist(
    (set, get) => ({
      enabled: false,
      preset: 'flat',
      bands: createDefaultBands(),
      
      setEnabled: (enabled) => set({ enabled }),
      
      setPreset: (preset) => {
        const presetGains = PRESETS[preset];
        const bands = get().bands.map((band, i) => ({
          ...band,
          gain: presetGains[i] || 0
        }));
        set({ preset, bands });
      },
      
      setBandGain: (index, gain) => {
        const bands = [...get().bands];
        if (bands[index]) {
          bands[index] = { ...bands[index], gain: Math.max(-12, Math.min(12, gain)) };
          set({ bands, preset: 'custom' });
        }
      },
      
      resetBands: () => {
        set({ bands: createDefaultBands(), preset: 'flat' });
      }
    }),
    {
      name: 'resonant-equalizer'
    }
  )
);

export { DEFAULT_FREQUENCIES };
