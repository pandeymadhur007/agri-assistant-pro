import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ChatInterface } from '@/components/ChatInterface';
import { SEO } from '@/components/SEO';

const Chat = () => {
  return (
    <div className="h-screen flex flex-col">
      <SEO
        title="AI Farming Assistant Chat"
        description="Ask Gram AI anything about farming — crops, pests, weather, schemes. Voice support in Hindi, Marathi, Telugu, Tamil & Bengali."
      />
      <Navbar />
      <div className="flex-1 overflow-hidden pb-20 md:pb-0">
        <ChatInterface />
      </div>
      <BottomNav />
    </div>
  );
};

export default Chat;
