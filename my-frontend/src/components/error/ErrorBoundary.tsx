import React, { Component, ReactNode } from 'react';
import { Alert } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert
          message="Rendering Error"
          description={
            <div>
              <p>Component failed to render:</p>
              <pre style={{ 
                fontSize: 12, 
                background: '#f5f5f5', 
                padding: 8,
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 200
              }}>
                {this.state.error?.message}
              </pre>
            </div>
          }
          type="error"
          showIcon
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;