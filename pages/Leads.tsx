
import React, { useState, useEffect } from 'react';
import { db, generateId } from '../services/db';
import { Lead, LeadStatus, List, UserSettings, Project, ProjectStatus } from '../types';
import { Plus, Search, Filter, Instagram, MessageCircle, MoreVertical, Trash2, Edit, Tag, Clock, Rocket } from 'lucide-react';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Forms
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [projectData, setProjectData] = useState<Partial<Project>>({ agreedValue: 0 });

  const loadData = async () => {
    setIsLoading(true);
    const [l, lst, sett] = await Promise.all([db.getLeads(), db.getLists(), db.getSettings()]);
    setLeads(l);
    setLists(lst);
    setSettings(sett);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmDelete = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const executeDelete = async () => {
    if (leadToDelete) {
      await db.deleteLead(leadToDelete.id);
      loadData();
      setLeadToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      ...formData as Lead,
      id: editingLead ? editingLead.id : generateId(),
      createdAt: editingLead ? editingLead.createdAt : new Date().toISOString(),
      listId: formData.listId || (lists.length > 0 ? lists[0].id : undefined),
    };

    await db.saveLead(newLead);
    setIsModalOpen(false);
    setEditingLead(null);
    loadData();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    const newProject: Project = {
      id: generateId(),
      leadId: editingLead.id,
      title: projectData.title || `Projeto ${editingLead.businessName}`,
      serviceType: projectData.serviceType || 'Geral',
      agreedValue: Number(projectData.agreedValue),
      startDate: new Date().toISOString(),
      status: ProjectStatus.BRIEFING,
      checklist: { briefing: false, deposit: false, layoutApproval: false, finalPayment: false, delivery: false },
      createdAt: new Date().toISOString()
    };

    await db.saveProject(newProject);
    
    // Auto update lead status to closed
    await db.saveLead({ ...editingLead, status: LeadStatus.CLOSED });
    
    setIsProjectModalOpen(false);
    alert('Projeto criado! Veja na aba Pipeline.');
    loadData();
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData(lead);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingLead(null);
    setFormData({ 
      status: LeadStatus.NEW, 
      listId: lists[0]?.id,
      interestedService: settings?.servicesOffered[0] || '' 
    });
    setIsModalOpen(true);
  };

  const openProjectModal = (lead: Lead) => {
    setEditingLead(lead);
    setProjectData({
      title: `${lead.interestedService || 'Projeto'} - ${lead.businessName}`,
      serviceType: lead.interestedService || settings?.servicesOffered[0],
      agreedValue: settings?.avgTicket || 0
    });
    setIsProjectModalOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: LeadStatus) => {
    if ([LeadStatus.IN_NEGOTIATION, LeadStatus.BUDGET_SENT].includes(status)) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (status === LeadStatus.CLOSED) return 'bg-green-500/20 text-green-400 border-green-500/20';
    return 'bg-gray-700 text-gray-300';
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gerenciar Leads</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={openNew} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-brand-500/20 w-full md:w-auto justify-center">
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar nome ou @"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none text-white placeholder-gray-500"
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-dark-card border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none text-white appearance-none"
          >
            <option value="ALL">Todos Status</option>
            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredLeads.map(lead => (
          <div key={lead.id} className="bg-dark-card border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-gray-700 transition-colors relative">
            <div className="flex-1 pl-2">
               <div className="flex items-center gap-2 mb-1">
                 <h3 className="font-bold text-white text-lg">{lead.businessName}</h3>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(lead.status)} uppercase font-bold tracking-wide`}>
                   {lead.status}
                 </span>
               </div>
               <p className="text-brand-400 text-sm font-medium mb-1">{lead.instagramHandle}</p>
               <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  <span>{lead.niche}</span>
                  {lead.interestedService && <span className="text-pink-400 flex items-center gap-1"><Tag size={10} /> {lead.interestedService}</span>}
               </div>
            </div>

            <div className="flex items-center gap-3">
              <a href={`https://instagram.com/${lead.instagramHandle.replace('@', '')}`} target="_blank" className="p-2 bg-gray-800 text-pink-400 rounded-lg"><Instagram size={18} /></a>
              <a href={lead.whatsapp ? `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}` : '#'} target="_blank" className={`p-2 rounded-lg ${lead.whatsapp ? 'bg-gray-800 text-green-400' : 'bg-gray-800/50 text-gray-600'}`}><MessageCircle size={18} /></a>
              
              <div className="w-px h-8 bg-gray-800 mx-1"></div>
              
              {/* Fechar Projeto Action */}
              <button onClick={() => openProjectModal(lead)} title="Iniciar Projeto" className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                <Rocket size={18} />
              </button>

              <button onClick={() => openEdit(lead)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit size={18} /></button>
              <button onClick={() => confirmDelete(lead)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/New Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-card border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8">
            <h3 className="text-xl font-bold mb-4">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome do Negócio" required className="bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                <input placeholder="@instagram" required className="bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.instagramHandle} onChange={e => setFormData({...formData, instagramHandle: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input placeholder="WhatsApp" type="tel" className="bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                 <input placeholder="Nicho" className="bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})} />
              </div>
              
              {/* Design Specific Fields */}
              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700 space-y-3">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Dados do Projeto</h4>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Serviço de Interesse</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" value={formData.interestedService} onChange={e => setFormData({...formData, interestedService: e.target.value})}>
                     <option value="">Selecione...</option>
                     {settings?.servicesOffered.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs text-gray-400 mb-1">Urgência</label>
                     <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value as any})}>
                       <option value="">Normal</option>
                       <option value="BAIXA">Baixa</option>
                       <option value="MEDIA">Média</option>
                       <option value="ALTA">Alta</option>
                     </select>
                   </div>
                   <div>
                      <label className="block text-xs text-gray-400 mb-1">Origem</label>
                      <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Ex: Indicação" value={formData.leadSource} onChange={e => setFormData({...formData, leadSource: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-xs text-gray-400 mb-1">Referências Visuais (Links)</label>
                   <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-16 text-xs" placeholder="Cole links do Behance/Pinterest..." value={formData.visualReferences} onChange={e => setFormData({...formData, visualReferences: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as LeadStatus})}>
                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                 <div>
                  <label className="block text-xs text-gray-400 mb-1">Lista</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" value={formData.listId} onChange={e => setFormData({...formData, listId: e.target.value})}>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-card border border-emerald-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Rocket className="text-emerald-500" /> Iniciar Projeto</h3>
            <p className="text-sm text-gray-400 mb-4">O lead será marcado como <strong>Fechado</strong> e um novo projeto será criado no Pipeline.</p>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome do Projeto</label>
                <input required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" value={projectData.title} onChange={e => setProjectData({...projectData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Serviço Contratado</label>
                <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" value={projectData.serviceType} onChange={e => setProjectData({...projectData, serviceType: e.target.value})}>
                    {settings?.servicesOffered.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor Fechado (R$)</label>
                <input type="number" required className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" value={projectData.agreedValue} onChange={e => setProjectData({...projectData, agreedValue: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                 <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-gray-400">Cancelar</button>
                 <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Criar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
