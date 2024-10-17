import React, { useState, useRef } from 'react';
import { Upload, Camera, Palette, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const colorRecommendations = {
  warm: {
    good: [
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Golden Yellow', hex: '#FFD700' },
      { name: 'Orange-Red', hex: '#FF4500' },
      { name: 'Warm Green', hex: '#98BC5B' },
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Brown', hex: '#A0522D' },
      { name: 'Copper', hex: '#B87333' }
    ],
    avoid: [
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Blue-Red', hex: '#9B2D30' },
      { name: 'Electric Blue', hex: '#00FFFF' }
    ]
  },
  cool: {
    good: [
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Blue-Red', hex: '#9B2D30' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Pink', hex: '#FF69B4' },
      { name: 'Silver', hex: '#C0C0C0' }
    ],
    avoid: [
      { name: 'Orange', hex: '#FFA500' },
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Brown', hex: '#A0522D' },
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Warm Green', hex: '#98BC5B' }
    ]
  },
  neutral: {
    good: [
      { name: 'Navy', hex: '#000080' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Green', hex: '#008000' }
    ],
    avoid: [
      { name: 'Neon Green', hex: '#39FF14' },
      { name: 'Neon Pink', hex: '#FF6EC7' },
      { name: 'Neon Yellow', hex: '#FFFF00' }
    ]
  }
};

const undertoneRanges = {
  warm: { rMin: 1.4, rMax: 2.0 },
  cool: { rMin: 0.8, rMax: 1.3 }
};

const undertoneEducation = {
  warm: {
    explanation: "Your skin has warm undertones, which means your skin has golden, peachy, or yellow hints. The recommended colors complement your natural warmth by either harmonizing with it (earth tones) or creating a balanced contrast (specific cool tones). Warm-toned individuals often have golden, brown, or hazel eyes, and their veins appear greenish on their wrists."
  },
  cool: {
    explanation: "Your skin has cool undertones, characterized by pink, red, or blue hints beneath the surface. The suggested colors work with your natural coloring by either enhancing your cool tones (jewel tones) or providing flattering contrast. Cool-toned individuals often have blue, gray, or deep brown eyes, and their veins appear bluish or purple on their wrists."
  },
  neutral: {
    explanation: "Your skin has neutral undertones, meaning you have a balanced mix of warm and cool elements. This versatile undertone allows you to wear a broad spectrum of colors successfully. The key is to focus on the intensity of colors rather than their warmth or coolness. Neutral-toned individuals often can't clearly determine if their veins appear more green or blue."
  }
};

const ColorSwatch = ({ color, name }) => (
  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
       style={{ 
         backgroundColor: color === '#FFFFFF' ? '#F8F9FA' : 'white',
         border: color === '#FFFFFF' ? '1px solid #E9ECEF' : 'none'
       }}>
    <div 
      className="w-4 h-4 rounded-full shadow-sm" 
      style={{ 
        backgroundColor: color,
        border: color === '#FFFFFF' ? '1px solid #E9ECEF' : 'none'
      }}
    />
    <span className="text-gray-700">{name}</span>
  </div>
);

export default function SkinToneAnalyzer() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [undertoneResult, setUndertoneResult] = useState(null);
  const canvasRef = useRef(null);

  const isSkinTone = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0, s = 0, v = max / 255;
    
    if (max === 0) {
      return false;
    }
    
    s = delta / max;
    
    if (delta === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    
    h = h * 60;
    if (h < 0) h += 360;
    
    return (h >= 0 && h <= 50) && (s >= 0.1 && s <= 0.6) && (v >= 0.2 && v <= 0.95);
  };

  const determineUndertone = (rToGRatio) => {
    if (rToGRatio >= undertoneRanges.warm.rMin && rToGRatio <= undertoneRanges.warm.rMax) {
      return 'warm';
    } else if (rToGRatio >= undertoneRanges.cool.rMin && rToGRatio <= undertoneRanges.cool.rMax) {
      return 'cool';
    } else {
      return 'neutral';
    }
  };

  const analyzeSkinTone = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalPixels = 0;
        let totalR = 0, totalG = 0, totalB = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (isSkinTone(r, g, b)) {
            totalR += r;
            totalG += g;
            totalB += b;
            totalPixels++;
          }
        }
        
        const avgR = totalR / totalPixels;
        const avgG = totalG / totalPixels;
        
        const rToG = avgR / avgG;
        const undertone = determineUndertone(rToG);
        
        resolve(undertone);
      };
      img.src = imageUrl;
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setSelectedImage(reader.result);
        setAnalyzing(true);
        try {
          const undertone = await analyzeSkinTone(reader.result);
          setUndertoneResult(undertone);
          setResults(colorRecommendations[undertone]);
        } catch (error) {
          console.error('Error analyzing skin tone:', error);
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-md mx-auto space-y-4">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Skin Tone Color Matcher</h1>
          <p className="text-gray-600">Upload a selfie to get personalized color recommendations</p>
        </header>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full aspect-square bg-gray-100 rounded-lg relative overflow-hidden">
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt="Uploaded" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Camera size={48} />
                    <p className="mt-2">No image uploaded</p>
                  </div>
                )}
              </div>

              <label className="w-full">
                <div className="bg-blue-500 text-white rounded-lg p-3 text-center cursor-pointer hover:bg-blue-600 transition flex items-center justify-center gap-2">
                  <Upload size={20} />
                  Upload Photo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {analyzing && (
          <Alert>
            <AlertDescription className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              Analyzing your skin tone...
            </AlertDescription>
          </Alert>
        )}

        {results && undertoneResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="text-blue-500" />
                Your Color Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {undertoneEducation[undertoneResult].explanation}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-green-600 mb-2">Colors that look great on you:</h3>
                  <div className="flex flex-col gap-2 mb-3">
                    {results.good.map((color, index) => (
                      <ColorSwatch key={index} color={color.hex} name={color.name} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-red-600 mb-2">Colors to avoid:</h3>
                  <div className="flex flex-col gap-2">
                    {results.avoid.map((color, index) => (
                      <ColorSwatch key={index} color={color.hex} name={color.name} />
                    ))}
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Pro Tips:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                    <li>Take photos in natural daylight for the most accurate analysis</li>
                    <li>These are guidelines, not strict rules - trust what makes you feel confident</li>
                    <li>Consider the intensity of the colors as well as their undertone</li>
                    <li>Try different shades within the recommended color families</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
