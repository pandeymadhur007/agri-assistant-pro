import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';

const Chat = () => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat;
