
import React, { useState, useEffect } from 'react';
import { db, generateId } from '../services/db';
import { List, Lead, LeadStatus, UserSettings } from '../types';
import { UploadCloud, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Import: React.FC = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedList, setSelectedList] = useState('');
  const [text, setText] = useState('');
  const [niche, setNiche] = useState('');
  const [service, setService] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [l, s] = await Promise.all([db.getLists(), db.getSettings()]);
      setLists(l);
      setSettings(s);
      if (l.length > 0) setSelectedList(l[0].id);
    };
    load();
  }, []);

  const handleImport = async () => {
    if (!selectedList) {
      alert('Crie uma lista antes de importar.');
      return;
    }

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const newLeads: Lead[] = [];

    lines.forEach(line => {
      let handle = '';
      let name = '';
      
      if (line.includes('/')) {
        const parts = line.split('/');
        handle = parts[0].trim();
        name = parts[1].trim();
      } else {
        handle = line.trim();
        name = handle.replace('@', '');
      }

      if (handle.startsWith('@') || handle.length > 3) {
        newLeads.push({
          id: generateId(),
          businessName: name,
          instagramHandle: handle.startsWith('@') ? handle : `@${handle}`,
          niche: niche || 'Geral',
          interestedService: service || undefined,
          status: LeadStatus.NEW,
          listId: selectedList,
          createdAt: new Date().toISOString()
        });
      }
    });

    if (newLeads.length > 0) {
      await db.importLeads(newLeads);
      alert(`${newLeads.length} leads importados com sucesso!`);
      navigate('/leads');
    } else {
      alert('Nenhum formato válido encontrado.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><UploadCloud /> Importação em Massa</h2>

      <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-300 text-sm">
          <AlertCircle className="shrink-0" size={20} />
          <div>
            <p className="font-bold mb-1">Formato aceito:</p>
            <code className="bg-black/30 px-2 py-1 rounded block w-fit mb-1">@usuario_insta/Nome do Negocio</code>
            <code className="bg-black/30 px-2 py-1 rounded block w-fit">@apenas_usuario</code>
            <p className="mt-2 text-xs opacity-70">Um por linha.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lista de Destino</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
            >
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nicho (Opcional)</label>
            <input 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex: Odontologia"
            />
          </div>
           <div>
            <label className="block text-sm text-gray-400 mb-1">Serviço (Opcional)</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">Nenhum</option>
              {settings?.servicesOffered.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Cole os dados aqui</label>
          <textarea 
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm"
            placeholder="@cliente1/Padaria do João&#10;@loja2/Moda Fitness&#10;@tech_start"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button 
          onClick={handleImport}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
        >
          Processar Importação <ArrowRight />
        </button>
      </div>
    </div>
  );
};
