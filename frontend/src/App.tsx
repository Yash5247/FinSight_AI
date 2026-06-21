import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import UploadPage from "./components/UploadPage";
import ChatPage from "./components/ChatPage";
import { DocumentProvider } from "./context/DocumentContext";

export default function App() {
  return (
    <DocumentProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Layout>
    </DocumentProvider>
  );
}
