import { useCallback, useEffect, useRef, useState } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { updateSession } from "@/db/database";
import { analyzeTranscript } from "@/services/deepseek";
import { loadSettings } from "@/services/settings";
import type { DeepSeekResult } from "@/types/session";
import * as audio from "@/services/audio";
import * as voice from "@/services/voice";

export type RecordingPhase = "idle" | "recording" | "paused" | "processing";

const LIVE_INTERVAL_MS = 25_000;
const MIN_CHARS_LIVE = 40;
const MIN_CHARS_GROWTH = 120;

export function useRecordingSession(sessionId: number, clientName: string) {
  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [meter, setMeter] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [liveAnalysis, setLiveAnalysis] = useState<DeepSeekResult | null>(null);
  const [analyzingLive, setAnalyzingLive] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioUriRef = useRef<string | null>(null);
  const partialRef = useRef("");
  const lastResultRef = useRef<DeepSeekResult | null>(null);
  const lastAnalyzedLenRef = useRef(0);
  const analyzingRef = useRef(false);
  const transcriptRef = useRef("");
  const phaseRef = useRef<RecordingPhase>("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveEnabledRef = useRef(true);

  transcriptRef.current = transcript;
  phaseRef.current = phase;

  const runLiveAnalyze = useCallback(async () => {
    if (!liveEnabledRef.current) return;
    const text = (partialRef.current || transcriptRef.current).trim();
    if (text.length < MIN_CHARS_LIVE) return;
    if (analyzingRef.current) return;
    if (phaseRef.current !== "recording") return;

    analyzingRef.current = true;
    setAnalyzingLive(true);
    try {
      const result = await analyzeTranscript(
        text,
        { clientName },
        lastResultRef.current,
      );
      lastResultRef.current = result;
      lastAnalyzedLenRef.current = text.length;
      setLiveAnalysis(result);
      setLastAnalyzedAt(Date.now());
      await updateSession(sessionId, {
        transcript: text,
        analysis: result,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      analyzingRef.current = false;
      setAnalyzingLive(false);
    }
  }, [sessionId, clientName]);

  const clearLiveTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startLiveTimer = useCallback(() => {
    clearLiveTimer();
    if (!liveEnabledRef.current) return;
    timerRef.current = setInterval(() => {
      void runLiveAnalyze();
    }, LIVE_INTERVAL_MS);
  }, [clearLiveTimer, runLiveAnalyze]);

  const start = useCallback(async () => {
    setError(null);
    lastResultRef.current = null;
    lastAnalyzedLenRef.current = 0;
    setLiveAnalysis(null);
    const settings = await loadSettings();
    liveEnabledRef.current = settings.autoAnalyzeLive;
    try {
      await activateKeepAwakeAsync();
      await audio.startRecording(setMeter);
      await voice.startVoiceRecognition((text) => {
        partialRef.current = text;
        setTranscript(text);
        const len = text.trim().length;
        if (
          liveEnabledRef.current &&
          len >= MIN_CHARS_LIVE &&
          len - lastAnalyzedLenRef.current >= MIN_CHARS_GROWTH &&
          !analyzingRef.current &&
          phaseRef.current === "recording"
        ) {
          void runLiveAnalyze();
        }
      });
      setPhase("recording");
      startLiveTimer();
      if (liveEnabledRef.current) {
        setTimeout(() => void runLiveAnalyze(), 8000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }, [runLiveAnalyze, startLiveTimer]);

  const pause = useCallback(async () => {
    clearLiveTimer();
    await audio.pauseRecording();
    await voice.pauseVoiceRecognition();
    setPhase("paused");
  }, [clearLiveTimer]);

  const resume = useCallback(async () => {
    await audio.resumeRecording();
    await voice.resumeVoiceRecognition();
    setPhase("recording");
    startLiveTimer();
    if (liveEnabledRef.current) void runLiveAnalyze();
  }, [startLiveTimer, runLiveAnalyze]);

  const finish = useCallback(async (): Promise<boolean> => {
    clearLiveTimer();
    setPhase("processing");
    deactivateKeepAwake();
    const settings = await loadSettings();
    try {
      const finalVoice = await voice.stopVoiceRecognition();
      const uri = await audio.stopRecording();
      const text = (finalVoice || partialRef.current || transcriptRef.current).trim();
      const endedAt = new Date().toISOString();

      await updateSession(sessionId, {
        transcript: text,
        audioUri: uri || "",
        endedAt,
      });

      if (text.length < 30) {
        await updateSession(sessionId, {
          status: "error",
          errorMessage: "Слишком мало текста для анализа.",
        });
        setError("Мало распознанного текста");
        return false;
      }

      if (settings.autoAnalyzeAfter) {
        const result = await analyzeTranscript(
          text,
          { clientName },
          lastResultRef.current,
        );
        await updateSession(sessionId, {
          analysis: result,
          status: "done",
        });
        setLiveAnalysis(result);
      } else {
        await updateSession(sessionId, { status: "done" });
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await updateSession(sessionId, { status: "error", errorMessage: msg });
      setError(msg);
      return false;
    }
  }, [sessionId, clientName, clearLiveTimer]);

  useEffect(() => () => clearLiveTimer(), [clearLiveTimer]);

  return {
    phase,
    meter,
    transcript,
    liveAnalysis,
    analyzingLive,
    lastAnalyzedAt,
    error,
    start,
    pause,
    resume,
    finish,
    refreshAnalysis: runLiveAnalyze,
  };
}
