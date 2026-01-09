import React, { useState, useEffect } from 'react';
import { db, generateId } from '../services/db';
import { List, Lead } from '../types';
import { Plus, Trash2, ListFilter, Users } from 'lucide-react';

export const Lists: React.FC = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newList, setNewList] = useState('');

  const load = async () => {
    const [l, le] = await Promise.all([db.getLists(), db.getLeads()]);
    setLists(l);
    setLeads(le);
  };

  useEffect(() => {
    load();
  }, []);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newList.trim()) return;
    await db.saveList({
      id: generateId(),
      name: newList,
      createdAt: new Date().toISOString()
    });
    setNewList('');
    load();
  };

  const deleteList = async (id: string) => {
    // Basic check if list has leads
    const hasLeads = leads.some(l => l.listId === id);
    if (hasLeads) {
      alert('Não é possível excluir uma lista que contém leads. Mova ou exclua os leads primeiro.');
      return;
    }
    if (confirm('Excluir lista?')) {
      await db.deleteList(id);
      load();
    }
  };

  const getLeadCount = (listId: string) => {
    return leads.filter(l => l.listId === listId).length;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ListFilter /> Campanhas (Listas)</h2>

      <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 mb-8">
        <form onSubmit={createList} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Nome da nova lista..." 
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500"
            value={newList}
            onChange={(e) => setNewList(e.target.value)}
          />
          <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
            <Plus size={20} /> Criar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map(list => (
          <div key={list.id} className="bg-dark-card border border-gray-800 hover:border-brand-500/50 transition-colors rounded-xl p-5 flex flex-col relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{list.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Criada em: {new Date(list.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => deleteList(list.id)}
                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="mt-auto flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-brand-400">
                <Users size={16} />
                <span className="font-bold">{getLeadCount(list.id)}</span>
                <span className="text-xs text-gray-500 uppercase">Leads</span>
              </div>
              <div className="text-xs text-gray-500">
                 Taxa Resp: {Math.floor(Math.random() * 20)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};