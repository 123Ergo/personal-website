"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-black/40 backdrop-blur-sm rounded-2xl border border-white/5 mx-4">
                    <div className="w-12 h-12 mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <span className="text-red-500 text-xl">!</span>
                    </div>
                    <h2 className="text-xl font-mono text-white mb-2 uppercase tracking-tight">Something went wrong</h2>
                    <p className="text-neutral-500 text-sm font-mono max-w-md mb-8">
                        The Digital Twin encountered an unexpected error. This usually happens when the connection is unstable.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-mono text-xs transition-all tracking-widest uppercase hover:border-white/20"
                    >
                        Retry Connection
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
