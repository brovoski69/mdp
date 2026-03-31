# Smart Waste Management System

An IoT-based smart dustbin that automatically classifies waste as **biodegradable** or **non-biodegradable** using a hybrid ML approach (local YOLO model + Gemini cloud fallback) and physically sorts it via a servo-controlled flap mechanism. A real-time web dashboard displays classification results and logs.

## System Architecture

```
┌──────────────┐       USB/Serial        ┌──────────────────┐
│   Camera      │─── video feed ────────▶│  Raspberry Pi /   │
│   (USB/CSI)   │                        │  Host Computer    │
└──────────────┘                         │                   │
                                         │  hybrid_          │
                                         │  classifier.py    │
                                         │                   │
                                         │  ┌─────────────┐  │
                                         │  │ Local YOLO   │  │
                                         │  │ Model        │  │
                                         │  │ (≥85% conf)  │──┼──▶ Direct decision
                                         │  └─────────────┘  │
                                         │        │          │
                                         │        │ <85%     │
                                         │        ▼          │
                                         │  ┌─────────────┐  │
                                         │  │ Gemini Cloud │  │
                                         │  │ API Fallback │  │
                                         │  └─────────────┘  │
                                         └────────┬──────────┘
                                                  │ Serial (B/N)
                                                  ▼
                                         ┌──────────────────┐
                                         │  Arduino Uno      │
                                         │  + Servo Motor     │
                                         │                   │
                                         │  'B' → tilt left  │
                                         │  'N' → tilt right │
                                         │  then center      │
                                         └──────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Web Dashboard (React + Vite)                                │
│  - Real-time classification display                          │
│  - Confidence meter                                          │
│  - Activity log                                              │
│  - Stats (total scans, bio %, non-bio %)                     │
│  - Dark / Light mode                                         │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML (Local) | YOLOv8 (Ultralytics), TorchScript |
| ML (Cloud) | Google Gemini 2.5 Flash API |
| Vision | OpenCV, Pillow |
| Microcontroller | Arduino Uno, Servo library |
| Serial Comms | PySerial |
| Web Frontend | React 18, Vite 5 |
| Language | Python 3.10+, C++ (Arduino), JavaScript |

## Project Structure

```
├── arduino/
│   └── smart_dustbin.ino        # Servo control sketch
├── ml-model/
│   └── hybrid_classifier.py     # Camera + YOLO + Gemini bridge
└── web-dashboard/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── App.css
        ├── main.jsx
        └── assets/
            └── logo.png
```

## How to Run

### 1. Arduino Setup

1. Open `arduino/smart_dustbin.ino` in the Arduino IDE.
2. Connect the servo signal wire to **pin 9**.
3. Select your board (Arduino Uno) and port.
4. Upload the sketch.

### 2. ML Classifier

```bash
cd ml-model

# Install dependencies
pip install opencv-python pillow ultralytics pyserial google-genai

# Place your trained model file (best.torchscript) in this folder

# Set your Gemini API key in hybrid_classifier.py
# CLOUD_API_KEY = "your-key-here"

# Update SERIAL_PORT to match your Arduino port
# Linux:   /dev/ttyACM0
# Windows: COM3 (or similar)
# macOS:   /dev/cu.usbmodem*

# Run
python hybrid_classifier.py
```

Press `q` to quit the camera feed.

### 3. Web Dashboard

```bash
cd web-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser. Use the ☀️/🌙 button to toggle between dark and light mode.

## How It Works

1. The camera captures a frame and sends it to the **local YOLO model**.
2. If the model detects an item with **≥85% confidence**, it acts immediately without calling the cloud.
3. If confidence is **below 85%** (but above 50%), the frame is sent to the **Gemini API** for a second opinion. The frame is also saved locally for future model retraining.
4. The final classification (`B` or `N`) is sent to the **Arduino** over serial.
5. The Arduino tilts the servo to sort the item into the correct bin compartment, then returns to center.
