// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { InputMessage } from "@zeron/ui/input-message";
import { createVoiceHeightMeter } from "../packages/ui/src/components/input-message/voice";
import { findVoiceTextChange } from "../packages/ui/src/components/input-message/voice-effects";

class Recognition {
  static sessions: Recognition[] = [];
  lang = "";
  onstart?: () => void;
  onaudiostart?: () => void;
  onsoundstart?: () => void;
  onresult?: (event: { results: { transcript: string }[][] }) => void;
  onerror?: (event: { error: string }) => void;
  onend?: () => void;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    Recognition.sessions.push(this);
  }

  result(...parts: string[]) {
    this.onresult?.({ results: parts.map((transcript) => [{ transcript }]) });
  }
}

beforeEach(() => {
  Recognition.sessions = [];
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("SpeechRecognition", undefined);
  vi.stubGlobal("webkitSpeechRecognition", Recognition);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function startVoice() {
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  const session = Recognition.sessions.at(-1)!;
  act(() => session.onaudiostart?.());
  return session;
}

it("builds a higher wave for faster and denser speech at the same volume", () => {
  function sampleSpeech(period: number, dutyCycle: number) {
    const measureHeight = createVoiceHeightMeter();
    const heights: number[] = [];
    for (let time = 0; time < 4800; time += 16) {
      const volume = time % period < period * dutyCycle ? 0.72 : 0.014;
      const height = measureHeight(volume, time);
      if (time >= 1600) heights.push(height);
    }
    const average = heights.reduce((sum, height) => sum + height, 0) / heights.length;
    let quietHeight = average;
    for (let time = 4800; time < 7000; time += 16) quietHeight = measureHeight(0.014, time);
    return { average, quietHeight };
  }

  const fast = sampleSpeech(192, 0.5);
  const slow = sampleSpeech(512, 0.5);
  const dense = sampleSpeech(320, 0.75);
  const sparse = sampleSpeech(320, 0.25);
  expect(fast.average - slow.average).toBeGreaterThan(0.08);
  expect(dense.average - sparse.average).toBeGreaterThan(0.1);
  expect(fast.quietHeight).toBeLessThan(0.06);
});

it("targets each new character and skips unchanged text during a transcript revision", () => {
  const original = "请提醒我明早浇花";
  const corrected = "请提醒我明晚浇花✅";
  const extension = findVoiceTextChange(original, `${original}✅`);
  expect(extension.characters.map(({ from, to }) => `${original}✅`.slice(from, to))).toEqual(["✅"]);

  const revision = findVoiceTextChange(corrected, "请提醒我明早浇花✅");
  expect(revision).toEqual({ from: 5, previousTo: 6, to: 6, characters: [{ from: 5, to: 6 }] });

  const next = "Say 👩🏽‍💻你好";
  expect(findVoiceTextChange("Say ", next).characters.map(({ from, to }) => next.slice(from, to)))
    .toEqual(["👩🏽‍💻", "你", "好"]);
});

it("switches the recording animation without restarting the current transcript", () => {
  const onValueChange = vi.fn();
  const { container, rerender } = render(<InputMessage value="Draft" onValueChange={onValueChange} voiceInput />);
  const recognition = startVoice();
  const wave = container.querySelector('[data-slot="input-message-voice-wave"]');
  expect(wave?.getAttribute("data-animation")).toBe("ascii");
  act(() => recognition.result("with a note"));

  rerender(<InputMessage value="Draft" onValueChange={onValueChange} voiceInput={{ animation: "dots" }} />);
  expect(container.querySelector('[data-slot="input-message-voice-wave"]')).toBe(wave);
  expect(wave?.getAttribute("data-animation")).toBe("dots");
  expect(screen.getByRole<HTMLTextAreaElement>("textbox").value).toBe("Draft with a note");
  expect(Recognition.sessions).toEqual([recognition]);
  expect(recognition.abort).not.toHaveBeenCalled();
});

it("adds a microphone before Send and temporarily shows only Stop in the right actions", () => {
  const change = vi.fn();
  const send = vi.fn();
  function Composer() {
    const [draft, setDraft] = useState("Plan a");
    return <InputMessage value={draft} onValueChange={(value) => { change(value); setDraft(value); }} onSend={send}
      leftSlot={<button type="button">Attach</button>} rightSlot={<button type="button">Options</button>}
      voiceInput={{ language: "en-GB" }} />;
  }
  render(<Composer />);

  const editor = screen.getByRole<HTMLTextAreaElement>("textbox");
  const mic = screen.getByRole("button", { name: "Start voice input" });
  const sendButton = screen.getByRole<HTMLButtonElement>("button", { name: "Send" });
  expect(mic.nextElementSibling).toBe(sendButton);
  expect(sendButton.disabled).toBe(false);
  fireEvent.click(mic);
  const [session] = Recognition.sessions;
  act(() => session.onstart?.());
  expect(screen.getByRole("button", { name: "Connecting microphone…" })).toBe(mic);
  act(() => session.onaudiostart?.());
  expect(session.lang).toBe("en-GB");
  expect(editor.readOnly).toBe(true);
  act(() => session.result("train"));
  act(() => session.result("trip", " to London"));
  expect(editor.value).toBe("Plan a trip to London");
  expect(change).not.toHaveBeenCalled();
  fireEvent.keyDown(editor, { key: "Enter" });
  expect(send).not.toHaveBeenCalled();

  expect(screen.getByRole("button", { name: "Stop recording" })).toBe(mic);
  expect(within(mic.parentElement!).getAllByRole("button")).toEqual([mic]);
  expect(screen.getByRole("button", { name: "Attach" })).toBeTruthy();
  fireEvent.click(mic);
  expect(session.stop).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Transcribing…" }).getAttribute("aria-disabled")).toBe("true");
  act(() => {
    session.result("trip", " to London.");
    session.onend?.();
  });
  expect(editor.value).toBe("Plan a trip to London.");
  expect(editor.readOnly).toBe(false);
  expect(change).toHaveBeenCalledExactlyOnceWith("Plan a trip to London.");
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Send" })).toBe(sendButton);
  expect(screen.getByRole("button", { name: "Start voice input" })).toBe(mic);
  expect(screen.getByRole("button", { name: "Options" })).toBeTruthy();
  fireEvent.keyDown(editor, { key: "Enter" });
  expect(send).toHaveBeenCalledExactlyOnceWith("Plan a trip to London.", []);
});

it("discards the voice preview on Escape and ignores late results from the canceled session", () => {
  const change = vi.fn();
  render(<InputMessage value="Keep this draft" onValueChange={change} voiceInput />);
  const session = startVoice();
  act(() => session.result("with dictation"));
  const editor = screen.getByRole<HTMLTextAreaElement>("textbox");
  expect(editor.value).toBe("Keep this draft with dictation");

  fireEvent.keyDown(screen.getByRole("button", { name: "Stop recording" }), { key: "Escape" });
  expect(session.abort).toHaveBeenCalledOnce();
  const next = startVoice();
  act(() => {
    session.result("old words");
    session.onend?.();
  });
  expect(editor.value).toBe("Keep this draft");
  expect(change).not.toHaveBeenCalled();
  act(() => {
    next.result("with fresh text");
    next.onend?.();
  });
  expect(change).toHaveBeenCalledExactlyOnceWith("Keep this draft with fresh text");
});

it("preserves the draft and distinguishes silence from an end without text", () => {
  const change = vi.fn();
  render(<InputMessage value="Keep this draft" onValueChange={change} voiceInput />);
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  act(() => Recognition.sessions[0].onerror?.({ error: "not-allowed" }));
  expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Allow microphone access"))).toBe(true);
  const session = startVoice();
  act(() => session.onend?.());
  expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("browser returned no transcript"))).toBe(true);

  const silent = startVoice();
  act(() => silent.onerror?.({ error: "no-speech" }));
  expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("didn’t detect speech"))).toBe(true);

  const heard = startVoice();
  act(() => {
    heard.onsoundstart?.();
    heard.onend?.();
  });
  expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("detected sound and returned no transcript"))).toBe(true);
  expect(screen.getByRole<HTMLTextAreaElement>("textbox").value).toBe("Keep this draft");
  expect(change).not.toHaveBeenCalled();
});

