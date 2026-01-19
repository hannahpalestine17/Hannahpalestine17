
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ProductStyle } from './types';
import { INITIAL_PLACEHOLDERS, PRODUCT_STYLES } from './constants';
import { generateId } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import { 
    ThinkingIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    GridIcon,
    CodeIcon
} from './components/Icons';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(PRODUCT_STYLES[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Cycle placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % INITIAL_PLACEHOLDERS.length);
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();
    const styleObj = PRODUCT_STYLES.find(s => s.id === selectedStyleId) || PRODUCT_STYLES[0];

    try {
        const base64Data = await fileToBase64(selectedFile);
        
        const newSession: Session = {
            id: sessionId,
            productImageBase64: base64Data,
            timestamp: baseTime,
            artifacts: [{
                id: `${sessionId}_0`,
                styleName: styleObj.name,
                imageUrl: '',
                status: 'processing'
            }]
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length); 
        setFocusedArtifactIndex(0);

        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
          Edit this product image. 
          Keep the product exactly as it is (no modifications to its shape or branding).
          Generate a professional, high-fidelity background and setting for it based on this style: ${styleObj.prompt}.
          Add realistic shadows, professional studio lighting, and depth of field. 
          The final result should look like a premium advertisement photo.
        `.trim();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: selectedFile.type,
                        },
                    },
                    { text: prompt },
                ],
            },
        });

        let generatedImageUrl = '';
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }

        if (generatedImageUrl) {
            setSessions(prev => prev.map(sess => 
                sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => 
                        art.id === `${sessionId}_0` ? { ...art, imageUrl: generatedImageUrl, status: 'complete' } : art
                    )
                } : sess
            ));
        } else {
            throw new Error("No image generated from AI");
        }

    } catch (e: any) {
        console.error("Error generating product photo:", e);
        // Clean up or set error state
    } finally {
        setIsLoading(false);
    }
  }, [selectedFile, selectedStyleId, isLoading, sessions.length]);

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  return (
    <>
        <div className="creator-credit">
            Foto Produk Generator Pro
        </div>

        <div className="immersive-app">
            <DottedGlowBackground 
                gap={24} 
                radius={1.5} 
                color="rgba(255, 255, 255, 0.02)" 
                glowColor="rgba(255, 255, 255, 0.15)" 
                speedScale={0.5} 
            />

            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                     <div className="empty-content">
                         <h1>Foto Produk</h1>
                         <p>Ubah foto HP jadi showcase katalog premium secara instan.</p>
                         <div className="intro-steps">
                            <div className="step">1. Upload Foto</div>
                            <div className="step">2. Pilih Gaya</div>
                            <div className="step">3. Hasil Instan</div>
                         </div>
                     </div>
                 </div>

                {sessions.map((session, sIndex) => {
                    let positionClass = 'hidden';
                    if (sIndex === currentSessionIndex) positionClass = 'active-session';
                    else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                    else if (sIndex > currentSessionIndex) positionClass = 'future-session';
                    
                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className="artifact-grid single-item-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => (
                                    <ArtifactCard 
                                        key={artifact.id}
                                        artifact={artifact}
                                        isFocused={focusedArtifactIndex === aIndex}
                                        onClick={() => setFocusedArtifactIndex(aIndex)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}>
                        <GridIcon /> Galeri
                    </button>
                    <button onClick={() => {
                        const link = document.createElement('a');
                        link.href = currentSession?.artifacts[focusedArtifactIndex || 0].imageUrl || '';
                        link.download = 'foto-produk-ai.png';
                        link.click();
                    }}>
                        <ArrowUpIcon /> Simpan Foto
                    </button>
                 </div>
            </div>

            <div className="generator-controls-container">
                <div className="style-selector">
                    {PRODUCT_STYLES.map(style => (
                        <button 
                            key={style.id} 
                            className={`style-chip ${selectedStyleId === style.id ? 'active' : ''}`}
                            onClick={() => setSelectedStyleId(style.id)}
                        >
                            <span className="style-icon">{style.icon}</span>
                            <span className="style-name">{style.name}</span>
                        </button>
                    ))}
                </div>

                <div className={`input-wrapper product-input-wrapper ${isLoading ? 'loading' : ''}`}>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    
                    <div className="input-inner-content" onClick={() => fileInputRef.current?.click()}>
                        {previewUrl ? (
                            <div className="file-preview-mini">
                                <img src={previewUrl} alt="Preview" />
                                <span>Ganti Foto</span>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <SparklesIcon />
                                <span>{INITIAL_PLACEHOLDERS[placeholderIndex]}</span>
                            </div>
                        )}
                    </div>

                    <button 
                        className="send-button generate-btn" 
                        onClick={handleGenerate} 
                        disabled={isLoading || !selectedFile}
                    >
                        {isLoading ? <ThinkingIcon /> : <ArrowUpIcon />}
                        <span className="btn-text">{isLoading ? 'Processing...' : 'Generate'}</span>
                    </button>
                </div>
            </div>
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
