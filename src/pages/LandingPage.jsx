import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const FEATURES = [
  {
    title: "Live Camera Vision",
    description:
      "Point your camera at anything and capture a frame the moment you're ready. No setup, just permission and go.",
  },
  {
    title: "Upload Any Image",
    description:
      "Prefer a photo you already have? Upload JPG, PNG, or WEBP files and get the same conversational analysis.",
  },
  {
    title: "Ask Follow-Up Questions",
    description:
      "SeeAI remembers what it's looking at. Ask a question, then ask another — it keeps the same image in context.",
  },
  {
    title: "Multiple Vision Modes",
    description:
      "Switch between Explore, Read, Learn, Analyze, and Assist to change how SeeAI interprets what it sees.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Open the camera or upload an image",
    description: "Grant camera access, or drop in a photo from your device.",
  },
  {
    number: "02",
    title: "Capture the moment",
    description: "Take a frame from your live camera, or confirm your uploaded image.",
  },
  {
    number: "03",
    title: "Ask what you want to know",
    description: '"What am I looking at?" — type any natural question about the image.',
  },
  {
    number: "04",
    title: "Get a real answer",
    description: "SeeAI reads the image and responds conversationally, in plain language.",
  },
];

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <span className="brand-mark">SeeAI</span>
          <Link to="/workspace" className="nav-cta">
            Try SeeAI
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <h1 className="hero-title">
            AI That Understands
            <br />
            What You See.
          </h1>
          <p className="hero-subtitle">
            SeeAI turns your camera or any photo into a conversation. Show it something,
            ask a question, and get a clear, useful answer — instantly.
          </p>
          <div className="hero-actions">
            <Link to="/workspace" className="btn-primary">
              Try SeeAI
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
        </section>

        <section className="features" aria-label="Features">
          <h2 className="section-title">Built to actually understand images</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            {STEPS.map((step) => (
              <div className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="vision-explainer">
          <div className="vision-explainer-content">
            <h2 className="section-title">How SeeAI sees</h2>
            <p>
              SeeAI sends your image to a multimodal AI model capable of interpreting
              visual content alongside natural language. It doesn't just label objects —
              it reads context, layout, and text, then answers your specific question
              about the scene. When the model isn't sure about something, it says so
              instead of guessing with false confidence.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div>
            <span className="brand-mark">SeeAI</span>
            <p className="footer-tagline">AI That Understands What You See.</p>
          </div>
          <p className="privacy-note">
            Your camera is accessed only after you give permission. Captured images are
            sent to an AI service for analysis in order to answer your questions.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
