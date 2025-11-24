
import React, { useState, useEffect, useRef } from 'react';
import { ContextualMessage, Conversation } from '../types';
import { dalGetMessages, dalSendMessage } from '../services/dataAccessLayer';
import { UI_CONSTANTS } from '../constants';

interface ChatPanelProps {
  conversation: Conversation;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<ContextualMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Simulate polling for new messages in a real app
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversation.contextId]);

  const loadMessages = async () => {
    const msgs = await dalGetMessages(conversation.contextId);
    setMessages(msgs);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    
    // Optimistic UI update
    const tempMsg: ContextualMessage = {
        id: 'temp',
        contextId: conversation.contextId,
        sender: 'user',
        text: text,
        timestamp: Date.now(),
        isRead: true
    };
    setMessages(prev => [...prev, tempMsg]);

    await dalSendMessage(conversation.contextId, text);
    loadMessages();
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
            {conversation.thumbnailUrl ? (
                <img src={conversation.thumbnailUrl} alt="Context" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-neon-purple flex items-center justify-center text-white">#</div>
            )}
        </div>
        <div>
            <h3 className="font-bold text-white text-sm">{conversation.title}</h3>
            <div className="flex items-center gap-1">
                <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded border border-neon-cyan/20">
                    {conversation.contextType}
                </span>
                <span className="text-[10px] text-gray-500 font-mono uppercase">ID: {conversation.contextId.substring(0,8)}...</span>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-10">
                Start the conversation regarding this context.
            </div>
        )}
        {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';
            
            if (isSystem) {
                return (
                    <div key={idx} className="flex justify-center my-4">
                        <div className="bg-white/5 border border-white/5 rounded-full px-4 py-1 text-[10px] text-gray-400 font-mono uppercase tracking-wide">
                            {msg.text}
                        </div>
                    </div>
                );
            }

            return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        isUser 
                        ? 'bg-neon-purple text-white rounded-br-none' 
                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                    }`}>
                        <div className="mb-1 text-[10px] opacity-50 flex justify-between gap-4">
                            <span>{msg.sender === 'support' ? 'Support Agent' : 'You'}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {msg.text}
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <button 
                onClick={handleSend}
                className="p-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/30 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
        </div>
      </div>
    </div>
  );
};
