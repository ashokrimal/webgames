import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

export const Chat = ({ isSpectator = false }: { isSpectator?: boolean }) => {
  const { chatHistory, sendChatMessage, currentRoom } = useSocket();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSpectator) {
      sendChatMessage(message.trim());
      setMessage('');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          {isSpectator ? 'Spectator Chat' : 'Chat'}
        </h3>
        {isSpectator && (
          <p className="text-xs text-gray-500 mt-1">
            Read-only mode - only players can send messages
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chatHistory.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">No messages yet.</p>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <span className="font-medium text-sm text-gray-700">
                  {msg.username}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div className="text-gray-800 text-sm break-words">
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isSpectator && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentRoom ? "Type a message..." : "Join a room to chat..."}
              disabled={!currentRoom}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!message.trim() || !currentRoom}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {message.length}/300 characters
          </p>
        </form>
      )}
    </div>
  );
};
