import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ChatInterface } from '@/components/ChatInterface';

const Chat = () => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden pb-20 md:pb-0">
        <ChatInterface />
      </div>
      <BottomNav />
    </div>
  );
};

export default Chat;
