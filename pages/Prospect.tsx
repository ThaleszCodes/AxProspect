
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Lead, LeadStatus, Script, LeadTemperature } from '../types';
import { Instagram, MessageCircle, X, Check, Archive, ArrowRight, Copy, Play, StopCircle, Clock, Tag, Edit3, ShieldAlert, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Prospect: React.FC = () => {
  const [queue, setQueue] = useState<Lead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [objections, setObjections] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // UI Tab State
  const [activeTab, setActiveTab] = useState<'SCRIPT' | 'OBJECTIONS'>('SCRIPT');

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Lead Editing State (One-liners & Tags)
  const [tempTag, setTempTag] = useState<LeadTemperature>(null);
  const [quickNote, setQuickNote] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      // Priority Queue: PENDING (>2 days) -> NEW -> REMAINING
      const [allLeads, pendingFollowUps, loadedScripts] = await Promise.all([
        db.getLeads(),
        db.getPendingFollowUps(),
        db.getScripts()
      ]);

      const newLeads = allLeads.filter(l => l.status === LeadStatus.NEW);
      const otherPending = allLeads.filter(l => l.status === LeadStatus.PENDING && !pendingFollowUps.find(p => p.id === l.id));

      setQueue([...pendingFollowUps, ...newLeads, ...otherPending]);
      
      const openers = loadedScripts.filter(s => !s.type.includes('Objeção'));
      const objs = loadedScripts.filter(s => s.type.includes('Objeção'));
      
      setScripts(openers);
      setObjections(objs);
      
      const defaultScript = openers.find(s => s.isDefault) || openers[0];
      if (defaultScript) setSelectedScriptId(defaultScript.id);
      setIsLoading(false);
    };
    load();
  }, []);

  // Update local inputs when lead changes
  useEffect(() => {
    if (queue[currentIndex]) {
      setTempTag(queue[currentIndex].temperature || null);
      setQuickNote(queue[currentIndex].quickNote || '');
    }
  }, [currentIndex, queue]);

  // Timer Logic
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = window.setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, sessionStartTime]);

  const startSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setSessionCount(0);
    setSessionDuration(0);
  };

  const endSession = () => {
    setIsSessionActive(false);
    setShowSessionSummary(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLead = queue[currentIndex];
  const currentScript = scripts.find(s => s.id === selectedScriptId);

  const handleAction = async (status: LeadStatus) => {
    if (!currentLead) return;

    // Update in DB
    const updatedLead: Lead = { 
      ...currentLead, 
      status, 
      lastContactedAt: new Date().toISOString(),
      scriptId: selectedScriptId,
      temperature: tempTag,
      quickNote: quickNote,
      // lastAction is updated when buttons are clicked
    };
    
    // Optimistic UI Update
    if (isSessionActive) setSessionCount(prev => prev + 1);
    
    // Save to DB in background
    await db.saveLead(updatedLead);

    // Move to next
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // If queue finished but session active
      if (isSessionActive) endSession();
    }
  };

  const updateLastAction = async (action: string) => {
     if (!currentLead) return;
     const updated = { ...currentLead, lastAction: `${action} - Hoje` };
     // Update local queue state to reflect immediately
     const newQueue = [...queue];
     newQueue[currentIndex] = updated;
     setQueue(newQueue);
     // Persist immediately
     await db.saveLead(updated);
  };

  const copyText = (text: string) => {
      let content = text.replace('[niche]', currentLead.niche || 'seu nicho');
      content = content.replace('[name]', currentLead.businessName);
      content = content.replace('[company]', currentLead.company || currentLead.businessName);
      navigator.clipboard.writeText(content);
      // Show small toast? For now just alert or nothing
  };

  const openInsta = () => {
    updateLastAction('Instagram');
    window.open(`https://instagram.com/${currentLead.instagramHandle.replace('@', '')}`, '_blank');
  };

  const openWhatsapp = () => {
    if (currentLead.whatsapp) {
       updateLastAction('WhatsApp');
       window.open(`https://wa.me/${currentLead.whatsapp.replace(/\D/g, '')}`, '_blank');
    } else {
      alert('Sem número de WhatsApp cadastrado');
    }
  };

  // --- RENDERS ---

  if (isLoading) return <div className="text-center p-10 text-gray-500">Carregando fila de prospecção...</div>;

  if (showSessionSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in zoom-in-95">
        <div className="bg-brand-500/10 p-6 rounded-full text-brand-500 mb-4">
          <Check size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sessão Encerrada!</h2>
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6 w-full max-w-xs mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Leads Abordados</span>
            <span className="text-2xl font-bold text-white">{sessionCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Tempo Total</span>
            <span className="text-2xl font-bold text-white">{formatTime(sessionDuration)}</span>
          </div>
        </div>
        <button onClick={() => {setShowSessionSummary(false); window.location.reload();}} className="mt-8 px-6 py-3 bg-brand-600 rounded-lg text-white font-bold">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!isSessionActive && queue.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-blue-500/10 p-6 rounded-full text-blue-500 mb-6 animate-pulse">
          <Play size={48} fill="currentColor" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Iniciar Sessão de Prospecção</h2>
        <p className="text-gray-400 max-w-xs mx-auto mb-8">
          Você tem <strong>{queue.length} leads</strong> na fila de prioridade. O cronômetro iniciará assim que você começar.
        </p>
        <button 
          onClick={startSession}
          className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-brand-500/30 transition-all hover:scale-105 flex items-center gap-3"
        >
          <Play size={24} fill="currentColor" /> COMEÇAR AGORA
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-gray-500">Nenhum lead pendente ou novo para hoje.</p>
        <div className="flex gap-4 mt-6">
           <Link to="/import" className="text-brand-400 border border-brand-500/30 px-4 py-2 rounded-lg">Importar Leads</Link>
           <Link to="/leads" className="text-gray-400 border border-gray-700 px-4 py-2 rounded-lg">Criar Manualmente</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto h-[calc(100vh-100px)] flex flex-col relative pb-20">
      {/* Session Header */}
      <div className="bg-dark-card border-b border-gray-800 p-4 -mx-4 md:mx-0 md:rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 text-red-500 p-2 rounded-lg flex items-center gap-2 font-mono font-bold">
            <Clock size={16} />
            {formatTime(sessionDuration)}
          </div>
          <div className="text-xs text-gray-400">
            {sessionCount} abordados
          </div>
        </div>
        <button onClick={endSession} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
          <StopCircle size={16} /> Parar
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-dark-card border border-gray-700 md:rounded-b-2xl flex-1 flex flex-col shadow-2xl relative overflow-hidden mt-2">
        {/* Top Info */}
        <div className="p-5 bg-gradient-to-b from-gray-800 to-dark-card border-b border-gray-800">
          <div className="flex justify-between items-start mb-2">
             <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wide">
              {currentLead.niche}
            </span>
            <div className="flex gap-1">
               <button onClick={() => setTempTag('HOT')} className={`p-1 rounded ${tempTag === 'HOT' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-700'}`} title="Quente"><Tag size={16} /></button>
               <button onClick={() => setTempTag('WARM')} className={`p-1 rounded ${tempTag === 'WARM' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-700'}`} title="Morno"><Tag size={16} /></button>
               <button onClick={() => setTempTag('COLD')} className={`p-1 rounded ${tempTag === 'COLD' ? 'bg-gray-500 text-white' : 'text-gray-600 hover:bg-gray-700'}`} title="Frio"><Tag size={16} /></button>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-1">{currentLead.businessName}</h1>
          <p className="text-brand-400 text-lg mb-3 flex items-center gap-2">
            {currentLead.instagramHandle} 
            {currentLead.company && <span className="text-gray-500 text-xs border border-gray-700 px-2 rounded-full">{currentLead.company}</span>}
          </p>
          
          {/* Quick Note Input */}
          <div className="relative">
            <Edit3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Anotação rápida (ex: dono ocupado)" 
              className="w-full bg-black/20 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
            />
          </div>
        </div>

        {/* Action Area */}
        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={openInsta} className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 py-3 rounded-xl font-bold text-white shadow-lg shadow-pink-500/20 active:scale-95 transition-transform">
              <Instagram size={20} /> Instagram
            </button>
            <button 
              onClick={openWhatsapp} 
              disabled={!currentLead.whatsapp}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform ${currentLead.whatsapp ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
            >
              <MessageCircle size={20} /> WhatsApp
            </button>
          </div>

          {/* TAB SYSTEM FOR SCRIPTS vs OBJECTIONS */}
          <div className="flex bg-gray-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('SCRIPT')} 
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'SCRIPT' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText size={14} /> Abordagem
            </button>
            <button 
               onClick={() => setActiveTab('OBJECTIONS')} 
               className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'OBJECTIONS' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ShieldAlert size={14} /> Objeções
            </button>
          </div>

          {/* SCRIPT AREA */}
          {activeTab === 'SCRIPT' && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <select 
                  className="bg-gray-900 border border-gray-700 text-xs rounded p-1 text-white w-full"
                  value={selectedScriptId}
                  onChange={(e) => setSelectedScriptId(e.target.value)}
                >
                  {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="relative group flex-1 bg-black/20 rounded-lg p-3 border border-gray-700/50">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap h-full overflow-y-auto">
                  {currentScript?.content.replace('[name]', currentLead.businessName).replace('[niche]', currentLead.niche || '').replace('[company]', currentLead.company || currentLead.businessName) || 'Selecione ou crie um script.'}
                </p>
                <button onClick={() => currentScript && copyText(currentScript.content)} className="absolute top-2 right-2 p-2 bg-gray-700 rounded-lg text-white opacity-50 hover:opacity-100 transition-opacity">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}

          {/* OBJECTIONS AREA */}
          {activeTab === 'OBJECTIONS' && (
             <div className="flex-1 overflow-y-auto space-y-2">
                {objections.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Nenhuma resposta cadastrada. <Link to="/scripts" className="text-brand-400 underline">Criar em Scripts</Link>
                  </div>
                ) : (
                  objections.map(obj => (
                    <div key={obj.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 transition-colors group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-orange-400">{obj.title}</span>
                        <button onClick={() => copyText(obj.content)} className="text-gray-500 hover:text-white"><Copy size={14} /></button>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-3">{obj.content}</p>
                    </div>
                  ))
                )}
             </div>
          )}
        </div>

        {/* Outcome Buttons */}
        <div className="p-3 bg-gray-800/90 backdrop-blur-md grid grid-cols-4 gap-2 border-t border-gray-700">
          <button onClick={() => handleAction(LeadStatus.NOT_INTERESTED)} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/20">
            <Archive size={20} />
            <span className="text-[9px] uppercase font-bold">Não Deu</span>
          </button>
          <button onClick={() => handleAction(LeadStatus.PENDING)} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400 active:bg-yellow-500/20">
            <Clock size={20} />
            <span className="text-[9px] uppercase font-bold">Adiar</span>
          </button>
          <button onClick={() => handleAction(LeadStatus.CONTACTED)} className="col-span-2 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
            <span>Próximo</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
