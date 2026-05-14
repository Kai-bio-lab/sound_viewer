/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Square, Music } from "lucide-react";

interface AudioPlayerProps {
  file: File | string;
  onBufferLoaded?: (buffer: AudioBuffer) => void;
}

export default function AudioPlayer({ file, onBufferLoaded }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255, 255, 255, 0.05)",
      progressColor: "#ff4e00",
      cursorColor: "#FFFFFF",
      height: 60,
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      normalize: true,
      backend: "WebAudio"
    });

    const ws = wavesurfer.current;

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("ready", () => {
      const d = ws.getDuration();
      setDuration(d);
      const audioBuffer = ws.getDecodedData();
      if (audioBuffer && onBufferLoaded) {
        onBufferLoaded(audioBuffer);
      }
    });
    ws.on("audioprocess", (time) => setCurrentTime(time));
    ws.on("interaction", (time) => setCurrentTime(time));

    return () => {
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurfer.current && file) {
      if (typeof file === "string") {
        wavesurfer.current.load(file);
      } else {
        const url = URL.createObjectURL(file);
        wavesurfer.current.load(url);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [file]);

  const togglePlay = () => wavesurfer.current?.playPause();
  const stop = () => {
    wavesurfer.current?.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#0f0f15] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ff4e00]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
          
          <button
            onClick={stop}
            className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/40 hover:text-white"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest">
                {typeof file === "string" ? "Sample_Buffer_01" : file.name}
              </h3>
              <p className="text-[#8E9299] text-[9px] font-mono tracking-tighter uppercase">
                {isPlaying ? "Stream_Status: Active" : "Stream_Status: Buffered"}
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-white/50">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="opacity-30"> / {formatTime(duration)}</span>
            </div>
          </div>
          
          <div ref={containerRef} className="w-full opacity-80" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.03] flex justify-between items-center text-[8px] font-mono text-white/10 uppercase tracking-[0.2em]">
        <span>Input_Path: {typeof file === "string" ? "Remote" : "Local_FileSystem"}</span>
        <span>Output: Analog_Summing_V2</span>
      </div>
    </div>
  );
}
