/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { getMagmaColor } from "../utils/audio";
import { Maximize2, RotateCcw, MousePointer2, BarChart3, Download, Target, Waves, Activity } from "lucide-react";

interface SpectrogramProps {
  data: {
    magnitudes: Float32Array[];
    frequencies: number[];
    duration: number;
    rawChannelData?: Float32Array;
  };
}

interface ViewState {
  zoomX: number;
  zoomY: number;
  offsetX: number;
  offsetY: number;
}

type ViewMode = "spectrogram" | "waveform";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function Spectrogram({ data }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>("spectrogram");
  const [viewState, setViewState] = useState<ViewState>({
    zoomX: 1,
    zoomY: 1,
    offsetX: 0,
    offsetY: 0
  });

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [targetFreq, setTargetFreq] = useState<number | "">("");

  const resetView = () => {
    setViewState({ zoomX: 1, zoomY: 1, offsetX: 0, offsetY: 0 });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === "spectrogram" ? "waveform" : "spectrogram");
    resetView();
  };

  const handleExport = () => {
    if (!data) return;
    const { magnitudes, frequencies } = data;
    
    const header = ["Frequency_Hz", ...magnitudes.map((_, i) => `T_${i}`)].join(",");
    const rows = frequencies.map((freq, fIdx) => {
      const line = [freq.toFixed(2)];
      for (let t = 0; t < magnitudes.length; t++) {
        line.push(magnitudes[t][fIdx].toFixed(5));
      }
      return line.join(",");
    });

    const csvContent = header + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spectral_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomIntensity = 0.2;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    
    setViewState(prev => {
      const nextZoomX = Math.max(1, prev.zoomX + delta);
      // Frequency zoom only relevant in spectrogram mode
      const nextZoomY = viewMode === "spectrogram" ? Math.max(1, prev.zoomY + delta) : 1;
      
      if (nextZoomX === prev.zoomX && nextZoomY === prev.zoomY) return prev;

      return {
        ...prev,
        zoomX: nextZoomX,
        zoomY: nextZoomY,
        offsetX: Math.max(0, Math.min(1 - 1 / nextZoomX, prev.offsetX)),
        offsetY: Math.max(0, Math.min(1 - 1 / nextZoomY, prev.offsetY))
      };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - lastMousePos.x) / (containerRef.current?.clientWidth || 1);
    const dy = (e.clientY - lastMousePos.y) / (containerRef.current?.clientHeight || 1);

    setViewState(prev => ({
      ...prev,
      offsetX: Math.max(0, Math.min(1 - 1 / prev.zoomX, prev.offsetX - dx / prev.zoomX)),
      offsetY: viewMode === "spectrogram" 
        ? Math.max(0, Math.min(1 - 1 / prev.zoomY, prev.offsetY + dy / prev.zoomY))
        : 0
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { magnitudes, frequencies, rawChannelData } = data;
    const numFrequencies = frequencies.length;
    const numTimeSteps = magnitudes.length;

    canvas.width = 2000;
    canvas.height = 1000;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (viewMode === "waveform" && rawChannelData) {
      // Waveform View
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ff4e00";
      
      const visibleSamplesCount = Math.floor(rawChannelData.length / viewState.zoomX);
      const startSampleIdx = Math.floor(viewState.offsetX * rawChannelData.length);
      const endSampleIdx = Math.min(rawChannelData.length, startSampleIdx + visibleSamplesCount);
      
      const centerY = canvas.height / 2;
      const stepX = canvas.width / (endSampleIdx - startSampleIdx);

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      // Decimate for drawing speed if needed
      const drawStep = Math.max(1, Math.floor((endSampleIdx - startSampleIdx) / canvas.width));
      
      for (let i = startSampleIdx; i < endSampleIdx; i += drawStep) {
        const x = (i - startSampleIdx) * stepX;
        const val = rawChannelData[i];
        const y = centerY - val * centerY * 0.8;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    } else {
      // Ridgeline Spectrogram View
      let maxMag = 0;
      const skip = Math.max(1, Math.floor(numTimeSteps / 50));
      for (let i = 0; i < numTimeSteps; i += skip) {
        for (let j = 0; j < numFrequencies; j += 10) {
          if (magnitudes[i][j] > maxMag) maxMag = magnitudes[i][j];
        }
      }
      maxMag = maxMag || 1;

      const visibleTimeStepsCount = Math.floor(numTimeSteps / viewState.zoomX);
      const startTimeIdx = Math.floor(viewState.offsetX * numTimeSteps);
      const endTimeIdx = Math.min(numTimeSteps, startTimeIdx + visibleTimeStepsCount);

      const visibleFrequenciesCount = Math.floor(numFrequencies / viewState.zoomY);
      const startFreqIdx = Math.floor(viewState.offsetY * numFrequencies);
      const endFreqIdx = Math.min(numFrequencies, startFreqIdx + visibleFrequenciesCount);

      const numLines = 64; 
      const lineSpacing = canvas.height / (numLines + 1);
      const timeStepWidth = canvas.width / (endTimeIdx - startTimeIdx || 1);
      const verticalScale = lineSpacing * 1.8; 

      ctx.lineWidth = 1.2;
      
      for (let l = 0; l < numLines; l++) {
        const relativeFreqPos = l / numLines;
        const freqIdx = startFreqIdx + Math.floor(Math.pow(relativeFreqPos, 1.3) * (endFreqIdx - startFreqIdx));
        if (freqIdx >= numFrequencies) continue;

        const freqAtLine = frequencies[freqIdx];
        const isTarget = typeof targetFreq === "number" && Math.abs(freqAtLine - targetFreq) < (frequencies[1] - frequencies[0]) * 5;

        const baseY = canvas.height - (l + 1) * lineSpacing;
        
        const normalizedFreqForColor = freqIdx / (numFrequencies || 1);
        ctx.strokeStyle = isTarget 
          ? "#ff4e00" 
          : `rgba(${getMagmaColor(normalizedFreqForColor).join(",")}, 0.9)`;
        
        ctx.lineWidth = isTarget ? 2.5 : 1.2;
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let t = startTimeIdx; t < endTimeIdx; t++) {
          const x = (t - startTimeIdx) * timeStepWidth;
          const mag = magnitudes[t][freqIdx];
          
          const normalizedMag = Math.log10(1 + (mag / maxMag) * 150) / Math.log10(151);
          const displacement = normalizedMag * verticalScale;
          
          const y = baseY - displacement;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, baseY);
        ctx.fill(); 
        ctx.stroke();

        if (isTarget) {
          ctx.fillStyle = "#ff4e00";
          ctx.font = "bold 20px JetBrains Mono";
          ctx.fillText(`${Math.round(freqAtLine)} Hz TARGET`, 10, baseY - 30);
        }
      }
    }
  }, [data, viewState, viewMode, targetFreq]);

  // Derived labels for axes
  const currentFarthestFreq = (viewState.offsetY + 1 / viewState.zoomY) * (data.frequencies[data.frequencies.length - 1] || 0);
  const currentStartFreq = viewState.offsetY * (data.frequencies[data.frequencies.length - 1] || 0);
  const currentStartTime = viewState.offsetX * data.duration;
  const currentEndTime = (viewState.offsetX + 1 / viewState.zoomX) * data.duration;

  return (
    <div className="w-full flex-1 flex flex-col gap-4 select-none">
      {/* Integrated Analysis Overlay */}
      <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <Target className="w-4 h-4 text-[#ff4e00]" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest hidden sm:inline">Freq Investigator:</span>
            <input 
              type="number" 
              placeholder="Enter Hz..." 
              className="bg-transparent border-none text-[11px] font-mono text-white outline-none w-24 text-center placeholder:text-white/20"
              value={targetFreq}
              onChange={(e) => setTargetFreq(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <span className="text-[10px] font-mono text-white/20">Hz</span>
          </div>

          <div className="h-8 w-px bg-white/5" />

          {/* View Mode Toggle Button */}
          <button 
            onClick={toggleViewMode}
            className={cn(
              "flex items-center gap-2 border rounded-lg px-4 py-2 transition-all group",
              viewMode === "waveform" 
                ? "bg-white/10 border-white/20 text-white" 
                : "bg-[#ec008c]/10 border-[#ec008c]/20 text-[#ec008c] hover:bg-[#ec008c]/20"
            )}
            title="Toggle between Spectrogram and Waveform"
          >
            {viewMode === "waveform" ? <BarChart3 className="w-4 h-4" /> : <Waves className="w-4 h-4" />}
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {viewMode === "waveform" ? "Spectral View" : "Waveform View"}
            </span>
          </button>
          
          <div className="h-8 w-px bg-white/5" />

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#ff4e00]/10 border border-[#ff4e00]/20 hover:bg-[#ff4e00]/20 text-[#ff4e00] rounded-lg px-4 py-2 transition-all group"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Spectral Data (.CSV)</span>
          </button>
        </div>

        <div className="flex flex-col text-right">
           <span className="text-[10px] font-mono text-white/60 tracking-wider">NYQUIST_THRESHOLD: {Math.round(data.frequencies[data.frequencies.length-1])} Hz</span>
           <span className="text-[8px] font-mono text-white/20 uppercase">STFT_Matrix_Transposed_per_Export_Request</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Vertical Axis */}
        <div className="w-16 flex flex-col justify-between py-8 text-[9px] font-mono text-white/30 text-right uppercase tracking-tighter">
          {viewMode === "spectrogram" ? (
             <>
               <span>{Math.round(currentFarthestFreq / 1000)} kHz</span>
               <div className="flex-grow flex flex-col justify-around py-10 opacity-50">
                  <div className="h-px w-2 bg-white/10 ml-auto" />
                  <div className="h-px w-2 bg-white/10 ml-auto" />
                  <div className="h-px w-2 bg-white/10 ml-auto" />
               </div>
               <span>{Math.round(currentStartFreq)} Hz</span>
             </>
          ) : (
            <>
               <span>+1.0</span>
               <span>0.0</span>
               <span>-1.0</span>
            </>
          )}
        </div>

        {/* Plot Area */}
        <div 
          ref={containerRef}
          className={cn(
            "flex-1 relative bg-black rounded-xl border border-white/10 overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,1)] group",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            title="SCROLL TO ZOOM | DRAG TO PAN"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff4e0005] to-transparent w-20 animate-[scan_4s_linear_infinite] pointer-events-none" />

          {/* Interaction UI Overlay */}
          <div className="absolute top-6 right-6 flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); resetView(); }}
              className="p-2 bg-black/60 border border-white/10 rounded-lg text-white/40 hover:text-[#ff4e00] hover:border-[#ff4e00]/50 transition-all flex items-center gap-2 group/btn backdrop-blur-sm"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono uppercase tracking-widest hidden group-hover/btn:block">Reset</span>
            </button>
            <div className="p-2 bg-black/60 border border-white/10 rounded-lg text-white/40 flex items-center gap-2 backdrop-blur-sm">
               <Maximize2 className="w-3.5 h-3.5" />
               <span className="text-[9px] font-mono uppercase tracking-widest">{viewState.zoomX.toFixed(1)}x</span>
            </div>
          </div>

          {/* Metadata Display */}
          <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-1">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] shadow-[0_0_8px_#ff4e00] animate-pulse" />
               <span className="text-[9px] font-mono text-white/80 tracking-[0.2em] uppercase italic">
                 {viewMode === "waveform" ? "Time_Domain_Analysis" : "Interactive_Spectral_Relief"}
               </span>
             </div>
             <div className="flex items-center gap-2 text-[8px] font-mono text-white/20 ml-3.5">
               <MousePointer2 className="w-2.5 h-2.5" />
               <span>SCROLL_ZOOM / DRAG_PAN</span>
             </div>
          </div>

          {/* Precision View Bars */}
          <div className="absolute bottom-6 left-6 right-6 h-0.5 bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#ff4e00] transition-all duration-300 shadow-[0_0_10px_#ff4e00]" 
               style={{ 
                 width: `${(100 / viewState.zoomX)}%`,
                 marginLeft: `${viewState.offsetX * 100}%`
               }} 
             />
          </div>
          
          {viewMode === "spectrogram" && (
            <div className="absolute right-3 top-20 bottom-20 w-0.5 bg-white/5 rounded-full overflow-hidden">
               <div 
                 className="w-full bg-[#ec008c] transition-all duration-300 shadow-[0_0_10px_#ec008c]" 
                 style={{ 
                   height: `${(100 / viewState.zoomY)}%`,
                   marginTop: `${(1 - viewState.offsetY - 1 / viewState.zoomY) * 100}%`
                 }} 
               />
            </div>
          )}
        </div>
      </div>
      
      {/* Horizontal Time Axis (Dynamic) */}
      <div className="pl-22 flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">
        <span>T={currentStartTime.toFixed(2)}s</span>
        <div className="hidden md:flex items-center gap-2 opacity-10">
          {viewMode === "waveform" ? <Activity className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
          <span>{viewMode === "waveform" ? "RAW_SIGNAL_DOMAIN" : "SPECTRAL_WINDOW_ANALYSIS"}</span>
        </div>
        <span>T={currentEndTime.toFixed(2)}s</span>
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateX(-100%); }
          to { transform: translateX(1000%); }
        }
      `}</style>
    </div>
  );
}

