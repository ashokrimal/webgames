import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  system?: boolean;
}

export const LobbyChat = () => {
  const { socket, connected, currentRoom } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    return () => {
      socket.off('chat-message');
      socket.off('chat-history');
    };
  }, [socket, connected]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !connected || !currentRoom) return;
    socket.emit('chat-message', { message: input.trim(), roomId: currentRoom.id });
    setInput('');
  };

  return (
    <div className="card p-4 h-96 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Lobby Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 bg-gray-50 rounded p-2">
        {messages.map(msg => (
          <div key={msg.id} className={`text-sm ${msg.system ? 'text-gray-500 italic' : ''}`}>
            {!msg.system && <span className="font-semibold text-blue-700">{msg.username}: </span>}
            <span className="text-gray-800">{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="btn-primary px-3 py-2">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
