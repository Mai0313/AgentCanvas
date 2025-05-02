import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ChatPage from "@/pages/chat";
import DocsPage from "@/pages/docs";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ChatPage />} path="/chat" />
      {/* <Route element={<ChatPage />} path="/chat/:id" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title/:model" /> */}
      {/* <Route element={<ChatPage />} path="/chat/:id/:title/:model/:apiType" /> */}
      <Route element={<DocsPage />} path="/docs" />
    </Routes>
  );
}

export default App;
