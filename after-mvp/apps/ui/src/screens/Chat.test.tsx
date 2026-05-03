import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Chat } from "@/screens/Chat";
import { apiService } from "@/services/api";

const idleIbmStatus = {
  enabled: false,
  watsonx: false,
  tts: false,
  cloudant: false,
  nlu: false,
};

describe("Chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a question and renders citations", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    vi.spyOn(apiService, "getIbmStatus").mockResolvedValue(idleIbmStatus);
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

    fireEvent.change(screen.getByLabelText(/ask the project brain/i), {
      target: { value: "What changed?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("The project added local retrieval.")).toBeInTheDocument();
    });
    expect(screen.getByText("overview.md:4")).toBeInTheDocument();
    expect(screen.getByText("overview.md:4").parentElement).toHaveTextContent("Local retrieval ranking");
  });

  it("can submit a starter prompt", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    vi.spyOn(apiService, "getIbmStatus").mockResolvedValue(idleIbmStatus);
    const chatSpy = vi.spyOn(apiService, "chatBrain").mockResolvedValue({
      content: "Recent changes were captured.",
      mode: "local",
      citations: [],
    });

    render(<Chat />);

    fireEvent.click(screen.getByRole("button", { name: "What changed most recently?" }));

    await waitFor(() => {
      expect(chatSpy).toHaveBeenCalledWith("What changed most recently?", "local", expect.any(Function));
    });
  });

  it("defaults to watsonx when IBM Pro chat is available", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    vi.spyOn(apiService, "getIbmStatus").mockResolvedValue({
      enabled: true,
      watsonx: true,
      tts: true,
      cloudant: true,
      nlu: true,
    });
    const chatSpy = vi.spyOn(apiService, "chatBrain").mockResolvedValue({
      content: "Watsonx answered.",
      mode: "watsonx",
      citations: [],
    });

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Watsonx" })).toBeEnabled();
    });

    fireEvent.change(screen.getByLabelText(/ask the project brain/i), {
      target: { value: "What did you capture?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(chatSpy).toHaveBeenCalledWith("What did you capture?", "watsonx", expect.any(Function));
    });
  });

  it("shows thinking progress while a response is pending", async () => {
    vi.spyOn(apiService, "getChatStatus").mockResolvedValue({
      bobAvailable: false,
      defaultMode: "local",
    });
    vi.spyOn(apiService, "getIbmStatus").mockResolvedValue(idleIbmStatus);
    vi.spyOn(apiService, "chatBrain").mockImplementation(
      () =>
        new Promise(() => {
          // Keep the request pending so the loading state stays visible.
        }),
    );

    render(<Chat />);

    fireEvent.change(screen.getByLabelText(/ask the project brain/i), {
      target: { value: "What did you capture?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Local Brain is thinking");
    });
    expect(screen.getByText("Looking for the clearest explanation")).toBeInTheDocument();
    expect(screen.getByText("Request submitted")).toBeInTheDocument();
    expect(screen.getByText("Waiting for local Project Brain response")).toBeInTheDocument();
  });
});
