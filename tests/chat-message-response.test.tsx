// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMessage, ChatMessageAuthor, ChatMessageCopy } from "@zeron/ui/chat-message";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("ChatMessage response composition", () => {
  it("keeps response identity separate from actions without forwarding slot props to the DOM", () => {
    const { container, rerender } = render(<ChatMessage from="assistant" header={<ChatMessageAuthor model="Model" provider="Provider" />} actionsVisibility="always" actions={<button type="button">Action</button>}>Reply</ChatMessage>);
    const author=screen.getByText("Model").closest('[data-slot="chat-message-author"]')!;
    expect(author.contains(screen.getByText("Provider"))).toBe(true);
    expect(author.compareDocumentPosition(screen.getByText("Reply")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const footer=screen.getByRole("button", { name: "Action" }).closest('[data-slot="chat-message-footer"]')!;
    expect(footer.contains(author)).toBe(false);
    expect(footer.classList.contains("opacity-0")).toBe(false);
    expect(container.querySelector('[data-slot="chat-message"]')?.hasAttribute("header")).toBe(false);
    expect(container.querySelector('[data-slot="chat-message"]')?.hasAttribute("actionsvisibility")).toBe(false);
    rerender(<ChatMessageAuthor />);
    expect(container.innerHTML).toBe("");
  });

  it("reports failed and successful copies of the original source", async () => {
    const writeText=vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
    render(<ChatMessageCopy text="raw **source**" labels={{copy:"Copy",copied:"Done",copyFailed:"Failed"}} />);
    fireEvent.click(screen.getByRole("button",{name:"Copy"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toBe("Failed"));
    fireEvent.click(screen.getByRole("button",{name:"Copy"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toBe("Done"));
    expect(writeText).toHaveBeenLastCalledWith("raw **source**");
  });

  it("ignores an outstanding copy result when the source changes", async () => {
    let resolveCopy!:()=>void;
    const writeText=vi.fn(()=>new Promise<void>((resolve)=>{resolveCopy=resolve;}));
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
    const {rerender}=render(<ChatMessageCopy text="before" />);
    fireEvent.click(screen.getByRole("button",{name:"Copy message"}));
    rerender(<ChatMessageCopy text="after" />);
    await act(async()=>resolveCopy());
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
