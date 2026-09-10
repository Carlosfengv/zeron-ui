// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiGatewaySessionList } from "../packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list";
import {
  aiGatewaySessionListDemoQuery,
  createAiGatewaySessionListDemoData,
} from "../packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-demo-data";

afterEach(cleanup);

describe("AI Gateway Session List behavior", () => {
  it("uses the response snapshot time and disables query controls while refreshing", () => {
    const query = { ...aiGatewaySessionListDemoQuery, pageSize: 10 };
    const data = createAiGatewaySessionListDemoData(query);
    const onQueryChange = vi.fn();
    const { rerender } = render(
      <AiGatewaySessionList
        actions={{ onQueryChange }}
        data={data}
        query={query}
        sidebar={false}
        status="refreshing"
      />,
    );

    expect(screen.getByRole("heading", { name: "Sessions" })).toBeTruthy();
    expect(screen.getByText("5 min. ago")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to next page" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(
      screen.getByRole("textbox", { name: "Search session id or trace name..." }),
    ).toHaveProperty("disabled", true);

    rerender(
      <AiGatewaySessionList
        actions={{ onQueryChange }}
        data={data}
        query={query}
        sidebar={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(onQueryChange).toHaveBeenCalledWith({
      ...query,
      pageIndex: 1,
    });
  });
});
