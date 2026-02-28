/**
 * useVoice — Custom React hook for Speech-to-Text & Text-to-Speech
 * Uses the Web Speech API (SpeechRecognition + SpeechSynthesis)
 * Works best in Chrome/Edge.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export const useVoice = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const onResultRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const hasSynth = 'speechSynthesis' in window;
        setSpeechSupported(!!(SpeechRecognition && hasSynth));
        if (hasSynth) {
            synthRef.current = window.speechSynthesis;
        }

        return () => {
            // Cleanup on unmount
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // ══════════════════════════════════════════════════════════
    // SPEECH-TO-TEXT (STT)
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
    // TEXT-TO-SPEECH (TTS)
    // ══════════════════════════════════════════════════════════
    const speak = useCallback((text) => {
        if (!synthRef.current || !text) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        // Clean the text — remove markdown, excessive whitespace
        const cleanText = text
            .replace(/[*_#`~]/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to pick a good English voice
        const voices = synthRef.current.getVoices();
        const preferred = voices.find(v =>
            v.name.includes('Google') && v.lang.startsWith('en')
        ) || voices.find(v =>
            v.lang.startsWith('en') && v.localService
        ) || voices.find(v =>
            v.lang.startsWith('en')
        );
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const toggleVoiceOutput = useCallback(() => {
        setVoiceOutputEnabled(prev => {
            if (prev && synthRef.current) {
                synthRef.current.cancel();
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
