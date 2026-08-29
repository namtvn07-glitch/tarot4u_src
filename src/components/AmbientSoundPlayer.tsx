"use client";

import React, { useState, useEffect, useRef } from "react";
import { Music, Sliders, Volume2, VolumeX, Sparkles, Wind, Bell, CloudRain, Volume1 } from "lucide-react";
import { ambientAudio, SOUNDSCAPES, SoundscapeType } from "../services/ambientAudio";

export const AmbientSoundPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSoundscape, setCurrentSoundscape] = useState<SoundscapeType>("wind-chimes");
  const [volume, setVolume] = useState(60);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const togglePlay = () => {
    if (isPlaying) {
      ambientAudio.stop();
      setIsPlaying(false);
    } else {
      ambientAudio.setVolume(volume / 100);
      ambientAudio.play(currentSoundscape);
      setIsPlaying(true);
    }
  };

  const handleSelectSoundscape = (id: SoundscapeType) => {
    setCurrentSoundscape(id);
    if (isPlaying) {
      ambientAudio.play(id);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    ambientAudio.setVolume(val / 100);
  };

  const getSoundIcon = (id: SoundscapeType) => {
    switch (id) {
      case "wind-chimes": return <Bell className="w-4 h-4 text-[#d4af37]" />;
      case "singing-bowl": return <Sparkles className="w-4 h-4 text-[#d4af37]" />;
      case "night-breeze": return <Wind className="w-4 h-4 text-[#d4af37]" />;
      case "gentle-rain": return <CloudRain className="w-4 h-4 text-[#d4af37]" />;
      default: return <Music className="w-4 h-4 text-[#d4af37]" />;
    }
  };

  const activeSoundscapeObj = SOUNDSCAPES.find((s) => s.id === currentSoundscape) || SOUNDSCAPES[0];

  return (
    <div className="fixed bottom-5 right-5 z-50" ref={menuRef}>
      {/* Main Trigger Button */}
      <div className="flex items-center shadow-[0_8px_25px_rgba(0,0,0,0.85)] rounded-full">
        <button
          onClick={togglePlay}
          title={isPlaying ? "Tắt nhạc nền thư giãn" : "Bật âm thanh thiền định & chuông gió"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-l-full text-xs font-semibold border transition-all duration-300 cursor-pointer ${
            isPlaying
              ? "bg-[#d4af37]/25 border-[#d4af37] text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              : "bg-[#15100b]/95 border-[#3d3123] text-[#b3a48d] hover:text-[#d4af37] hover:border-[#d4af37]/50"
          }`}
        >
          {isPlaying ? (
            /* Animated Equalizer */
            <div className="flex items-end gap-[2.5px] h-3.5 w-3.5">
              <span className="w-[3px] bg-[#d4af37] rounded-sm animate-[bounce_0.9s_ease-in-out_infinite] h-full" />
              <span className="w-[3px] bg-[#d4af37] rounded-sm animate-[bounce_1.2s_ease-in-out_infinite_0.2s] h-2/3" />
              <span className="w-[3px] bg-[#d4af37] rounded-sm animate-[bounce_0.8s_ease-in-out_infinite_0.4s] h-4/5" />
            </div>
          ) : (
            <Music className="w-3.5 h-3.5 text-[#7a6e5d]" />
          )}

          <span className="hidden sm:inline text-xs font-medium tracking-wide">
            {isPlaying ? activeSoundscapeObj.name : "Âm Thanh Môi Trường"}
          </span>
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Chọn âm thanh & chỉnh âm lượng"
          className={`px-2.5 py-2 rounded-r-full text-xs border-y border-r transition-all duration-300 cursor-pointer ${
            isPlaying
              ? "bg-[#d4af37]/25 border-[#d4af37] text-[#d4af37]"
              : "bg-[#15100b]/95 border-[#3d3123] text-[#7a6e5d] hover:text-[#d4af37]"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Settings Menu */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 sm:w-80 bg-[#15100b] border border-[#d4af37]/45 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#3d3123] mb-3">
            <div className="flex items-center gap-2 text-white font-display text-sm tracking-wide">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Âm Thanh Thiền Định</span>
            </div>
            <button
              onClick={togglePlay}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isPlaying
                  ? "bg-[#d4af37] text-[#050505] shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                  : "bg-[#251d16] text-[#b3a48d] border border-[#3d3123] hover:border-[#d4af37]"
              }`}
            >
              {isPlaying ? "Đang Phát" : "Bật Âm"}
            </button>
          </div>

          {/* Soundscapes List */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] font-bold text-[#7a6e5d] uppercase tracking-widest block mb-1">
              Giai Điệu Chiêm Nghiệm
            </span>
            {SOUNDSCAPES.map((s) => {
              const isSelected = currentSoundscape === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectSoundscape(s.id);
                    if (!isPlaying) {
                      ambientAudio.setVolume(volume / 100);
                      ambientAudio.play(s.id);
                      setIsPlaying(true);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                    isSelected
                      ? "bg-[#8f5a1f]/25 border-[#d4af37]/60 text-white shadow-sm"
                      : "bg-[#1c1611]/70 border-transparent text-[#b3a48d] hover:bg-[#251d16] hover:text-white"
                  }`}
                >
                  <div className="mt-0.5">{getSoundIcon(s.id)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wide truncate">
                        {s.name}
                      </span>
                      {isSelected && isPlaying && (
                        <span className="text-[10px] text-[#d4af37] font-mono animate-pulse">
                          ● Đang phát
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7a6e5d] line-clamp-1 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="pt-3 border-t border-[#3d3123]">
            <div className="flex items-center justify-between text-xs text-[#b3a48d] mb-1.5">
              <span className="flex items-center gap-1.5">
                {volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#d4af37]" />
                ) : volume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5 text-[#d4af37]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span>Âm lượng</span>
              </span>
              <span className="text-[11px] font-mono text-[#d4af37]">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-[#d4af37] h-1.5 bg-[#251d16] rounded-lg cursor-pointer appearance-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
