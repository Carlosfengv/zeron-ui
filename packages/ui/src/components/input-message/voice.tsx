"use client";

import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, MotionConfigContext, useMotionValue, type MotionValue } from "motion/react";
import { spring } from "#system/springs";
import { cn } from "#system/utils";

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => BrowserSpeechRecognition;
type VoicePhase = "idle" | "starting" | "listening" | "finishing";
type VoiceError = "permission" | "microphone" | "noSpeech" | "noTranscript" | "noMatch" | "network" | "service" | "language" | "failed";

const english = {
  start: "Start voice input",
  stop: "Stop recording",
  cancelHint: "Esc to cancel",
  starting: "Connecting microphone…",
  listening: "Listening…",
  finishing: "Transcribing…",
  permission: "Allow microphone access to use voice input.",
  microphone: "Microphone unavailable. Check your audio input.",
  noSpeech: "The browser didn’t detect speech. Check your microphone and try again.",
  noTranscript: "The browser returned no transcript. Try speaking again.",
  noMatch: "The browser detected sound and returned no transcript. Try speaking again.",
  network: "Speech recognition lost its connection. Try again.",
  service: "The speech recognition service is unavailable in this browser.",
  language: "The browser’s speech recognition service doesn’t support this language.",
  failed: "Voice input couldn’t finish. Try again.",
};

const chinese: typeof english = {
  start: "开始语音输入",
  stop: "停止录音",
  cancelHint: "Esc 取消录音",
  starting: "正在连接麦克风…",
  listening: "正在聆听…",
  finishing: "正在转写…",
  permission: "请允许访问麦克风后再使用语音输入。",
  microphone: "麦克风不可用，请检查音频输入。",
  noSpeech: "浏览器未检测到语音，请检查麦克风后重试。",
  noTranscript: "浏览器未返回转写文字，请再说一次。",
  noMatch: "浏览器检测到了声音，未能转写为文字，请再说一次。",
  network: "语音识别连接中断，请重试。",
  service: "当前浏览器的语音识别服务不可用。",
  language: "当前浏览器的语音识别服务不支持所选语言。",
  failed: "语音输入未完成，请重试。",
};

const idle: { phase: VoicePhase; transcript: string; startedAt: number | null; error: VoiceError | null } = {
  phase: "idle",
  transcript: "",
  startedAt: null,
  error: null,
};
const finishTimeout = 5000;
const motionPreference = "(prefers-reduced-motion: reduce)";
const unspacedScript = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}";
const startsUnspaced = new RegExp(`^[${unspacedScript}]`, "u");
const endsUnspaced = new RegExp(`[${unspacedScript}，。！？、：；…）】」』]$`, "u");

