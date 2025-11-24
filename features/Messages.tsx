
import React, { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { dalGetConversations } from '../services/dataAccessLayer';
import { ChatPanel } from './ChatPanel';
import { UI_CONSTANTS } from '../constants';

interface MessagesProps {
    initialContextId?: string | null;
}

export const Messages: React.FC<MessagesProps> = ({ initialContextId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(initialContextId || null);

  useEffect(() => {
    const fetchConvos = async () => {
      const data = await dalGetConversations();
      setConversations(data);
      
      // If no initial context, select the first one if available
      if (!initialContextId && !selectedContextId && data.length > 0) {
        setSelectedContextId(data[0].contextId);
      }
      
      // If initial context passed, ensure it's selected
      if (initialContextId) {
          setSelectedContextId(initialContextId);
      }
    };
    fetchConvos();
  }, [initialContextId]);

  const activeConversation = conversations.find(c => c.contextId === selectedContextId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-[fadeIn_0.5s_ease-out]">
        {/* Sidebar / Conversation List */}
        <div className={`flex-1 md:flex-none md:w-80 flex flex-col gap-4 ${selectedContextId ? 'hidden md:flex' : 'flex'}`}>
            <h2 className="text-2xl font-display font-bold text-white">Inbox</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {conversations.map(conv => (
                    <div 
                        key={conv.contextId}
                        onClick={() => setSelectedContextId(conv.contextId)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                            selectedContextId === conv.contextId 
                            ? 'bg-neon-purple/20 border-neon-purple/50' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
                                {conv.thumbnailUrl ? <img src={conv.thumbnailUrl} className="w-full h-full object-cover" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`text-sm font-bold truncate ${selectedContextId === conv.contextId ? 'text-white' : 'text-gray-300'}`}>
                                        {conv.title}
                                    </h4>
                                    {conv.unreadCount > 0 && (
                                        <span className="w-2 h-2 rounded-full bg-neon-pink"></span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                    {conv.lastMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-[2] flex flex-col h-full ${!selectedContextId ? 'hidden md:flex' : 'flex'}`}>
            {selectedContextId && activeConversation ? (
                <>
                    <div className="md:hidden mb-2">
                        <button onClick={() => setSelectedContextId(null)} className="text-sm text-gray-400 flex items-center gap-1">
                            ← Back to Inbox
                        </button>
                    </div>
                    <ChatPanel conversation={activeConversation} />
                </>
            ) : (
                <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <div className="text-center text-gray-500">
                        <p className="mb-2 text-3xl opacity-20">💬</p>
                        <p>Select a conversation to view details</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
