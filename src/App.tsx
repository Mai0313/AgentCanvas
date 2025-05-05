import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ChatPage from "@/pages/chat";
import DeepWikiPage from "@/pages/deepwiki";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ChatPage />} path="/chat" />
      {/* <Route element={<ChatPage />} path="/chat/:id" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title/:model" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title/:model/:prompt" /> */}
      <Route element={<DeepWikiPage />} path="/deepwiki" />
    </Routes>
  );
}

export default App;
