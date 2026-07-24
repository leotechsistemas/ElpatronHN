import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('[ErrorBoundary]', error, info.componentStack); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-cyber-bg text-text p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="font-orbitron text-lg font-bold text-red-400 mb-2">Error Interno</h2>
            <p className="text-textD text-sm mb-4">{this.state.error?.message || 'Ocurrió un error inesperado.'}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-5 py-2.5 bg-cyber-purple/20 text-cyber-cyan border border-cyber-purple/30 rounded-lg text-xs font-bold cursor-pointer hover:bg-cyber-purple/30 transition-all">
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