function subscribeToMotionPreference(callback: () => void) {
  const media = window.matchMedia(motionPreference);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readMotionPreference() { return window.matchMedia(motionPreference).matches; }
function serverMotionPreference() { return false; }

function useComposerReducedMotion() {
  const { reducedMotion } = useContext(MotionConfigContext);
  const preference = useSyncExternalStore(subscribeToMotionPreference, readMotionPreference, serverMotionPreference);
  return reducedMotion === "always" || preference;
}

function getRecognition() {
  const browser = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function getVoiceError(code: string): VoiceError {
  switch (code) {
    case "not-allowed":
      return "permission";
    case "audio-capture":
      return "microphone";
    case "no-speech":
      return "noSpeech";
    case "network":
      return "network";
    case "service-not-allowed":
      return "service";
    case "language-not-supported":
      return "language";
    default:
      return "failed";
  }
}

function appendVoiceText(draft: string, transcript: string, maxLength?: number) {
  if (!transcript) return draft;
  const needsSpace = draft.length > 0 && !/\s$/u.test(draft) && !/^[,.;:!?，。！？、：；…]/u.test(transcript)
    && !(endsUnspaced.test(draft) && startsUnspaced.test(transcript));
  const value = `${draft}${needsSpace ? " " : ""}${transcript}`;
  if (maxLength == null || maxLength < 0) return value;
  const limit = Math.max(draft.length, maxLength);
  return value.length <= limit ? value : draft + value.slice(draft.length, limit).replace(/[\uD800-\uDBFF]$/u, "").trimEnd();
}

function createVoiceHeightMeter() {
  let previousTime: number | undefined;
  let envelope = 0;
  let baseline = 0;
  let density = 0;
  let cadence = 0;
  let lastOnset = -Infinity;
  let rising = false;
  let voiced = false;

  return (volume: number, time: number) => {
    const elapsed = previousTime == null ? 16 : Math.min(1000, time - previousTime);
    previousTime = time;
    envelope += (volume - envelope) * (1 - Math.exp(-elapsed / 35));
    baseline += (volume - baseline) * (1 - Math.exp(-elapsed / 130));

    // Count envelope attacks instead of peaks in the raw audio cycles.
    cadence *= Math.exp(-elapsed / 850);
    const attack = envelope > 0.12 && envelope - baseline > 0.05;
    if (attack && !rising && time - lastOnset >= 100) {
      cadence = Math.min(1, cadence + 0.28);
      lastOnset = time;
    }
    rising = attack;

    voiced = envelope > (voiced ? 0.065 : 0.1);
    density += (Number(voiced) - density) * (1 - Math.exp(-elapsed / 420));
    return envelope * 0.22 + density * 0.4 + cadence * 0.38;
  };
}

/** The browser recognizer owns permission and transcription. The visual meter
 * only taps the microphone after its origin-level permission is granted. */
function startVoiceMeter(level: MotionValue<number>) {
  let disposed = false;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let frame: number;

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close().catch(() => {});
  }

  async function connect() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.permissions || typeof AudioContext === "undefined") return;
    const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
    if (disposed || permission.state !== "granted") return;

    const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (disposed) {
      audio.getTracks().forEach((track) => track.stop());
      return;
    }

    stream = audio;
    context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    await context.resume();
    if (disposed) return;

    const samples = new Uint8Array(analyser.fftSize);
    const measureHeight = createVoiceHeightMeter();
    function update(time: number) {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
      const volume = Math.min(1, Math.sqrt(energy / samples.length) * 7);
      level.set(measureHeight(volume, time));
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
  }

  void connect().catch(dispose);
  return dispose;
}

interface VoiceSession {
  draft: string;
  stop: () => void;
  stopMeter: () => void;
  dispose: (abort: boolean) => void;
}

