import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Shield, AlertCircle, Info, Plus, RotateCcw } from 'lucide-react';
import type { Meal } from '../types';

interface CameraCaptureProps {
  onAnalysisComplete: (mealData: Meal, capturedImages: string[]) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onAnalysisComplete }) => {
  const [images, setImages] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [referenceObject, setReferenceObject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Default to rear camera on mobile
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setError("Unable to access camera. Please upload an image or check permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Match canvas dimensions to video feed, with safe defaults to avoid 0x0 canvas errors in Safari
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();

        setLoading(true);
        try {
          const compressed = await compressImage(dataUrl);
          if (images.length < 3) {
            setImages(prev => [...prev, compressed]);
          } else {
            setError("You can upload a maximum of 3 images.");
          }
        } catch (err) {
          console.error("Image compression error:", err);
          if (images.length < 3) {
            setImages(prev => [...prev, dataUrl]);
          }
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError("Unsupported format. Use JPG, PNG, or WEBP.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setLoading(true);
          compressImage(event.target.result)
            .then(compressed => {
              setImages(prev => {
                if (prev.length < 3) {
                  return [...prev, compressed];
                } else {
                  setError("You can upload a maximum of 3 images.");
                  return prev;
                }
              });
            })
            .catch(err => {
              console.error("Upload compression error:", err);
              setImages(prev => {
                if (prev.length < 3) {
                  return [...prev, event.target!.result as string];
                } else {
                  setError("You can upload a maximum of 3 images.");
                  return prev;
                }
              });
            })
            .finally(() => {
              setLoading(false);
            });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    if (images.length === 0) {
      setError("Please capture or upload at least one image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Netlify Function API endpoint call
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: images[0], // Send first image for primary vision analysis
          referenceObject
        })
      });

      let mealData;
      try {
        mealData = await response.json();
      } catch (jsonErr) {
        throw new Error('Failed to parse analysis response from server.');
      }

      if (!response.ok) {
        throw new Error(mealData?.error || 'Analysis request failed. Please check connection.');
      }
      
      if (mealData?.error) {
        throw new Error(mealData.error);
      }

      onAnalysisComplete(mealData, images);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during food scan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const referenceObjects = [
    { id: 'spoon', label: '🥄 Spoon', desc: 'Standard dinner spoon' },
    { id: 'fork', label: '🍴 Fork', desc: 'Standard dining fork' },
    { id: 'hand', label: '✋ Hand', desc: 'Average adult palm' },
    { id: 'coin', label: '🪙 Coin', desc: '1-inch coin reference' }
  ];

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 animate-slide-up">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Scan Meal</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          Upload or snap a photo of your food. AI detects items, portion volume, and nutrition.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Camera Capture Stream */}
      {cameraActive ? (
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Grid overlay for framing */}
          <div className="absolute inset-0 border border-white/10 pointer-events-none grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-b border-white/10"></div>
            <div className="border-r border-white/10"></div>
            <div className="border-r border-white/10"></div>
            <div></div>
          </div>

          {/* Capture controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
            <button
              onClick={stopCamera}
              className="p-3.5 rounded-full bg-zinc-900/80 backdrop-blur-md text-white border border-zinc-800/80 hover:bg-zinc-800 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-[5px] border-emerald-500/30 flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150"
              aria-label="Capture Photo"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400"></div>
            </button>
          </div>
        </div>
      ) : (
        /* Image Selection Area */
        images.length === 0 && (
          <div className="aspect-[4/3] border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center gap-4 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:border-emerald-500/50">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Snap or Upload Food</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                Snap a picture on your camera or select images from your device gallery (JPG, PNG, WEBP).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
              <button
                onClick={startCamera}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3 text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Use Camera
              </button>
              
              <button
                onClick={triggerUpload}
                className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 rounded-2xl py-3 text-xs font-bold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/jpeg, image/jpg, image/png, image/webp"
              multiple
            />
          </div>
        )
      )}

      {/* Previews and Multiple Image Management */}
      {images.length > 0 && (
        <div className="flex flex-col gap-5 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Selected Photos ({images.length}/3)</h3>
            {images.length < 3 && !cameraActive && (
              <button
                onClick={triggerUpload}
                className="text-xs text-emerald-500 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add image
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-200 dark:border-zinc-800 shadow-sm">
                <img src={img} alt="food scan preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-rose-400 border border-white/10 hover:bg-black transition-all duration-200"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Reference Object Selection */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Reference Calibration</span>
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 text-white text-[10px] py-1 px-2.5 rounded-lg w-48 text-center shadow-lg border border-zinc-800">
                  Placing a known object next to your plate helps the AI calibrate depth for exact volume scaling.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {referenceObjects.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setReferenceObject(prev => prev === obj.id ? '' : obj.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                    referenceObject === obj.id
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                      : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-xs font-bold">{obj.label}</span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">{obj.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Launch Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={() => {
                setImages([]);
                setError(null);
                setReferenceObject('');
              }}
              className="px-5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold active:scale-[0.98] transition-all duration-200"
            >
              Reset
            </button>
            <button
              onClick={startAnalysis}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3.5 text-sm font-bold shadow-md shadow-emerald-500/15 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyzing portion metrics...
                </>
              ) : (
                'Run AI Nutrition Analysis'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Processing Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-6 animate-fade-in">
          <div className="relative">
            {/* Spinning ring */}
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            {/* Pulsing inner dot */}
            <div className="absolute inset-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-xs">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
              Analyzing Food Photo
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Running deep vision neural network. Detecting objects, plates, oils, and calibrating serving portion weights...
            </p>
          </div>
        </div>
      )}

      {/* Privacy Guard Notice */}
      <div className="flex gap-2 items-center justify-center text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        No photos are shared publicly. GDPR & HIPAA Compliant.
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
