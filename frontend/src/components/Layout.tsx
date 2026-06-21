import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { BarChart3, Home, MessageSquare, Upload } from "lucide-react";
import AnimatedBackground from "./ui/AnimatedBackground";

interface LayoutProps {
  children: ReactNode;
}

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/upload", label: "Upload", icon: Upload, end: false },
  { to: "/chat", label: "Chat", icon: MessageSquare, end: false },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="layout">
      {isHome && <AnimatedBackground />}
      <header className="layout-header">
        <div className="layout-header-inner">
          <NavLink to="/" className="logo">
            <div className="logo-icon">
              <BarChart3 size={18} />
            </div>
            <div className="logo-text">
              <h1>FinSight AI</h1>
              <span>Financial Report Intelligence</span>
            </div>
          </NavLink>
          <nav className="nav">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={`layout-main${isHome ? " layout-main--home" : ""}`}>{children}</main>
      <footer className="layout-footer">
        <div className="layout-footer-inner">
          <p>
            <strong>FinSight AI</strong> — Full-Stack RAG Application for Financial Document Intelligence
          </p>
          <p className="layout-footer-meta">
            Built with React, FastAPI, LangChain, OpenAI &amp; Pinecone ·{" "}
            <a
              href="https://github.com/Yash5247/FinSight_AI"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