function useInputMessageVoice({
  enabled,
  disabled,
  draft,
  locale,
  language,
  reduceMotion,
  onFinish,
}: {
  enabled: boolean;
  disabled?: boolean;
  draft: string;
  locale?: string;
  language?: string;
  reduceMotion: boolean;
  onFinish: (transcript: string) => void;
}) {
  const level = useMotionValue(0);
  const [environment, setEnvironment] = useState<{ supported: boolean; language: string }>();
  const [state, setState] = useState(idle);
  const sessionRef = useRef<VoiceSession | null>(null);
  const onFinishRef = useRef(onFinish);
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => {
    if (!enabled) return;
    setEnvironment({
      supported: window.isSecureContext !== false && Boolean(getRecognition()),
      language: document.documentElement.lang || navigator.language,
    });
  }, [enabled]);

  const disposeSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    session?.dispose(true);
  }, []);

  const cancel = useCallback(() => {
    disposeSession();
    setState(idle);
  }, [disposeSession]);

  useLayoutEffect(() => {
    onFinishRef.current = onFinish;
    reduceMotionRef.current = reduceMotion;
    const session = sessionRef.current;
    if (session && (!enabled || disabled || session.draft !== draft)) cancel();
    else if (reduceMotion) session?.stopMeter();
  }, [cancel, disabled, draft, enabled, onFinish, reduceMotion]);

  useLayoutEffect(() => disposeSession, [disposeSession]);

  const supported = enabled && Boolean(environment?.supported);
  const uiLanguage = locale || environment?.language || "en";
  const labels = /^zh(?:-|$)/i.test(uiLanguage) ? chinese : english;

  function start() {
    if (!supported || disabled || sessionRef.current) return;
    const Recognition = getRecognition();
    if (!Recognition) return;

    let recognition: BrowserSpeechRecognition;
    try {
      recognition = new Recognition();
    } catch {
      setState({ ...idle, error: "failed" });
      return;
    }

    let transcript = "";
    let started = false;
    let finishing = false;
    let detectedSound = false;
    let timeout: number | undefined;
    let releaseMeter: (() => void) | undefined;
    const isCurrent = () => sessionRef.current === session;

    function stopMeter() {
      releaseMeter?.();
      level.set(0);
    }

    function settle(error?: VoiceError, abort = false) {
      if (!isCurrent()) return;
      sessionRef.current = null;
      session.dispose(abort);
      const failure = error ?? (transcript ? null : detectedSound ? "noMatch" : "noTranscript");
      setState({ ...idle, error: failure });
      onFinishRef.current(error ? "" : transcript);
    }

    function beginFinishing() {
      if (!isCurrent() || finishing) return;
      finishing = true;
      stopMeter();
      setState((current) => ({ ...current, phase: "finishing" }));
      timeout = window.setTimeout(() => settle(undefined, true), finishTimeout);
    }

    const session: VoiceSession = {
      draft,
      stopMeter,
      stop: () => {
        if (!started || finishing) return;
        beginFinishing();
        try {
          recognition.stop();
        } catch {
          settle("failed", true);
        }
      },
      dispose: (abort) => {
        window.clearTimeout(timeout);
        stopMeter();
        if (abort) {
          try {
            recognition.abort();
          } catch {
            // The browser may have already closed the session.
          }
        }
      },
    };

    recognition.lang = language || uiLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onaudiostart = () => {
      if (!isCurrent() || finishing || started) return;
      started = true;
      const startedAt = performance.now();
      setState((current) => ({ ...current, phase: "listening", startedAt }));
      if (!reduceMotionRef.current) releaseMeter = startVoiceMeter(level);
    };
    recognition.onsoundstart = () => {
      if (!isCurrent()) return;
      detectedSound = true;
      if (!finishing && !reduceMotionRef.current) level.set(0.4);
    };
    recognition.onspeechstart = () => { if (isCurrent()) detectedSound = true; };
    recognition.onsoundend = () => {
      if (isCurrent() && !finishing) level.set(0);
    };
    recognition.onaudioend = beginFinishing;
    recognition.onresult = ({ results }) => {
      if (!isCurrent()) return;
      // Each event includes the cumulative final results and current interim
      // hypothesis. Rebuild the preview so revised words never get duplicated.
      const next = Array.from(results, (part) => part[0]?.transcript ?? "").join("").trim();
      if (next === transcript) return;
      transcript = next;
      setState((current) => ({ ...current, transcript: next }));
    };
    recognition.onerror = ({ error }) => {
      if (error === "no-speech" && transcript) {
        settle(undefined, true);
        return;
      }
      settle(error === "no-speech" && detectedSound ? "noMatch" : getVoiceError(error), true);
    };
    recognition.onend = () => settle();

    sessionRef.current = session;
    setState({ ...idle, phase: "starting" });
    try {
      recognition.start();
    } catch {
      settle("failed", true);
    }
  }

  return {
    ...state,
    active: state.phase !== "idle",
    supported,
    labels,
    level,
    start,
    stop: () => sessionRef.current?.stop(),
    cancel,
    clearError: () => {
      if (state.error) setState(idle);
    },
  };
}

function VoiceTimer({ startedAt }: { startedAt: number }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.floor((performance.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  return <span className="shrink-0 tabular-nums text-fg-subtle">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}

function InputMessageVoiceStatus({
  voice,
  reduceMotion,
  compact,
}: {
  voice: ReturnType<typeof useInputMessageVoice>;
  reduceMotion: boolean;
  compact: boolean;
}) {
  const { active, error, phase, labels, startedAt } = voice;
  const message = error ? labels[error] : phase === "idle" ? "" : labels[phase];

  return (
    <>
      <span className="sr-only" role="status" aria-atomic="true">{message}</span>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            data-slot="input-message-voice-status"
            aria-hidden="true"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            transition={spring.fast}
            className={cn(
              "pointer-events-none absolute flex h-6 items-center gap-1.5 pe-1 text-label text-fg-subtle",
              compact ? "end-1 top-1.5" : "end-0 top-0",
            )}
          >
            <span className="size-1.5 rounded-full bg-fg-default" />
            {phase === "finishing" ? message : startedAt == null ? "0:00" : <VoiceTimer startedAt={startedAt} />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { appendVoiceText, createVoiceHeightMeter, InputMessageVoiceStatus, useComposerReducedMotion, useInputMessageVoice };
