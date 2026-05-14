# **Sound Viewer & Spectral Analyzer**

An advanced web-based tool designed for visualizing, playing, and exporting spectral data from audio files. This project streamlines the transition from analog/digital audio signals to precise tabular representations, making it an ideal companion for scientific research, signal filtering, and training Artificial Intelligence models.

🚀 **Live Demo:** [https://sound-viewer.netlify.app](https://sound-viewer.netlify.app)

## **📋 Overview**

**Sound Viewer** empowers users to upload audio files and instantly generate interactive spectrograms. Unlike conventional visualizers, this tool focuses on **data interoperability**, enabling the export of frequency magnitudes over time into a structured CSV format.

### **Key Features:**

* **Real-Time Visualization:** Time-domain represented on the X-axis and frequency (Hz) on the Y-axis.  
* **Integrated Playback:** Listen to the audio while visually analyzing its spectral composition.  
* **Data Export:** Generate CSV files with a matrix structure where rows represent frequencies and columns represent time intervals (![][image1]).  
* **AI-Ready:** Perfect for converting raw audio into structured datasets ready for neural networks or Machine Learning pipelines.

## **📊 Export Format (CSV)**

The exported file features a tabular structure designed for seamless integration with data science tools like Pandas (Python), R, or Excel:

| Frequency\_Hz | T\_0 | T\_1 | T\_2 | ... | T\_n |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 0.0 | 0.00012 | 0.00015 | 0.00011 | ... | val |
| 21.5 | 0.00045 | 0.00052 | 0.00038 | ... | val |
| ... | ... | ... | ... | ... | ... |

* **Frequency\_Hz:** The specific frequency bin analyzed.  
* **T\_n:** The magnitude of that frequency at time step ![][image2].

## **🛠️ Use Cases**

1. **Acoustic Research:** Detailed analysis of harmonics and background noise in controlled environments.  
2. **AI Preprocessing:** Feature extraction for audio classification, speech recognition, or generative sound models.  
3. **Audio Engineering:** Pinpointing problematic frequencies for precise equalization and manual or automated filtering.

## **🚀 Local Setup and Installation**

To run this project locally, follow these steps:

1. Clone the repository:  
   git clone [https://github.com/Kai-bio-lab/sound_viewer.git]

3. Install dependencies:  
   npm install

4. Start the development server:  
   npm run dev

## **🤝 Contributing**

Contributions are highly encouraged. If you have ideas for improving the FFT (Fast Fourier Transform) algorithms or the UI/UX, feel free to open an **Issue** or submit a **Pull Request**.

## **📄 License**

This project is licensed under the MIT License. See the LICENSE file for more information.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGIAAAAYCAYAAAABHCipAAADIUlEQVR4Xu2YX4hMURzHZ9afQqLQ1s7O3JkxNbURGloKJbReSPKEpFZZxZba1CYST1LaVwqv2rRPatPyYFeKF7UePJKE9bQ8KA/i87P3bGd/jftnOvc26n7q1z3ne373+7vnnnvP3N1cLiMjIyMjIwDP87YQEzFih/aISpq1ksb5XEi4RYwXi8VDlUrFQ8qXy+VRtN8cD0hOo9FYQvsU2g/yNix0iE6atZLG9VwWkzTV09Oz1BY5eRr9u4zbOtqbzs7OFbYWgzRrJY3buXBiH3HV1mq12jpZ1VKp9NjWBfQXWotKmrWSxvlcSDjNa1W3NYxOiiGFhm0dOtCvKS0yadZKmlTmwkn3xJA9bZcec02atZLG+Vwwe0d8y6l9LgnSrJU0TueCUUVWlXikx4RqtbrKm/takNijx+MQVkvw6/Vrvd2IMpdYsL8NiCH73UU9JjA2Rs5m+Swj5wHtXp0TlbBa8mPI+EPisx5rN8LmEhu5uWKI8XY9xt63DX3a9Mk9Qdy3c+IQVMtAzs7/YSGizCUOecxmvH/scxQ7z9hz06foYfpv7RzId3d3b+TYoXRNYC1DyEKE1uLh2ZpT/hG1UG+LwLlwn1YzjxGOZzg2yBuifZt2Vef+RS5GVpV4qscETh4mJk0fo4Pkzto59Pv9J2PU1jVhtQxBCxFWi7Hjfo07LWiB3jZhc8HjLDnrGf8lD7Ov3ZD7OZ9UKBTWiAEJH3wzE++JCftbmZzBJgux4Cah7ZeCWhfi1DL4C/FF60JQLYFr7fPH57/ho2ph3nHmgn+v7/faaKW5reyc6ceCk48SL00foyMUeWXnGBh7orVW8BdiRus2rmo1w5U3PpeYy4i02fKW0Z9t9uBFwv8T/iPNvPRZhAv0b6o0eVXlNbyr9VbwF+Kr1g0ua2lceuMzLjuI35YHeJKF2ET7mM6NhOxrGF4h9hLP5GJ1DuZjLa+2BT5DxBTxk7gur3eTHCe1muHQW37MP9Xr9ZXSYR77vLnP8su5Jj/ukeHVKnCBu/V/HoWurq7lFBrUehIkWcu1N35r7T5/qJY4LLK1jIyMjDbjD8AwWHxfB5nKAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAYCAYAAAAs7gcTAAAA9UlEQVR4XmNgGAV0BXJycjHy8vKGILa0tLQwkB8LxLkKCgoSKAqBiqYCBSuB9CcgHQ6k5wBpfyBdDMSvFBUV9cAKgYIGQIESIFYE4v9AfF5FRYUdag4zkP8LiJvBPJD1QA0KQIFgqGJHqEIGoCZRkBhQOhMmBgZAwalA/AHIZIGJAQ0KAykG0kpISsGKbwLxZjSxNSBnIYuB3A1yBsiEMpgY0FPiQLGfMPcClayCKY6Hus0CphjI9waJycrKmgLpYLhBQE4XED8HMplhipWUlPiBYveBilYA6XnGxsasYAlxcXFuoKkaMIVIgAUobg6kmdAlRgEAd9I3uE/CwCYAAAAASUVORK5CYII=>
