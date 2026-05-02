import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/screens/Dashboard";
import { useAppStore } from "@/stores/app-store";

vi.mock("@/services/api", () => ({
  apiService: {
    generateReadme: vi.fn().mockResolvedValue("# After"),
  },
}));

describe("Dashboard", () => {
  afterEach(() => {
    act(() => {
      useAppStore.setState({ isLoading: false, error: null, toasts: [] });
    });
  });

  it("renders project overview and quick stats", () => {
    render(<Dashboard />);

    expect(screen.getByText("After")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Captures")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate readme/i })).toBeInTheDocument();
  });

  it("shows loading and error states", () => {
    act(() => {
      useAppStore.setState({ isLoading: true });
    });
    const { rerender } = render(<Dashboard />);
    expect(screen.getByLabelText("Loading project data")).toBeInTheDocument();

    act(() => {
      useAppStore.setState({ isLoading: false, error: "No backend" });
    });
    rerender(<Dashboard />);
    expect(screen.getByText("No backend")).toBeInTheDocument();
  });

  it("adds a toast after README generation", async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole("button", { name: /generate readme/i }));

    await waitFor(() => {
      expect(useAppStore.getState().toasts[0]?.title).toBe("README generated");
    });
  });
});
