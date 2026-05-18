import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from "@react-native-voice/voice";

export type TranscriptListener = (text: string, isFinal: boolean) => void;

let lines: string[] = [];
let listener: TranscriptListener | null = null;

function bindHandlers() {
  Voice.onSpeechResults = (e: SpeechResultsEvent) => {
    const chunk = e.value?.[0]?.trim();
    if (!chunk || !listener) return;
    listener(chunk, true);
  };
  Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
    const chunk = e.value?.[0]?.trim();
    if (!chunk || !listener) return;
    listener(chunk, false);
  };
  Voice.onSpeechError = (e: SpeechErrorEvent) => {
    if (e.error?.message?.includes("No speech")) return;
    console.warn("[voice]", e.error);
  };
}

export async function isVoiceAvailable(): Promise<boolean> {
  try {
    const available = await Voice.isAvailable();
    return !!available;
  } catch {
    return false;
  }
}

export async function startVoiceRecognition(onLine: TranscriptListener): Promise<void> {
  bindHandlers();
  lines = [];
  listener = (text, isFinal) => {
    if (isFinal) {
      lines.push(text);
      onLine(lines.join("\n"), true);
    } else {
      onLine([...lines, text].join("\n"), false);
    }
  };
  await Voice.start("ru-RU");
}

export async function stopVoiceRecognition(): Promise<string> {
  try {
    await Voice.stop();
    await Voice.destroy();
  } catch {
    /* ignore */
  }
  Voice.removeAllListeners();
  listener = null;
  return lines.join("\n");
}

export async function pauseVoiceRecognition(): Promise<void> {
  try {
    await Voice.stop();
  } catch {
    /* ignore */
  }
}

export async function resumeVoiceRecognition(): Promise<void> {
  if (!listener) return;
  const saved = [...lines];
  const onLine = listener;
  listener = (text, isFinal) => {
    if (isFinal) {
      lines.push(text);
      onLine(lines.join("\n"), true);
    } else {
      onLine([...lines, text].join("\n"), false);
    }
  };
  lines = saved;
  await Voice.start("ru-RU");
}

export function getAccumulatedTranscript(): string {
  return lines.join("\n");
}