it("accepts Chinese dictation within the textarea limit", () => {
  const change = vi.fn();
  render(<InputMessage lang="zh-CN" value="第一步。" onValueChange={change} voiceInput textareaProps={{ maxLength: 6 }} />);
  fireEvent.click(screen.getByRole("button", { name: "开始语音输入" }));
  const [session] = Recognition.sessions;
  act(() => {
    session.onaudiostart?.();
    session.result("打开页面");
    session.onend?.();
  });
  expect(session.lang).toBe("zh-CN");
  expect(change).toHaveBeenCalledExactlyOnceWith("第一步。打开");
});

it("closes the microphone when the host replaces the draft or unmounts the composer", () => {
  const change = vi.fn();
  const { rerender, unmount } = render(<InputMessage value="" onValueChange={change} voiceInput />);
  const session = startVoice();
  rerender(<InputMessage value="Next conversation" onValueChange={change} voiceInput />);
  expect(session.abort).toHaveBeenCalledOnce();
  act(() => {
    session.result("old words");
    session.onend?.();
  });
  expect(change).not.toHaveBeenCalled();
  rerender(<InputMessage value="" onValueChange={change} voiceInput />);
  const next = startVoice();
  unmount();
  expect(next.abort).toHaveBeenCalledOnce();
});

it("releases a waveform stream that arrives after canceling", async () => {
  let deliverStream: (stream: MediaStream) => void = () => {};
  const getUserMedia = vi.fn(() => new Promise<MediaStream>((resolve) => { deliverStream = resolve; }));
  const stop = vi.fn();
  vi.stubGlobal("navigator", { language: "en-US", permissions: { query: async () => ({ state: "granted" }) }, mediaDevices: { getUserMedia } });
  vi.stubGlobal("AudioContext", class {});

  render(<InputMessage value="" onValueChange={() => {}} voiceInput />);
  startVoice();
  await waitFor(() => expect(getUserMedia).toHaveBeenCalledExactlyOnceWith({ audio: true }));
  fireEvent.keyDown(screen.getByRole("button", { name: "Stop recording" }), { key: "Escape" });
  await act(async () => deliverStream({ getTracks: () => [{ stop }] } as unknown as MediaStream));
  expect(stop).toHaveBeenCalledOnce();
});

it("keeps text submission available when browser dictation is unsupported", () => {
  vi.stubGlobal("webkitSpeechRecognition", undefined);
  const send = vi.fn();
  render(<InputMessage value="Typed draft" onValueChange={() => {}} onSend={send} voiceInput />);
  expect(screen.queryByRole("button", { name: "Start voice input" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(send).toHaveBeenCalledExactlyOnceWith("Typed draft", []);
});
