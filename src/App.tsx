/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { Upload, Activity, Info, BarChart3 } from "lucide-react";
import AudioPlayer from "./components/AudioPlayer";
import Spectrogram from "./components/Spectrogram";
import { performSTFT } from "./utils/audio";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [stftData, setStftData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setStftData(null);
    }
  };

  const onBufferLoaded = useCallback(async (buffer: AudioBuffer) => {
    setIsProcessing(true);
    try {
       const result = await performSTFT(buffer, 1024, 256);
       setStftData({
         ...result,
         rawChannelData: buffer.getChannelData(0) // Cache first channel for waveform view
       });
    } catch (err) {
       console.error("STFT Error:", err);
    } finally {
       setIsProcessing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020204] text-[#E0E0E0] font-sans selection:bg-[#ff4e00] selection:text-white flex flex-col overflow-x-hidden">
      {/* Immersive Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0f] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#ff4e00] to-[#ec008c] rounded-md flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">SonicView <span className="text-[#ff4e00]">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs font-mono opacity-60">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <span>ENGINE: STFT_R4_1024</span>
          </div>
          <span>SAMPLE RATE: 44.1 KHZ</span>
          <span className="text-[#00FF00] uppercase tracking-widest">{isProcessing ? "Analyzing..." : "Ready"}</span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* Upload & Config Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <label 
            className={cn(
              "lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center border-dashed group cursor-pointer transition-all hover:bg-white/[0.08]",
              audioFile && "border-solid border-[#ff4e00]/30"
            )}
          >
            <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
            <div className="text-center">
              <p className="text-sm font-medium tracking-tight">
                {audioFile ? audioFile.name : "active_recording_source_raw.wav"}
              </p>
              <p className="text-[10px] text-white/40 uppercase mt-1 tracking-widest">
                {audioFile ? "Click to replace file" : "Drag audio or browse (MP3, WAV, FLAC)"}
              </p>
            </div>
          </label>

          <div className="h-full bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-[#ff4e00] uppercase tracking-widest">FFT_SIZE</span>
              <span className="text-xs font-mono">1024</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="w-[50%] h-full bg-[#ff4e00] rounded-full shadow-[0_0_10px_#ff4e00]" />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono opacity-50 uppercase tracking-tighter">
              <span>WINDOW: HANNING</span>
              <span>OVERLAP: 75%</span>
            </div>
          </div>
        </div>

        {/* Audio Player Interface */}
        {audioFile && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <AudioPlayer file={audioFile} onBufferLoaded={onBufferLoaded} />
          </div>
        )}

        {/* Spectrogram Plot Section */}
        <section className="flex-1 bg-[#050508] border border-white/10 rounded-2xl p-6 flex flex-col relative min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xs font-mono tracking-widest uppercase text-white/40 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-[#ff4e00]" />
              Short-Time Fourier Transform (STFT) Analysis
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase">Color Map:</span>
              <div className="h-3 w-24 bg-gradient-to-r from-[#000004] via-[#721f81] via-[#f1605d] to-[#fcfdbf] rounded-sm" />
              <span className="text-[10px] font-mono text-white/60 tracking-wider">MAGMA</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            {!audioFile ? (
              <div className="text-white/20 font-mono text-[10px] uppercase tracking-[.2em] flex flex-col items-center gap-4">
                <div className="w-16 h-px bg-white/10" />
                Wait_for_audio_stream_input
                <div className="w-16 h-px bg-white/10" />
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-10 h-10 border-t-2 border-[#ff4e00] border-solid rounded-full animate-spin" />
                <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#ff4e00] animate-pulse">Computing_Spectral_Map</p>
              </div>
            ) : stftData ? (
              <div className="w-full h-full animate-in fade-in duration-1000">
                <Spectrogram data={stftData} />
              </div>
            ) : null}
          </div>
          
          {/* Axis Labels Overlay (Decorative relative to the spectrogram component) */}
          <div className="absolute -left-12 top-1/2 -rotate-90 text-[9px] font-mono uppercase tracking-[0.4em] text-white/10 pointer-events-none hidden lg:block">
            Magnitude_Distribution (dB)
          </div>
          <div className="text-center mt-6 text-[9px] font-mono uppercase tracking-[0.4em] text-white/10 pointer-events-none">
            Frequency_Spectral_Components (Log_Scale)
          </div>
        </section>
      </main>

      {/* Footer Interface */}
      <footer className="h-14 border-t border-white/5 bg-[#050508] px-8 flex items-center justify-between mt-auto">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e00]" />
            <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest">RMS: -14.2 DBFS</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec008c]" />
            <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest">PEAK: -0.3 DBFS</span>
          </div>
        </div>
        <div className="text-[9px] font-mono opacity-20 italic uppercase tracking-tighter">
          Processed in ~18ms via WebWorker Spectral-Bridge R4
        </div>
      </footer>
    </div>
  );
}

