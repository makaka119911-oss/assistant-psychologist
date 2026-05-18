/**
 * Запись + распознавание речи. Режим звонка: громкая связь, перезапуск Voice.
 */
import { Audio, AndroidOutputFormat, AndroidAudioEncoder } from "expo-av";
import Voice from "@react-native-voice/voice";
import { ERRORS } from "../utils/constants";
import { hideRecordingNotification, showRecordingNotification } from "./NotificationService";

let recording = null;
let meterCb = null;
let meterTimer = null;
let voiceLines = [];
let onTranscriptCb = null;
let sessionActive = false;
let callMode = false;
let voiceOk = false;

const SPEECH_RECORDING = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: AndroidOutputFormat.MPEG_4,
    audioEncoder: AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: "mpeg4",
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export function isVoiceAvailable() {
  return voiceOk;
}

export function isCallMode() {
  return callMode;
}

async function startVoiceEngine() {
  try {
    await Voice.start("ru-RU");
    voiceOk = true;
  } catch (e) {
    voiceOk = false;
    console.warn("[Voice] start failed", e);
    throw new Error(ERRORS.voiceUnavailable);
  }
}

function bindVoiceHandlers() {
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
    const msg = e.error?.message || "";
    if (msg.includes("No speech") || msg.includes("no speech")) return;
    console.warn("[Voice]", e.error);
    if (sessionActive && callMode) {
      setTimeout(() => {
        Voice.start("ru-RU").catch(() => {});
      }, 400);
    }
  };
  Voice.onSpeechEnd = () => {
    if (sessionActive) {
      setTimeout(() => {
        Voice.start("ru-RU").catch(() => {});
      }, 300);
    }
  };
}

export async function requestPermissions() {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error(ERRORS.micDenied);
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    interruptionModeAndroid: 1,
    interruptionModeIOS: 1,
  });
}

/**
 * @param {function} onMeter
 * @param {function} onTranscript
 * @param {{ callMode?: boolean }} options
 */
export async function startSession(onMeter, onTranscript, options = {}) {
  await requestPermissions();
  onTranscriptCb = onTranscript;
  voiceLines = [];
  sessionActive = true;
  callMode = !!options.callMode;
  voiceOk = false;

  Voice.removeAllListeners();
  bindVoiceHandlers();
  await startVoiceEngine();

  const { recording: rec } = await Audio.Recording.createAsync(SPEECH_RECORDING, undefined, 150);
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

  await showRecordingNotification(callMode);
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
    voiceOk = true;
  } catch {
    /* ignore */
  }
}

export async function stopSession() {
  sessionActive = false;
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
  await hideRecordingNotification();
  const transcript = voiceLines.join("\n");
  onTranscriptCb = null;
  callMode = false;
  return { transcript, audioUri, voiceOk };
}

export function getLiveTranscript() {
  return voiceLines.join("\n");
}
