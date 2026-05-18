/**
 * Запись аудио (диктофон) + распознавание речи.
 * Запись работает офлайн; распознавание — при наличии движка на устройстве.
 */
import { Audio } from "expo-av";
import Voice from "@react-native-voice/voice";
import { ERRORS } from "../utils/constants";

let recording = null;
let meterCb = null;
let meterTimer = null;
let voiceLines = [];
let onTranscriptCb = null;

export async function requestPermissions() {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error(ERRORS.micDenied);
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
}

/** Старт записи + распознавание */
export async function startSession(onMeter, onTranscript) {
  await requestPermissions();
  onTranscriptCb = onTranscript;
  voiceLines = [];

  Voice.onSpeechResults = (e) => {
    const t = e.value?.[0]?.trim();
    if (!t || !onTranscriptCb) return;
    voiceLines.push(t);
    onTranscriptCb(voiceLines.join("\n"), true);
  };
  Voice.onSpeechPartialResults = (e) => {
    const t = e.value?.[0]?.trim();
    if (!t || !onTranscriptCb) return;
    onTranscriptCb([...voiceLines, t].join("\n"), false);
  };
  Voice.onSpeechError = (e) => {
    if (e.error?.message?.includes("No speech")) return;
    console.warn("[Voice]", e.error);
  };

  try {
    await Voice.start("ru-RU");
  } catch {
    console.warn(ERRORS.voiceUnavailable);
  }

  const { recording: rec } = await Audio.Recording.createAsync(
    { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
    undefined,
    120,
  );
  recording = rec;
  meterCb = onMeter;
  meterTimer = setInterval(async () => {
    if (!recording || !meterCb) return;
    try {
      const st = await recording.getStatusAsync();
      if (st.isRecording && st.metering != null) {
        meterCb(Math.min(1, Math.max(0, (st.metering + 60) / 60)));
      }
    } catch {
      /* ignore */
    }
  }, 100);
}

export async function pauseSession() {
  if (recording) await recording.pauseAsync();
  try {
    await Voice.stop();
  } catch {
    /* ignore */
  }
}

export async function resumeSession() {
  if (recording) await recording.startAsync();
  try {
    await Voice.start("ru-RU");
  } catch {
    /* ignore */
  }
}

/** Стоп: возвращает { transcript, audioUri } */
export async function stopSession() {
  if (meterTimer) {
    clearInterval(meterTimer);
    meterTimer = null;
  }
  let audioUri = null;
  if (recording) {
    await recording.stopAndUnloadAsync();
    audioUri = recording.getURI();
    recording = null;
  }
  try {
    await Voice.stop();
    await Voice.destroy();
  } catch {
    /* ignore */
  }
  Voice.removeAllListeners();
  const transcript = voiceLines.join("\n");
  onTranscriptCb = null;
  return { transcript, audioUri };
}

export function getLiveTranscript() {
  return voiceLines.join("\n");
}
