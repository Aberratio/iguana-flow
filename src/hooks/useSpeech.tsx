import { useEffect, useRef, useCallback } from "react";

export const useSpeech = (isAudioEnabled: boolean) => {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      // Prefer Polish voices first, then fall back to English
      const selectedVoice =
        voices.find((voice) => voice.lang.startsWith("pl")) ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.toLowerCase().includes("alex") ||
              voice.name.toLowerCase().includes("tom") ||
              voice.name.toLowerCase().includes("james") ||
              voice.name.toLowerCase().includes("michael") ||
              voice.name.toLowerCase().includes("robert"))
        ) ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            voice.name.toLowerCase().includes("english male")
        ) ||
        voices.find((voice) => voice.lang.startsWith("en"));

      voiceRef.current = selectedVoice || null;
    };

    if (speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      loadVoices();
    }
  }, []);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (!isAudioEnabled || !("speechSynthesis" in window)) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (lang) {
        utterance.lang = lang;
      }

      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      speechSynthesis.speak(utterance);
    },
    [isAudioEnabled]
  );

  return { speak };
};
