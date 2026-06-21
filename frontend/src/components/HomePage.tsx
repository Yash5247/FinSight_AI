import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileSearch,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import AnimatedBackground from "./ui/AnimatedBackground";
import GradientText from "./ui/GradientText";
import SpotlightCard from "./ui/SpotlightCard";
import FadeIn from "./ui/FadeIn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const FEATURES = [
  {
    icon: Upload,
    title: "Smart PDF Ingestion",
    description:
      "Upload annual reports from TCS, Infosys, Reliance, HDFC Bank and more. Automatic text extraction and intelligent chunking.",
  },
  {
    icon: Brain,
    title: "RAG-Powered Answers",
    description:
      "Retrieval-Augmented Generation grounds every response in your uploaded documents — no hallucinated financial figures.",
  },
  {
    icon: FileSearch,
    title: "Source Citations",
    description:
      "Every answer links back to exact pages and excerpts from the original report for audit-ready transparency.",
  },
  {
    icon: BarChart3,
    title: "Financial Intelligence",
    description:
      "Ask about revenue, margins, risk factors, dividends, and management commentary in plain English.",
  },
  {
    icon: ShieldCheck,
    title: "Production Architecture",
    description:
      "Modular FastAPI backend, vector search with Pinecone, and a deployable React frontend built for scale.",
  },
  {
    icon: Zap,
    title: "Sub-Second Retrieval",
    description:
      "Semantic search over embedded document chunks delivers relevant context instantly before LLM synthesis.",
  },
];

const STEPS = [
  { step: "01", title: "Upload Report", text: "Drop a company annual report PDF into the ingestion pipeline." },
  { step: "02", title: "Index & Embed", text: "Text is chunked, embedded with OpenAI, and stored in Pinecone." },
  { step: "03", title: "Ask Anything", text: "Query financials, risks, or strategy in natural language." },
  { step: "04", title: "Verified Answers", text: "Receive AI responses with page-level source citations." },
];

const TECH = [
  "React 18",
  "TypeScript",
  "FastAPI",
  "LangChain",
  "OpenAI",
  "Pinecone",
  "Docker",
  "Vercel",
];

export default function HomePage() {
  return (
    <div className="home">
      <AnimatedBackground />

      <section className="hero">
        <FadeIn>
          <Badge variant="accent">
            <Sparkles size={14} />
            Enterprise-Grade RAG Platform
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="hero-title">
            Turn Annual Reports into
            <br />
            <GradientText as="span">Actionable Financial Insights</GradientText>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="hero-subtitle">
            FinSight AI is a full-stack Retrieval-Augmented Generation system that lets analysts,
            investors, and students query Indian corporate annual reports with cited, trustworthy answers.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="hero-actions">
            <Button to="/upload" size="lg" icon={<Upload size={18} />}>
              Upload Annual Report
            </Button>
            <Button to="/chat" variant="secondary" size="lg" icon={<MessageSquareText size={18} />}>
              Open AI Chat
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="hero-stats">
            {[
              { value: "6+", label: "Core RAG Pipeline Stages" },
              { value: "25MB", label: "Max PDF Upload Size" },
              { value: "100%", label: "Citation-Backed Answers" },
            ].map((stat) => (
              <div key={stat.label} className="hero-stat">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="section">
        <FadeIn>
          <div className="section-header">
            <Badge>Capabilities</Badge>
            <h2>Built for Serious Financial Analysis</h2>
            <p>
              A production-ready application combining modern frontend engineering with
              a modular AI backend — designed to impress in technical interviews and real deployments.
            </p>
          </div>
        </FadeIn>

        <div className="features-grid">
          {FEATURES.map((feature, i) => (
            <SpotlightCard key={feature.title} delay={i * 0.08}>
              <div className="feature-icon">
                <feature.icon size={22} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <FadeIn>
          <div className="section-header">
            <Badge variant="success">Workflow</Badge>
            <h2>How FinSight AI Works</h2>
            <p>From PDF upload to cited answers in four streamlined steps.</p>
          </div>
        </FadeIn>

        <div className="steps-grid">
          {STEPS.map((item, i) => (
            <FadeIn key={item.step} delay={i * 0.1}>
              <div className="step-card">
                <span className="step-number">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="section">
        <FadeIn>
          <div className="section-header">
            <Badge>Tech Stack</Badge>
            <h2>Modern, Interview-Ready Architecture</h2>
            <p>Industry-standard tools across the full stack — frontend, backend, and AI layers.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="tech-pills">
            {TECH.map((item) => (
              <span key={item} className="tech-pill">
                {item}
              </span>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <motion.div
            className="cta-banner"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div>
              <h3>Ready to analyze your first report?</h3>
              <p>Upload a PDF and start asking questions in under a minute.</p>
            </div>
            <Link to="/upload" className="cta-link">
              Get Started
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </FadeIn>
      </section>
    </div>
  );
}
