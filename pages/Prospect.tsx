
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Lead, LeadStatus, Script, LeadTemperature } from '../types';
import { 
  Instagram, MessageCircle, X, Check, Archive, ArrowRight, Copy, Play, 
  StopCircle, Clock, Tag, Edit3, ShieldAlert, FileText, History, 
  ChevronRight, ChevronLeft, ExternalLink, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Prospect: React.FC = () => {
  const [queue, setQueue] = useState<Lead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [objections, setObjections] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // UI Tab State
  const [activeTab, setActiveTab] = useState<'SCRIPT' | 'OBJECTIONS' | 'INFO'>('SCRIPT');

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Lead Editing State
  const [tempTag, setTempTag] = useState<LeadTemperature>(null);
  const [quickNote, setQuickNote] = useState('');

  // Notifications/Feedback
  const [copyFeedback, setCopyFeedback] = useState(false);

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
      // Reset view to script on new lead usually
      setActiveTab('SCRIPT');
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
  const progressPercent = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;

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
      // lastAction updated separately if needed, but usually linked to external buttons
    };
    
    // Optimistic UI Update
    if (isSessionActive) setSessionCount(prev => prev + 1);
    
    await db.saveLead(updatedLead);

    // Move to next
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      endSession();
    }
  };

  const updateLastAction = async (action: string) => {
     if (!currentLead) return;
     const updated = { ...currentLead, lastAction: `${action} - Hoje` };
     const newQueue = [...queue];
     newQueue[currentIndex] = updated;
     setQueue(newQueue);
     await db.saveLead(updated);
  };

  const processTextVariables = (text: string) => {
    return text
      .replace(/\[name\]/g, currentLead.businessName)
      .replace(/\[niche\]/g, currentLead.niche || 'seu nicho')
      .replace(/\[company\]/g, currentLead.company || currentLead.businessName);
  };

  const copyText = (text: string) => {
      const content = processTextVariables(text);
      navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
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

  if (isLoading) return <div className="flex items-center justify-center h-[80vh] text-brand-500"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>;

  // SUMMARY SCREEN
  if (showSessionSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center animate-in zoom-in-95 p-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-full text-white mb-6 shadow-2xl shadow-green-500/30">
          <Check size={64} />
        </div>
        <h2 className="text-4xl font-bold mb-2 text-white">Sessão Finalizada!</h2>
        <p className="text-gray-400 mb-8">Você completou sua fila de prioridade.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
           <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
             <span className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">Leads</span>
             <span className="text-4xl font-bold text-white">{sessionCount}</span>
           </div>
           <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
             <span className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">Tempo</span>
             <span className="text-4xl font-bold text-white">{formatTime(sessionDuration)}</span>
           </div>
        </div>

        <button onClick={() => {setShowSessionSummary(false); window.location.reload();}} className="mt-8 px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold transition-all w-full max-w-md border border-gray-700">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // START SCREEN
  if (!isSessionActive && queue.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full"></div>
           <div className="relative bg-dark-card border border-gray-700 p-8 rounded-full text-brand-400">
              <Zap size={64} fill="currentColor" />
           </div>
        </div>
        <h2 className="text-3xl font-bold mb-3 text-white">Modo Foco</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
          Sua fila tem <strong className="text-white">{queue.length} leads</strong> prioritários. 
          <br/>Elimine as distrações e foque na prospecção.
        </p>
        <button 
          onClick={startSession}
          className="bg-brand-600 hover:bg-brand-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-xl shadow-brand-500/20 transition-all hover:scale-105 hover:shadow-brand-500/40 flex items-center gap-3"
        >
          <Play size={24} fill="currentColor" /> INICIAR SESSÃO
        </button>
        <div className="mt-8 flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><History size={14}/> Histórico Automático</span>
          <span className="flex items-center gap-1"><Copy size={14}/> Scripts Prontos</span>
        </div>
      </div>
    );
  }

  // EMPTY STATE
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
        <div className="bg-gray-800/50 p-6 rounded-full text-gray-500 mb-6">
           <Check size={48} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Tudo limpo por aqui!</h2>
        <p className="text-gray-500 mb-6">Não há novos leads ou pendências para hoje.</p>
        <div className="flex gap-4">
           <Link to="/import" className="text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 px-6 py-3 rounded-xl font-bold transition-colors">Importar Leads</Link>
           <Link to="/leads" className="text-gray-400 border border-gray-700 hover:bg-gray-800 px-6 py-3 rounded-xl font-bold transition-colors">Ver Todos</Link>
        </div>
      </div>
    );
  }

  // --- ACTIVE SESSION UI ---
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-85px)] flex flex-col relative pb-4 md:pb-0">
      
      {/* 1. HEADER: Progress & Timer */}
      <div className="bg-dark-card border-b border-gray-800 p-4 -mx-4 md:mx-0 md:rounded-t-2xl flex flex-col gap-3 sticky top-0 z-20 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
               Lead {currentIndex + 1} de {queue.length}
             </div>
             <div className="h-4 w-px bg-gray-700"></div>
             <div className="flex items-center gap-2 text-brand-400 font-mono font-bold bg-brand-500/10 px-2 py-1 rounded">
                <Clock size={14} /> {formatTime(sessionDuration)}
             </div>
          </div>
          <button onClick={endSession} className="text-gray-500 hover:text-white flex items-center gap-1 text-xs uppercase font-bold tracking-wide transition-colors">
            <StopCircle size={14} /> Encerrar
          </button>
        </div>
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Split View on Desktop) */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-dark-bg md:border-x md:border-b md:border-gray-800 md:rounded-b-2xl">
        
        {/* LEFT PANEL: LEAD CONTEXT */}
        <div className="w-full md:w-1/3 bg-dark-card/50 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col">
           {/* Lead Header Info */}
           <div className="p-5 border-b border-gray-800 bg-gradient-to-b from-gray-800/50 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                 <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                   {currentLead.niche}
                 </span>
                 {currentLead.lastAction && (
                   <span className="text-[10px] text-gray-500 flex items-center gap-1">
                     <History size={10} /> {currentLead.lastAction}
                   </span>
                 )}
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight mb-1">{currentLead.businessName}</h1>
              <div className="flex flex-col gap-1">
                <a 
                  href={`https://instagram.com/${currentLead.instagramHandle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 w-fit"
                >
                  {currentLead.instagramHandle} <ExternalLink size={12} />
                </a>
                {currentLead.company && (
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Zap size={10}/> {currentLead.company}</span>
                )}
              </div>
           </div>

           {/* Quick Note & Temperature */}
           <div className="p-4 border-b border-gray-800 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Temperatura</label>
                <div className="flex gap-2">
                  {[
                    { val: 'HOT', color: 'bg-red-500', label: 'Quente' },
                    { val: 'WARM', color: 'bg-yellow-500', label: 'Morno' },
                    { val: 'COLD', color: 'bg-blue-500', label: 'Frio' }
                  ].map((t) => (
                    <button 
                      key={t.val}
                      onClick={() => setTempTag(t.val as LeadTemperature)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border border-transparent ${
                        tempTag === t.val 
                        ? `${t.color} text-white shadow-lg` 
                        : 'bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nota Rápida</label>
                <div className="relative">
                  <Edit3 size={14} className="absolute left-3 top-3 text-gray-500" />
                  <textarea 
                    rows={2}
                    placeholder="Ex: Pediu portfólio..." 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500 resize-none"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                  />
                </div>
              </div>
           </div>

           {/* Mini History */}
           <div className="flex-1 overflow-y-auto p-4 bg-gray-900/30">
              <div className="flex items-center gap-2 mb-3">
                 <History size={14} className="text-gray-500" />
                 <span className="text-xs font-bold text-gray-500 uppercase">Histórico Recente</span>
              </div>
              <div className="space-y-3">
                 {(!currentLead.history || currentLead.history.length === 0) && (
                    <p className="text-xs text-gray-600 italic">Nenhuma interação registrada.</p>
                 )}
                 {currentLead.history?.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                       <div className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
                          <div className="w-px h-full bg-gray-800 my-0.5"></div>
                       </div>
                       <div>
                          <p className="text-gray-500 text-[10px]">{new Date(h.date).toLocaleDateString()}</p>
                          <p className="text-gray-300">{h.content}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT PANEL: TOOLS (Scripts & Actions) */}
        <div className="w-full md:w-2/3 flex flex-col bg-dark-card relative">
           
           {/* Tab Switcher */}
           <div className="flex border-b border-gray-800">
              <button 
                onClick={() => setActiveTab('SCRIPT')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'SCRIPT' ? 'bg-dark-card text-brand-400 border-b-2 border-brand-500' : 'bg-gray-900/50 text-gray-500 hover:text-gray-300'}`}
              >
                <FileText size={16} /> Scripts
              </button>
              <button 
                onClick={() => setActiveTab('OBJECTIONS')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'OBJECTIONS' ? 'bg-dark-card text-orange-400 border-b-2 border-orange-500' : 'bg-gray-900/50 text-gray-500 hover:text-gray-300'}`}
              >
                <ShieldAlert size={16} /> Objeções
              </button>
           </div>

           {/* Content Area */}
           <div className="flex-1 p-4 overflow-y-auto bg-gray-900/20">
              
              {/* SCRIPT VIEW */}
              {activeTab === 'SCRIPT' && (
                <div className="h-full flex flex-col">
                  <div className="mb-3">
                    <select 
                      className="w-full bg-dark-card border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                      value={selectedScriptId}
                      onChange={(e) => setSelectedScriptId(e.target.value)}
                    >
                      {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  
                  <div className="relative flex-1 bg-dark-card border border-gray-700 rounded-xl p-4 shadow-inner group">
                     {copyFeedback && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl z-10 animate-in fade-in">
                           <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-xl">
                              <Check size={18} /> Copiado!
                           </div>
                        </div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                          onClick={() => currentScript && copyText(currentScript.content)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-colors border border-gray-700"
                          title="Copiar Script"
                        >
                           <Copy size={16} />
                        </button>
                     </div>
                     <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {currentScript ? (
                           processTextVariables(currentScript.content).split('\n').map((line, i) => (
                              <span key={i} className="block min-h-[1.2em]">{line}</span>
                           ))
                        ) : (
                           <span className="text-gray-500 italic">Selecione um script...</span>
                        )}
                     </p>
                  </div>
                </div>
              )}

              {/* OBJECTIONS VIEW */}
              {activeTab === 'OBJECTIONS' && (
                 <div className="space-y-3 h-full overflow-y-auto">
                    {objections.length === 0 ? (
                       <div className="text-center text-gray-500 mt-10">Nenhuma objeção cadastrada.</div>
                    ) : (
                       objections.map(obj => (
                          <div key={obj.id} className="bg-dark-card border border-gray-700 rounded-xl p-4 hover:border-orange-500/50 transition-colors group">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-orange-400 text-sm">{obj.title}</h4>
                                <button 
                                  onClick={() => copyText(obj.content)}
                                  className="text-gray-500 hover:text-white p-1"
                                >
                                   <Copy size={14} />
                                </button>
                             </div>
                             <p className="text-gray-300 text-xs leading-relaxed">{processTextVariables(obj.content)}</p>
                          </div>
                       ))
                    )}
                 </div>
              )}
           </div>

           {/* 3. ACTION DOCK (Footer) */}
           <div className="p-4 bg-dark-card border-t border-gray-800 z-10">
              <div className="flex flex-col gap-3">
                 {/* External Actions (Big Buttons) */}
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={openInsta}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                    >
                       <Instagram size={20} /> Abrir Instagram
                    </button>
                    <button 
                      onClick={openWhatsapp}
                      disabled={!currentLead.whatsapp}
                      className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                         currentLead.whatsapp 
                         ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20' 
                         : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                       <MessageCircle size={20} /> Abrir WhatsApp
                    </button>
                 </div>

                 {/* Outcome Actions (Toolbar) */}
                 <div className="flex items-center gap-2 mt-1">
                    <button 
                       onClick={() => handleAction(LeadStatus.NOT_INTERESTED)}
                       className="flex-1 bg-gray-800 hover:bg-red-900/30 hover:text-red-400 text-gray-400 py-3 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors border border-transparent hover:border-red-900/50"
                    >
                       <Archive size={16} /> Sem Interesse
                    </button>
                    <button 
                       onClick={() => handleAction(LeadStatus.PENDING)}
                       className="flex-1 bg-gray-800 hover:bg-yellow-900/30 hover:text-yellow-400 text-gray-400 py-3 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors border border-transparent hover:border-yellow-900/50"
                    >
                       <Clock size={16} /> Tentar Depois
                    </button>
                    <button 
                       onClick={() => handleAction(LeadStatus.CONTACTED)}
                       className="flex-[2] bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                    >
                       Próximo Lead <ChevronRight size={18} />
                    </button>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
