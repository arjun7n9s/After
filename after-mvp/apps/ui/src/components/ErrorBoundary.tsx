import { Component, type ErrorInfo, type ReactNode } from "react";

import { RetryPanel } from "@/components/RetryPanel";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  message: string | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    message: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI render failed", error, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <div
          className="min-h-screen p-6"
          style={{ background: "linear-gradient(180deg, var(--cream-1), var(--cream-0))" }}
        >
          <RetryPanel
            message={this.state.message}
            onRetry={() => this.setState({ message: null })}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
