import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-2xl text-rose-400 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Algo salió mal</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'Ocurrió un error inesperado al renderizar la aplicación.'}
          </p>
          <Button variant="primary" size="sm" onClick={this.handleReload} className="gap-2">
            <RefreshCw size={14} />
            <span>Recargar Página</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
