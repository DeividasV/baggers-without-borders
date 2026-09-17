"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ChangeRequestErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Change request feature error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="card border border-red-500/30 bg-red-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">
                {this.props.title || "Couldn't load this section"}
              </h2>
              <p className="max-w-xl text-sm text-red-100/85">
                {this.props.message ||
                  "Couldn't load this section. Try again, or go back to the change request list."}
              </p>
              {process.env.NODE_ENV === "development" && this.state.error?.message ? (
                <p className="text-xs text-red-200/80">{this.state.error.message}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href={this.props.backHref || "/admin/changes"}
              className="inline-flex items-center rounded-lg border border-dark-600 bg-dark-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-dark-700"
            >
              {this.props.backLabel || "Back to change requests"}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
