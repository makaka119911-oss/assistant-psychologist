import { Audio } from "expo-av";
export type MeterCallback = (level: number) => void;

let recording: Audio.Recording | null = null;
let meterInterval: ReturnType<typeof setInterval> | null = null;

export async function prepareAudioSession(): Promise<void> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) {
    throw new Error("Нет доступа к микрофону");
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export async function startRecording(onMeter?: MeterCallback): Promise<void> {
  await prepareAudioSession();
  const { recording: rec } = await Audio.Recording.createAsync(
    {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    },
    undefined,
    120,
  );
  recording = rec;

  if (meterInterval) clearInterval(meterInterval);
  meterInterval = setInterval(async () => {
    if (!recording || !onMeter) return;
    try {
      const status = await recording.getStatusAsync();
      if (status.isRecording && status.metering !== undefined) {
        const db = status.metering;
        const norm = Math.min(1, Math.max(0, (db + 60) / 60));
        onMeter(norm);
      }
    } catch {
      /* ignore */
    }
  }, 100);
}

export async function pauseRecording(): Promise<void> {
  if (recording) await recording.pauseAsync();
}

export async function resumeRecording(): Promise<void> {
  if (recording) await recording.startAsync();
}

export async function stopRecording(): Promise<string | null> {
  if (meterInterval) {
    clearInterval(meterInterval);
    meterInterval = null;
  }
  if (!recording) return null;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  return uri;
}

export function isRecordingActive(): boolean {
  return !!recording;
}
