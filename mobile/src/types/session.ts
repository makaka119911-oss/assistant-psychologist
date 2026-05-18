export type SessionStatus = "recording" | "processing" | "done" | "error";

export interface Anamnesis {
  жалоба_клиента: string;
  длительность_проблемы: string;
  семейное_положение: string;
  дети: string;
  работа: string;
  предыдущий_опыт_терапии: string;
  ключевые_факты: string[];
}

export interface PsychAnalysis {
  эмоциональное_состояние: string;
  основные_паттерны: string[];
  возможные_причины: string[];
  защиты_и_сопротивление: string;
}

export interface TherapistRecommendations {
  на_что_обратить_внимание: string;
  техники_интервенции: string[];
  уточняющие_вопросы: string[];
  зоны_роста: string;
}

export interface SexualAnamnesis {
  сексуальная_ориентация: string;
  партнёр: string;
  удовлетворённость: string;
  травмы_или_страхи: string;
  обращаться_ли_к_сексологу: string;
}

export interface DeepSeekResult {
  anamnesis: Anamnesis;
  психологический_разбор: PsychAnalysis;
  рекомендации_психологу: TherapistRecommendations;
  сексуальный_анамнез: SexualAnamnesis;
  краткое_резюме: string;
}

export interface Session {
  id: number;
  date: string;
  durationMinutes: number;
  transcript: string;
  analysisJson: string | null;
  clientName: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  audioUri: string | null;
  errorMessage: string | null;
}
