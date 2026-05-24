import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print("=" * 60)
print("             GEMINI API SRE DIAGNOSTIC TOOL")
print("=" * 60)
print(f"Python Version:  {sys.version}")
print(f"API Key Found:   {bool(api_key)}")

if not api_key:
    print("\nERROR: No GEMINI_API_KEY found in your environment or .env file.")
    print("Please add 'GEMINI_API_KEY=your_key' to your .env file.")
    print("=" * 60)
    sys.exit(1)

print("\nAttempting connection and model catalog listing...")
genai.configure(api_key=api_key)

try:
    models = genai.list_models()
    print("\nSUCCESS! Successfully authenticated with Google API Gateway.")
    print("Your key has access to the following generation models:")
    
    count = 0
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f" - {m.name} (Supported: generateContent)")
            count += 1
            
    if count == 0:
        print("WARNING: Key connected, but no models support 'generateContent'.")
except Exception as e:
    print("\nERROR: Failed to authenticate or list models from Google API Gateway.")
    print(f"Exception details: {e}")
    print("\nCommon SRE Resolution Steps:")
    print("1. Double-check that the GEMINI_API_KEY in your .env file is correct.")
    print("2. Ensure your key does not have IP restrictions or billing blocks.")
    print("3. Check if your network connection requires an outbound HTTP proxy.")

print("=" * 60)
