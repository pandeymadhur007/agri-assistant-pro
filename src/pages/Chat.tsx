import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ChatInterface } from '@/components/ChatInterface';
import { SEO } from '@/components/SEO';

const Chat = () => {
  return (
    <div className="h-[100dvh] flex flex-col">
      <SEO
        title="AI Farming Assistant Chat"
        description="Ask Gram AI anything about farming — crops, pests, weather, schemes. Voice support in Hindi, Marathi, Telugu, Tamil & Bengali."
      />
      <Navbar />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatInterface />
      </div>
      <BottomNav noSpacer />
    </div>
  );
};

export default Chat;
