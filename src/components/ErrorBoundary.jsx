import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unexpected error caught by ErrorBoundary:", error, info);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-crash-screen">
          <div className="app-crash-content">
            <h1>Something went wrong</h1>
            <p>
              SeeAI ran into an unexpected error. Your camera has been
              released and no data was lost beyond this screen.
            </p>
            <button className="btn-primary" onClick={this.handleReload}>
              Return to home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
