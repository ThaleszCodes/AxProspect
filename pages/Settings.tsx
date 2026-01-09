
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { UserSettings } from '../types';
import { Save, Plus, X } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [newService, setNewService] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await db.getSettings();
      setSettings(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (settings) {
      await db.saveSettings(settings);
      alert('Configurações salvas!');
    }
  };

  const addService = () => {
    if (newService && settings) {
      setSettings({
        ...settings,
        servicesOffered: [...settings.servicesOffered, newService]
      });
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    if (settings) {
      setSettings({
        ...settings,
        servicesOffered: settings.servicesOffered.filter(s => s !== service)
      });
    }
  };

  if (isLoading || !settings) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h2 className="text-2xl font-bold mb-6">Configurações do Estúdio</h2>

      <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 space-y-6">
        
        {/* Services */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 font-bold">Serviços Oferecidos</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.servicesOffered.map(s => (
              <span key={s} className="bg-brand-900/30 border border-brand-500/30 text-brand-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {s}
                <button onClick={() => removeService(s)} className="hover:text-white"><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder="Novo serviço (ex: Identidade Visual)"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
            />
            <button onClick={addService} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ticket Médio Desejado (R$)</label>
            <input 
              type="number" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
              value={settings.avgTicket}
              onChange={(e) => setSettings({...settings, avgTicket: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Limite Diário de Prospecção</label>
            <input 
              type="number" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({...settings, dailyLimit: Number(e.target.value)})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Perfil do Cliente Ideal</label>
          <textarea 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
            value={settings.idealClient}
            onChange={(e) => setSettings({...settings, idealClient: e.target.value})}
            placeholder="Ex: Clínicas de estética, Advogados, E-commerce de moda..."
          />
        </div>

        <div>
           <label className="block text-sm text-gray-400 mb-1">Horário Preferido de Abordagem</label>
           <input 
              type="text" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
              value={settings.preferredHours}
              onChange={(e) => setSettings({...settings, preferredHours: e.target.value})}
            />
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Save size={20} /> Salvar Configurações
        </button>

      </div>
    </div>
  );
};
