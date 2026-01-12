import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Schemes from "./pages/Schemes";
import Scan from "./pages/Scan";
import ScanResult from "./pages/ScanResult";
import ScanHistory from "./pages/ScanHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/assistant" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/schemes/:category" element={<Schemes />} />
            <Route path="/crop-guidance" element={<Chat />} />
            <Route path="/pest-disease" element={<Chat />} />
            <Route path="/soil-irrigation" element={<Chat />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/scan/result" element={<ScanResult />} />
            <Route path="/scan/history" element={<ScanHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
