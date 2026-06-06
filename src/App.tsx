import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";

// Lazy-loaded routes for code splitting (reduces unused JS in initial bundle)
const Chat = lazy(() => import("./pages/Chat"));
const Schemes = lazy(() => import("./pages/Schemes"));
const SchemeDetail = lazy(() => import("./pages/SchemeDetail"));
const ScanResult = lazy(() => import("./pages/ScanResult"));
const ScanHistory = lazy(() => import("./pages/ScanHistory"));
const CropCenter = lazy(() => import("./pages/CropCenter"));
const Weather = lazy(() => import("./pages/Weather"));
const MarketPrices = lazy(() => import("./pages/MarketPrices"));
const MarketPriceCrop = lazy(() => import("./pages/MarketPriceCrop"));
const Community = lazy(() => import("./pages/Community"));
const CommunityPost = lazy(() => import("./pages/CommunityPost"));
const CommunityPostDetail = lazy(() => import("./pages/CommunityPostDetail"));
const SmartCropPlanner = lazy(() => import("./pages/SmartRecommendations"));
const Auth = lazy(() => import("./pages/Auth"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const AnimalHusbandry = lazy(() => import("./pages/AnimalHusbandry"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/assistant" element={<Chat />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/schemes/detail/:id" element={<SchemeDetail />} />
        <Route path="/schemes/:category" element={<Schemes />} />
        <Route path="/crop-center" element={<CropCenter />} />
        <Route path="/crop-guidance" element={<CropCenter />} />
        <Route path="/pest-disease" element={<CropCenter />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/scan" element={<CropCenter />} />
        <Route path="/scan/result" element={<ScanResult />} />
        <Route path="/scan/history" element={<ScanHistory />} />
        <Route path="/market-prices" element={<MarketPrices />} />
        <Route path="/market-prices/crop/:name" element={<MarketPriceCrop />} />
        <Route path="/calendar" element={<Navigate to="/smart-crop-planner" replace />} />
        <Route path="/calendar/*" element={<Navigate to="/smart-crop-planner" replace />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/post" element={<CommunityPost />} />
        <Route path="/community/post/:id" element={<CommunityPostDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommendations" element={<Navigate to="/smart-crop-planner" replace />} />
        <Route path="/smart-crop-planner" element={<SmartCropPlanner />} />
        <Route path="/animal-husbandry" element={<AnimalHusbandry />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
            <InstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
