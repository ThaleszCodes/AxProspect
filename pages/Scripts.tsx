
import React, { useState, useEffect } from 'react';
import { db, generateId } from '../services/db';
import { Script, ScriptType } from '../types';
import { Plus, Trash2, Save, FileText, ShieldAlert, MessageSquare } from 'lucide-react';

export const Scripts: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'OPENER' | 'OBJECTION'>('OPENER');
  
  // Quick editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ScriptType>(ScriptType.SHORT_OPENER);

  const load = async () => {
    const s = await db.getScripts();
    setScripts(s);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const newScript: Script = {
      id: generateId(),
      title: filterType === 'OPENER' ? 'Nova Abordagem' : 'Nova Resposta a Objeção',
      content: '',
      type: filterType === 'OPENER' ? ScriptType.SHORT_OPENER : ScriptType.OBJECTION_PRICE
    };
    await db.saveScript(newScript);
    load();
    startEdit(newScript);
  };

  const startEdit = (script: Script) => {
    setEditingId(script.id);
    setTitle(script.title);
    setContent(script.content);
    setType(script.type);
  };

  const handleSave = async () => {
    if (!editingId) return;
    const script = scripts.find(s => s.id === editingId);
    if (script) {
      const updated = { ...script, title, content, type };
      await db.saveScript(updated);
      load();
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar script?')) {
      await db.deleteScript(id);
      load();
      if (editingId === id) setEditingId(null);
    }
  };

  const filteredScripts = scripts.filter(s => {
    const isObjection = s.type.includes('Objeção');
    return filterType === 'OBJECTION' ? isObjection : !isObjection;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      {/* Left: List */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
        {/* Custom Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setFilterType('OPENER')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${filterType === 'OPENER' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-800/50'}`}
          >
            <MessageSquare size={16} /> Abordagens
          </button>
          <button 
            onClick={() => setFilterType('OBJECTION')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${filterType === 'OBJECTION' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-800/50'}`}
          >
            <ShieldAlert size={16} /> Quebra Objeções
          </button>
        </div>

        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <span className="text-xs text-gray-500 uppercase tracking-widest">{filteredScripts.length} MODELOS</span>
          <button onClick={handleCreate} className="p-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white">
            <Plus size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-2 space-y-2 flex-1">
          {filteredScripts.map(script => (
            <div 
              key={script.id} 
              onClick={() => startEdit(script)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${editingId === script.id ? 'bg-brand-900/20 border-brand-500' : 'bg-gray-800/40 border-transparent hover:bg-gray-800'}`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-200">{script.title}</span>
                <span className="text-[10px] bg-gray-700 px-2 rounded text-gray-400 py-0.5">{script.type.replace('Objeção: ', '')}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{script.content || 'Sem conteúdo...'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
        {editingId ? (
          <>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <span className="text-xs uppercase text-gray-500 font-bold tracking-widest">Editor</span>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(editingId)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"><Save size={18} /> Salvar</button>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none"
                  value={type}
                  onChange={e => setType(e.target.value as ScriptType)}
                >
                  {Object.values(ScriptType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Conteúdo (Use [name], [niche], [company] como variáveis)</label>
                <textarea 
                  className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none font-mono text-sm leading-relaxed"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10 text-center">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Selecione um script para editar ou crie um novo.</p>
          </div>
        )}
      </div>
    </div>
  );
};
