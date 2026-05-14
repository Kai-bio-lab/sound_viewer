/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard Hanning window function for STFT.
 */
export function hanningWindow(length: number): Float32Array {
  const window = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
  }
  return window;
}

/**
 * Simple iterative FFT implementation (Radix-2).
 * Length must be a power of 2.
 */
export function fft(real: Float32Array, imag: Float32Array): void {
  const n = real.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  // Butterfly computations
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (2 * Math.PI) / len;
    const wLenReal = Math.cos(angle);
    const wLenImag = -Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wReal = 1;
      let wImag = 0;
      for (let k = 0; k < len / 2; k++) {
        const uReal = real[i + k];
        const uImag = imag[i + k];
        const vReal = real[i + k + len / 2] * wReal - imag[i + k + len / 2] * wImag;
        const vImag = real[i + k + len / 2] * wImag + imag[i + k + len / 2] * wReal;
        real[i + k] = uReal + vReal;
        imag[i + k] = uImag + vImag;
        real[i + k + len / 2] = uReal - vReal;
        imag[i + k + len / 2] = uImag - vImag;
        const nextWReal = wReal * wLenReal - wImag * wLenImag;
        wImag = wReal * wLenImag + wImag * wLenReal;
        wReal = nextWReal;
      }
    }
  }
}

/**
 * Performs STFT on an audio buffer.
 * Returns a 2D array [timeIndex][frequencyIndex] containing magnitudes.
 */
export async function performSTFT(
  audioBuffer: AudioBuffer,
  windowSize: number = 2048,
  hopSize: number = 512
): Promise<{
  magnitudes: Float32Array[];
  sampleRate: number;
  frequencies: number[];
  duration: number;
}> {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const numWindows = Math.floor((channelData.length - windowSize) / hopSize) + 1;
  const window = hanningWindow(windowSize);
  
  const magnitudes: Float32Array[] = [];
  const freqBinCount = windowSize / 2;
  const frequencies = Array.from({ length: freqBinCount }, (_, i) => (i * sampleRate) / windowSize);

  for (let i = 0; i < numWindows; i++) {
    const start = i * hopSize;
    const real = new Float32Array(windowSize);
    const imag = new Float32Array(windowSize);

    for (let k = 0; k < windowSize; k++) {
      real[k] = channelData[start + k] * window[k];
    }

    fft(real, imag);

    const magRow = new Float32Array(freqBinCount);
    for (let k = 0; k < freqBinCount; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      // Use log scale for magnitude often, but we'll return raw for dynamic range control later
      magRow[k] = mag;
    }
    magnitudes.push(magRow);
  }

  return {
    magnitudes,
    sampleRate,
    frequencies,
    duration: audioBuffer.duration
  };
}

/**
 * Magma colormap interpolation.
 * Returns [r, g, b] as 0-255.
 */
export function getMagmaColor(value: number): [number, number, number] {
  // Simple approximation of Magma colormap
  // value is 0.0 to 1.0
  const v = Math.max(0, Math.min(1, value));
  
  // Hand-tuned checkpoints for magma-like feel
  if (v < 0.25) {
    const t = v / 0.25;
    return [
      Math.floor(0 + 80 * t),
      Math.floor(0 + 10 * t),
      Math.floor(0 + 130 * t)
    ];
  } else if (v < 0.5) {
    const t = (v - 0.25) / 0.25;
    return [
      Math.floor(80 + 120 * t),
      Math.floor(10 + 40 * t),
      Math.floor(130 - 20 * t)
    ];
  } else if (v < 0.75) {
    const t = (v - 0.5) / 0.25;
    return [
      Math.floor(200 + 55 * t),
      Math.floor(50 + 100 * t),
      Math.floor(110 - 50 * t)
    ];
  } else {
    const t = (v - 0.75) / 0.25;
    return [
      Math.floor(255),
      Math.floor(150 + 105 * t),
      Math.floor(60 + 195 * t)
    ];
  }
}
