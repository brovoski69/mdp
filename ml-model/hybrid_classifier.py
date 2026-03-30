import os
import cv2
import serial
import time
import warnings
from PIL import Image
from ultralytics import YOLO
from google import genai # Cloud Model Library

# 1. --- SILENCE SYSTEM WARNINGS ---
warnings.filterwarnings("ignore", category=UserWarning)

# 2. --- CORE CONFIGURATION ---
# Replace with your actual key
CLOUD_API_KEY = "API_KEY_HERE" 
LOCAL_MODEL_PATH = 'best.torchscript' # Our local Bio/Non-Bio/Empty model

# Threshold Logic
LOCAL_CONF_THRESHOLD = 0.85  # 85% requirement to act locally
WAKE_THRESHOLD = 0.50       # Min confidence to even consider it an item

# Hardware & Cooldowns
SERIAL_PORT = '/dev/ttyACM0'
BAUD_RATE = 9600
COOLDOWN_TIME = 4.0          # Seconds to wait after sorting

# Dataset Harvest Paths
BASE_SAVE_PATH = "./auto_dataset"
FOLDERS = ["bio", "non_bio", "uncertain"]

# 3. --- DIRECTORY & HARDWARE SETUP ---
# Create harvesting folders if they don't exist
for folder in FOLDERS:
    os.makedirs(os.path.join(BASE_SAVE_PATH, folder), exist_ok=True)

print("[SYSTEM] Initializing Expert Cloud Model...")
cloud_client = genai.Client(api_key=CLOUD_API_KEY)

print("[SYSTEM] Loading Student Local Model...")
local_model = YOLO(LOCAL_MODEL_PATH, task='classify')

try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2) # Allow Arduino to reboot
    print(f"[SYSTEM] Connected to Arduino on {SERIAL_PORT}")
except Exception as e:
    print(f"[ERROR] Serial Failure: {e}")
    exit()

# Initialize Camera
cap = cv2.VideoCapture(4)
last_action_time = 0

print("\n--- HYBRID BIN ACTIVE ---")
print("Press 'q' to shut down.")

# 4. --- MAIN OPERATIONAL LOOP ---
while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    display_frame = frame.copy()

    # Check if we are in a cooldown period (Servo is moving or bin is resetting)
    if current_time - last_action_time > COOLDOWN_TIME:
        
        # --- STEP 1: LOCAL STUDENT INFERENCE ---
        # We run the local model first to check for "Empty" or "Item"
        results = local_model(frame, verbose=False)
        top_id = int(results[0].probs.top1)
        local_conf = results[0].probs.top1conf.item()
        
        # Assume mapping: 1 = Empty, 2 = Item (or specific Bio/Non-Bio IDs)
        # For this version, we treat ID 2 as the generic "Item Detected"
        
        if top_id == 1: # Bin is empty
            cv2.circle(display_frame, (30, 30), 10, (0, 255, 0), -1) # Green Dot
        
        elif top_id == 2 and local_conf > WAKE_THRESHOLD:
            # --- STEP 2: ITEM DETECTED - LOCKING ON ---
            print(f"[LOCAL] Item detected (Conf: {local_conf:.2f})")
            
            # Start a 2-second visual countdown so user can move hand
            wait_start = time.time()
            while time.time() - wait_start < 2.0:
                ret, frame = cap.read()
                if not ret: break
                display_frame = frame.copy()
                cv2.putText(display_frame, "LOCKING ON... MOVE HAND!", (10, 40), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
                cv2.imshow('Smart Dustbin Feed', display_frame)
                cv2.waitKey(1)

            # --- STEP 3: THE HYBRID REDUNDANCY LOGIC ---
            # If the local model is super confident, we skip the cloud to save money/latency
            if local_conf >= LOCAL_CONF_THRESHOLD:
                print(f"[DECISION] Local confidence high. Acting on local brain.")
                # Logic depends on your local model's specific classes
                # (e.g., if local model also classifies Bio/Non-Bio)
                final_choice = "B" # Placeholder for local decision
            
            else:
                # --- STEP 4: CLOUD FALLBACK & DATA HARVESTING ---
                print(f"[DECISION] Confidence low ({local_conf:.2f}). Consulting Cloud Expert...")
                cv2.circle(display_frame, (30, 30), 10, (0, 255, 255), -1) # Yellow Dot
                cv2.imshow('Smart Dustbin Feed', display_frame)
                cv2.waitKey(1)

                # Prep image for Cloud Expert
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)

                prompt = "Categorize item as 'B' for biodegradable or 'N' for non-biodegradable. Return ONE letter."

                try:
                    response = cloud_client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[prompt, pil_img]
                    )
                    final_choice = response.text.strip().upper()

                    # --- STEP 5: AUTO-DATASET HARVESTING ---
                    # We save this frame for future training because the local model was unsure
                    timestamp = int(time.time())
                    label_dir = "bio" if 'B' in final_choice else "non_bio"
                    save_path = f"{BASE_SAVE_PATH}/{label_dir}/harvest_{timestamp}.jpg"
                    cv2.imwrite(save_path, frame)
                    print(f"[HARVEST] Image saved to {label_dir}/ for training.")

                except Exception as e:
                    print(f"[ERROR] Cloud API failure: {e}")
                    final_choice = "NONE"

            # --- STEP 6: ARDUINO COMMAND ---
            if 'B' in final_choice:
                print("[HARDWARE] Sending command: BIO")
                arduino.write(b'B')
                arduino.flush()
                last_action_time = time.time()
            elif 'N' in final_choice:
                print("[HARDWARE] Sending command: NON-BIO")
                arduino.write(b'N')
                arduino.flush()
                last_action_time = time.time()

    else:
        # Visual Cooldown Indicator (Red Dot)
        cv2.circle(display_frame, (30, 30), 10, (0, 0, 255), -1)
        remaining = round(COOLDOWN_TIME - (current_time - last_action_time), 1)
        cv2.putText(display_frame, f"RESETTING: {remaining}s", (10, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    cv2.imshow('Smart Dustbin Feed', display_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
arduino.close()
