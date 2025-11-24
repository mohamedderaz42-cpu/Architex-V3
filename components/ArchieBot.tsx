
import React, { useState, useRef, useEffect } from 'react';
import { aiAdapter } from '../services/ai/AIAdapter';
import { ChatMessage, ViewState } from '../types';
import { UI_CONSTANTS } from '../constants';
import { AIImageInput } from '../services/ai/types';

interface ArchieBotProps {
    currentView?: ViewState;
}

const KNOWLEDGE_BASE = `
SYSTEM IDENTITY:
You are ArchieBot AI, the advanced support sentinel for the Architex Protocol on Pi Network. 
You are not just a chat bot; you are a platform expert.

CORE PROTOCOL FEATURES:
1. **Tokenomics (ARTX)**: 
   - Native Token: ARTX (Architex Token).
   - Max Supply: 100,000,000 (100 Million).
   - Network: Stellar Soroban (via Pi Network Bridge).
   - Utility: Staking, Governance, Purchasing Blueprints, NFT Minting.

2. **Staking Vaults**:
   - Users lock ARTX to earn APY (Annual Percentage Yield).
   - **Utility Benefit**: Active Stakers receive a **50% Discount** on platform commissions for Bounties.
   - Pools: Flexible (5.5%), Validator (12%), Governance (24.5%).

3. **Bounty Marketplace**:
   - Secure Escrow system for hiring architects.
   - Funds are locked in a Smart Contract until work is approved.
   - Platform Fee: 10% (Reduced to 5% for Stakers).

4. **Proof of Physical Installation**:
   - Users can upload photos of real-world builds based on Architex designs.
   - AI Computer Vision verifies the photo.
   - **Reward**: Verified proofs grant **Cashback rewards in ARTX**.

5. **Developer API (Oracle)**:
   - External developers can buy a license (100 Pi/Year) to access the Price Index API.
   - Provides real-time, signed pricing data for ARTX/Pi.

6. **Legal Engine**:
   - Generates on-chain notarized agreements (IP Transfer, Service Agreements).
   - Hashes content to SHA-256 and stores proof on ledger.

7. **DeFi Gateway**:
   - Integrated DEX (Decentralized Exchange) for swapping Pi <-> ARTX.
   - Includes an Oracle-verified rate calculator.
   
8. **Vendor Portal**:
   - Businesses can apply to become Verified Vendors.
   - **Requirement**: Must upload valid **Liability Insurance**.
   - Benefits: Reduced fees, Verified Badge, access to enterprise bounties.

BEHAVIORAL RULES:
- If the user is in a specific view (provided in context), tailor advice to that view.
- Be concise, futuristic, and helpful.
- If an error occurs, suggest checking their Pi Wallet connection.
`;

const SUGGESTIONS: Record<string, string[]> = {
    [ViewState.STAKING]: ["How do I stake ARTX?", "What is the Staker Discount?", "Explain APY rates"],
    [ViewState.BOUNTIES]: ["How to create a bounty?", "Are funds secured?", "What if I am a Staker?"],
    [ViewState.NFT_FACTORY]: ["How to mint?", "What is the cost?", "Does it transfer IP?"],
    [ViewState.LEGAL]: ["Is this legally binding?", "How does notarization work?", "Explain IP Transfer"],
    [ViewState.PROFILE]: ["How to verify build?", "Get Developer API Key", "Where are my designs?"],
    [ViewState.DEFI]: ["Swap rate for ARTX?", "Is the Oracle secure?", "Liquidity Pool details"],
    [ViewState.DASHBOARD]: ["What is Architex?", "Explain Tokenomics", "How to earn ARTX?"],
    [ViewState.VENDOR_PORTAL]: ["Insurance requirements?", "Vendor benefits?", "Approval time?"]
};

export const ArchieBot: React.FC<ArchieBotProps> = ({ currentView = ViewState.DASHBOARD }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Systems Online. I am ArchieBot AI. How can I assist your architectural operations today?', timestamp: Date.now() }
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

  // Handle View Change Context
  useEffect(() => {
      if (isOpen) {
        // Optional: Add a subtle system message about context switch or just rely on the prompt injection
        // For now, we rely on the prompt injection in handleSend
      }
  }, [currentView]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        setSelectedImage({
          mimeType: file.type,
          data: base64Data
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSuggestion = (text: string) => {
      setInput(text);
      // Optional: Auto-send or just fill input. Let's auto-send for UX speed.
      handleSend(text);
  };

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input;
    if (!textToSend.trim() && !selectedImage) return;

    const currentImage = selectedImage;
    
    // Clear Input
    setInput('');
    setSelectedImage(null);
    setIsThinking(true);

    // Add User Message to State
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    if (currentImage) {
        userMsg.text = `[Image Analysis Request] ${textToSend}`;
    }

    setMessages(prev => [...prev, userMsg]);

    try {
      // Inject Context into Prompt
      const contextPreamble = `[CONTEXT: User is currently viewing the ${currentView} section of the App.]\n`;
      const finalPrompt = `${contextPreamble}${textToSend}`;

      const response = await aiAdapter.generate({
        prompt: finalPrompt,
        images: currentImage ? [currentImage] : undefined,
        history: messages.map(m => ({ role: m.role, text: m.text })),
        systemInstruction: KNOWLEDGE_BASE
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
        text: "Connection to Architex Neural Core unstable. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const currentSuggestions = SUGGESTIONS[currentView] || SUGGESTIONS[ViewState.DASHBOARD];

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-slate-900 border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:scale-105 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-neon-purple/20 to-neon-cyan/20 group-hover:opacity-100 opacity-50 transition-opacity"></div>
        <div className="relative z-10 w-full h-full flex items-center justify-center">
             {isOpen ? (
                 <span className="text-2xl text-white">&times;</span>
             ) : (
                 <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <span className="text-[8px] font-bold text-white mt-0.5">AI HELP</span>
                 </div>
             )}
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-96 max-w-[90vw] h-[600px] max-h-[80vh] ${UI_CONSTANTS.glassClass} flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]`}>
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-[1px]">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                        <span className="text-xs">🤖</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-display font-bold text-white text-sm">ArchieBot AI</h3>
                    <div className="flex items-center gap-1 text-[10px] text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Online • {currentView} Context
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm relative group ${
                    msg.role === 'user' 
                    ? 'bg-neon-purple text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-slate-800 border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
                 <div className="flex justify-start">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl rounded-tl-sm p-3 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Suggestions */}
          <div className="p-2 bg-black/40 border-t border-white/5 overflow-x-auto whitespace-nowrap">
             <div className="flex gap-2">
                 {currentSuggestions.map((s, i) => (
                     <button 
                        key={i} 
                        onClick={() => handleSuggestion(s)}
                        className="px-3 py-1 bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/50 rounded-full text-[10px] text-gray-300 hover:text-white transition-all"
                     >
                        {s}
                     </button>
                 ))}
             </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/5 backdrop-blur-xl border-t border-white/10 rounded-b-xl">
            {selectedImage && (
                <div className="mb-2 p-2 bg-black/40 rounded flex items-center justify-between">
                    <span className="text-xs text-neon-cyan truncate">Image attached</span>
                    <button onClick={() => setSelectedImage(null)} className="text-gray-500 hover:text-white">&times;</button>
                </div>
            )}
            <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Archie..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                />
                <button 
                    onClick={() => handleSend()}
                    className="p-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};