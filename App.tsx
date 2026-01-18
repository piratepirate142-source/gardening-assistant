
import React, { useState, useRef } from 'react';
import { Camera, Upload, Send, Leaf, Droplets, Sun, Thermometer, Wind, AlertTriangle, ChevronRight, MessageSquare } from 'lucide-react';
import { analyzePlantImage, getPlantAdvice } from './services/geminiService';
import { PlantInfo, Message } from './types';

// Fix: Changed React.StrictMode to React.FC for functional component typing
const App: React.FC = () => {
  const [plant, setPlant] = useState<PlantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingText, setAnalyzingText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1];
      setImagePreview(base64);
      setLoading(true);
      
      const analysisTexts = [
        "Identifying your green friend...",
        "Consulting the botanical archives...",
        "Decoding leaf patterns...",
        "Measuring optimal sunlight needs...",
        "Almost there! Preparing care guide..."
      ];
      
      let textIdx = 0;
      const interval = setInterval(() => {
        setAnalyzingText(analysisTexts[textIdx]);
        textIdx = (textIdx + 1) % analysisTexts.length;
      }, 1500);

      const result = await analyzePlantImage(base64Data, file.type);
      clearInterval(interval);
      
      if (result) {
        setPlant(result);
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: `I've identified your plant as a ${result.name}! You can see the full care guide above. Do you have any specific questions about it?`,
          timestamp: new Date()
        }]);
      } else {
        alert("Sorry, I couldn't identify this plant. Please try a clearer photo.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setTimeout(scrollToBottom, 50);

    const response = await getPlantAdvice(inputMessage, plant || undefined);
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
    setTimeout(scrollToBottom, 50);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar / Left Column - Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 md:p-8 bg-white border-r border-slate-200">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Leaf size={24} />
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-emerald-900">Flora</h1>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <Camera size={18} />
            <span>Identify New Plant</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-emerald-800 animate-pulse">{analyzingText}</p>
          </div>
        ) : !plant ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6">
            <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-2">
              <Upload size={48} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-800">Your garden's best friend.</h2>
            <p className="text-slate-500 leading-relaxed">
              Upload a photo of any plant to get instant identification, personalized care guides, and expert gardening advice.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all hover:scale-105"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Plant Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white flex-shrink-0">
                <img src={imagePreview!} alt={plant.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  <Leaf size={12} /> Plant Identified
                </div>
                <h2 className="text-4xl font-serif font-bold text-slate-800 mb-1">{plant.name}</h2>
                <p className="text-lg text-emerald-700 italic font-medium mb-4">{plant.scientificName}</p>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{plant.description}</p>
              </div>
            </div>

            {/* Care Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CareCard icon={<Droplets />} title="Watering" value={plant.careGuide.watering} color="bg-blue-50 text-blue-600" />
              <CareCard icon={<Sun />} title="Sunlight" value={plant.careGuide.sunlight} color="bg-amber-50 text-amber-600" />
              <CareCard icon={<Thermometer />} title="Temperature" value={plant.careGuide.temperature} color="bg-rose-50 text-rose-600" />
              <CareCard icon={<Wind />} title="Humidity" value={plant.careGuide.humidity} color="bg-cyan-50 text-cyan-600" />
              <CareCard icon={<Leaf />} title="Soil" value={plant.careGuide.soil} color="bg-orange-50 text-orange-600" />
              <CareCard icon={<Droplets />} title="Fertilizer" value={plant.careGuide.fertilizer} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 mb-4 font-bold uppercase text-xs tracking-widest">
                  <AlertTriangle size={16} /> Toxicity Alert
                </div>
                <p className="text-slate-700">{plant.toxicity}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 mb-4 font-bold uppercase text-xs tracking-widest">
                  <MessageSquare size={16} /> Common Issues
                </div>
                <ul className="space-y-2">
                  {plant.commonIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-emerald-400" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Chat Assistant */}
      <div className="w-full md:w-[400px] flex flex-col bg-[#f1f5f9] border-l border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Plant Chat</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Powered by Gemini</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <MessageSquare size={32} className="mb-2" />
              <p className="text-sm font-medium">Identify a plant to start a conversation about its care.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200">
          <div className="relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CareCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}

const CareCard: React.FC<CareCardProps> = ({ icon, title, value, color }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
      {/* Fix: Casting icon as any to allow dynamic 'size' prop injection during cloning */}
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    </div>
    <div>
      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
      <p className="text-sm text-slate-700 leading-relaxed font-medium">{value}</p>
    </div>
  </div>
);

export default App;
