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
import CropGuidance from "./pages/CropGuidance";
import PestDisease from "./pages/PestDisease";
import Weather from "./pages/Weather";
import MarketPrices from "./pages/MarketPrices";
import MarketPriceCrop from "./pages/MarketPriceCrop";
import Calendar from "./pages/Calendar";
import CalendarCrop from "./pages/CalendarCrop";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import CommunityPostDetail from "./pages/CommunityPostDetail";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

import { OfflineIndicator } from "@/components/OfflineIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/assistant" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/schemes/:category" element={<Schemes />} />
            <Route path="/crop-guidance" element={<CropGuidance />} />
            <Route path="/pest-disease" element={<PestDisease />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/scan/result" element={<ScanResult />} />
            <Route path="/scan/history" element={<ScanHistory />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/market-prices/crop/:name" element={<MarketPriceCrop />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/calendar/crop/:name" element={<CalendarCrop />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/post" element={<CommunityPost />} />
            <Route path="/community/post/:id" element={<CommunityPostDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
