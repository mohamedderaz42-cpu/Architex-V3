import React, { useState, useRef, useEffect } from 'react';
import { aiAdapter } from '../services/ai/AIAdapter';
import { ChatMessage } from '../types';
import { UI_CONSTANTS } from '../constants';
import { AIImageInput } from '../services/ai/types';

export const ArchieBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Greetings, Architect. I am ArchieBot. Upload an image or ask me about the protocol.', timestamp: Date.now() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<AIImageInput | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, selectedImage]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,") for the API if needed, 
        // but GoogleGenAI usually expects pure base64 in `data` or handles it. 
        // The API helper usually takes pure base64. Let's strip the prefix.
        const base64Data = base64String.split(',')[1];
        
        setSelectedImage({
          mimeType: file.type,
          data: base64Data
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const currentImage = selectedImage;
    const currentInput = input;
    
    // Clear Input
    setInput('');
    setSelectedImage(null);
    setIsThinking(true);

    // Add User Message to State
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentInput,
      timestamp: Date.now()
    };
    // Note: We don't display the base64 image in chat bubble for simplicity, but we could.
    if (currentImage) {
        userMsg.text = `[Image Uploaded] ${currentInput}`;
    }

    setMessages(prev => [...prev, userMsg]);

    try {
      // Construct AI Input
      const response = await aiAdapter.generate({
        prompt: currentInput || (currentImage ? "Analyze this image" : ""),
        images: currentImage ? [currentImage] : undefined,
        history: messages.map(m => ({ role: m.role, text: m.text })),
        systemInstruction: `You are ArchieBot, a futuristic Web3 companion for Architex.
        Facts: ARTX Token (100M Supply), Stellar Soroban Network, Pi Network Ecosystem.
        Be concise, helpful, and tech-savvy.`
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error: Neural Link Disrupted. Please check console.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-[1px] shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:scale-110 transition-transform"
      >
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] ${UI_CONSTANTS.glassClass} flex flex-col animate-pulse-slow`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-display font-bold text-neon-cyan">ArchieBot v2.0</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">&times;</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-neon-purple/20 border border-neon-purple/30 text-white' : 'bg-white/10 text-gray-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && <div className="text-xs text-neon-cyan animate-pulse">Processing neural query...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview Area */}
          {selectedImage && (
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-2">
                <div className="w-10 h-10 rounded overflow-hidden border border-neon-cyan">
                    <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-400">Image attached</span>
                <button onClick={() => setSelectedImage(null)} className="ml-auto text-red-400 text-xs hover:text-red-300">Remove</button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask or upload image..."
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
              />
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                title="Upload Image"
              >
                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>

              <button onClick={handleSend} className="p-2 bg-neon-cyan/20 rounded-lg border border-neon-cyan/30 hover:bg-neon-cyan/40">
                <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
