import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RetryPanel } from "@/components/RetryPanel";

describe("RetryPanel", () => {
  it("renders an error message and calls retry", () => {
    const onRetry = vi.fn();
    render(<RetryPanel message="Backend unavailable" onRetry={onRetry} />);

    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
