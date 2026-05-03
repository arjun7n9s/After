import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Chat } from "@/screens/Chat";
import { apiService } from "@/services/api";

describe("Chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a question and renders citations", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    vi.spyOn(apiService, "chatBrain").mockResolvedValue({
      content: "The project added local retrieval.",
      mode: "local",
      citations: [
        {
          id: "cite-1",
          file: "overview.md",
          preview: "Local retrieval ranking",
          label: "overview.md:4",
          url: "brain://overview.md#L4",
        },
      ],
    });

    render(<Chat />);

    fireEvent.change(screen.getByRole("textbox", { name: /ask project brain/i }), {
      target: { value: "What changed?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("The project added local retrieval.")).toBeInTheDocument();
    });
    expect(screen.getByText("overview.md:4")).toBeInTheDocument();
    expect(screen.getByText("Local retrieval ranking")).toBeInTheDocument();
  });

  it("can submit a starter prompt", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    const chatSpy = vi.spyOn(apiService, "chatBrain").mockResolvedValue({
      content: "Recent changes were captured.",
      mode: "local",
      citations: [],
    });

    render(<Chat />);

    fireEvent.click(screen.getByRole("button", { name: "What changed most recently?" }));

    await waitFor(() => {
      expect(chatSpy).toHaveBeenCalledWith("What changed most recently?", "local");
    });
  });
});
