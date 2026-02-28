/**
 * useVoice — Custom React hook for Speech-to-Text & Text-to-Speech
 * 
 * STT: Uses Web Speech API (SpeechRecognition) — best in Chrome/Edge
 * TTS: Uses Groq Orpheus AI voice via backend endpoint, with browser TTS fallback
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../services/http';

export const useVoice = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const onResultRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(!!SpeechRecognition);

        return () => {
            // Cleanup on unmount
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // ══════════════════════════════════════════════════════════
    // SPEECH-TO-TEXT (STT) — Web Speech API
    // ══════════════════════════════════════════════════════════
    const startRecording = useCallback((onTranscript) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        onResultRef.current = onTranscript;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (onResultRef.current) {
                onResultRef.current(transcript);
            }
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
        }
        setIsRecording(false);
    }, []);

    // ══════════════════════════════════════════════════════════
    // TEXT-TO-SPEECH (TTS) — Groq Orpheus AI Voice
    // Falls back to browser speechSynthesis on error
    // ══════════════════════════════════════════════════════════
    const speak = useCallback(async (text) => {
        if (!text?.trim()) return;

        // Clean text — remove markdown
        const cleanText = text
            .replace(/[*_#`~]/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        // Stop any ongoing speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        setIsSpeaking(true);

        try {
            // Try Groq Orpheus TTS first
            const response = await api.post('/api/agent/tts', { text: cleanText }, {
                responseType: 'blob',
                timeout: 15000,
            });

            const audioBlob = new Blob([response.data], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };
            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audioRef.current = audio;
            await audio.play();
        } catch (err) {
            console.warn('Groq TTS failed, falling back to browser:', err.message);
            // Fallback to browser speechSynthesis
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.05;
                utterance.pitch = 1.0;

                const voices = window.speechSynthesis.getVoices();
                const preferred = voices.find(v =>
                    v.name.includes('Google') && v.lang.startsWith('en')
                ) || voices.find(v =>
                    v.lang.startsWith('en') && v.localService
                ) || voices.find(v =>
                    v.lang.startsWith('en')
                );
                if (preferred) utterance.voice = preferred;

                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);

                window.speechSynthesis.speak(utterance);
            } else {
                setIsSpeaking(false);
            }
        }
    }, []);

    const stopSpeaking = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const toggleVoiceOutput = useCallback(() => {
        setVoiceOutputEnabled(prev => {
            if (prev) {
                // Turning off — stop any playing audio
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
                setIsSpeaking(false);
            }
            return !prev;
        });
    }, []);

    return {
        // STT
        isRecording,
        startRecording,
        stopRecording,
        // TTS
        speak,
        stopSpeaking,
        isSpeaking,
        // Config
        speechSupported,
        voiceOutputEnabled,
        toggleVoiceOutput,
    };
};
