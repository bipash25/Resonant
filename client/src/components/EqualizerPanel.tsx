import { X, Sliders } from 'lucide-react';
import { useEqualizerStore, DEFAULT_FREQUENCIES } from '../store/equalizerStore';
import type { EQPreset } from '../store/equalizerStore';

interface EqualizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_LABELS: Record<EQPreset, string> = {
  flat: 'Flat',
  bass: 'Bass Boost',
  treble: 'Treble Boost',
  vocal: 'Vocal',
  electronic: 'Electronic',
  rock: 'Rock',
  custom: 'Custom'
};

export default function EqualizerPanel({ isOpen, onClose }: EqualizerPanelProps) {
  const { enabled, preset, bands, setEnabled, setPreset, setBandGain, resetBands } = useEqualizerStore();

  if (!isOpen) return null;

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) return `${freq / 1000}k`;
    return freq.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div 
        className="w-full max-w-lg bg-[#121212] h-full flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg font-bold text-white">Equalizer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#282828] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#b3b3b3]" />
          </button>
        </div>

        {/* Enable Toggle */}
        <div className="p-4 border-b border-[#282828]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Enable Equalizer</p>
              <p className="text-xs text-[#6a6a6a]">Only works with local files</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-[#1ed760]' : 'bg-[#535353]'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="p-4 border-b border-[#282828]">
          <p className="text-sm font-semibold text-[#b3b3b3] mb-3">Presets</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as EQPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                disabled={!enabled}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  preset === p
                    ? 'bg-[#1ed760] text-black'
                    : 'bg-[#282828] text-white hover:bg-[#3e3e3e]'
                } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* EQ Bands */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#b3b3b3]">Frequency Bands</p>
            <button
              onClick={resetBands}
              disabled={!enabled}
              className="text-xs text-[#b3b3b3] hover:text-white disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          
          <div className="flex justify-between gap-1 h-64">
            {bands.map((band, index) => (
              <div key={band.frequency} className="flex flex-col items-center flex-1">
                {/* Gain value */}
                <span className={`text-xs mb-2 ${enabled ? 'text-white' : 'text-[#6a6a6a]'}`}>
                  {band.gain > 0 ? '+' : ''}{band.gain}
                </span>
                
                {/* Vertical slider */}
                <div className="flex-1 flex items-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={band.gain}
                    onChange={(e) => setBandGain(index, parseInt(e.target.value))}
                    disabled={!enabled}
                    className="h-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      width: '20px',
                      background: 'transparent',
                      accentColor: '#1ed760'
                    }}
                  />
                </div>
                
                {/* Frequency label */}
                <span className="text-xs text-[#6a6a6a] mt-2">
                  {formatFrequency(DEFAULT_FREQUENCIES[index])}
                </span>
              </div>
            ))}
          </div>
          
          {/* dB scale */}
          <div className="flex justify-between mt-4 text-xs text-[#6a6a6a]">
            <span>-12 dB</span>
            <span>0 dB</span>
            <span>+12 dB</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282828] text-center">
          <p className="text-xs text-[#6a6a6a]">
            Equalizer uses Web Audio API for local file playback
          </p>
        </div>
      </div>
    </div>
  );
}
