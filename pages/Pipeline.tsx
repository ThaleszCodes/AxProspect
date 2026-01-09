
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Lead, LeadStatus, Project, ProjectStatus, ProjectChecklist } from '../types';
import { Clock, CheckSquare, DollarSign, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';

export const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [l, p] = await Promise.all([db.getLeads(), db.getProjects()]);
    setLeads(l);
    setProjects(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleChecklist = async (project: Project, key: keyof ProjectChecklist) => {
    const updated = { ...project, checklist: { ...project.checklist, [key]: !project.checklist[key] } };
    await db.saveProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const moveProjectStatus = async (project: Project, nextStatus: ProjectStatus) => {
    const updated = { ...project, status: nextStatus };
    await db.saveProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Filter Data for Columns
  const negotiationLeads = leads.filter(l => [LeadStatus.IN_NEGOTIATION, LeadStatus.BUDGET_SENT, LeadStatus.WAITING_APPROVAL].includes(l.status));
  
  const briefingProjects = projects.filter(p => p.status === ProjectStatus.BRIEFING);
  const productionProjects = projects.filter(p => p.status === ProjectStatus.PRODUCTION || p.status === ProjectStatus.REVIEW);
  const deliveredProjects = projects.filter(p => p.status === ProjectStatus.DELIVERED);

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div className="bg-dark-card border border-gray-700 rounded-lg p-3 mb-3 shadow-sm hover:border-brand-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white text-sm">{project.title}</h4>
        <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{project.serviceType}</span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{project.leadName || 'Cliente'}</p>
      
      {/* Checklist Mini */}
      <div className="space-y-1 mb-3">
        {project.status === ProjectStatus.BRIEFING && (
          <div 
            onClick={() => toggleChecklist(project, 'briefing')}
            className={`flex items-center gap-2 text-xs cursor-pointer ${project.checklist.briefing ? 'text-green-400' : 'text-gray-500'}`}
          >
            <CheckSquare size={12} /> Briefing Respondido
          </div>
        )}
        {project.status === ProjectStatus.BRIEFING && (
          <div 
             onClick={() => toggleChecklist(project, 'deposit')}
             className={`flex items-center gap-2 text-xs cursor-pointer ${project.checklist.deposit ? 'text-green-400' : 'text-gray-500'}`}
          >
            <DollarSign size={12} /> Sinal Pago
          </div>
        )}
        {(project.status === ProjectStatus.PRODUCTION || project.status === ProjectStatus.REVIEW) && (
           <div 
             onClick={() => toggleChecklist(project, 'layoutApproval')}
             className={`flex items-center gap-2 text-xs cursor-pointer ${project.checklist.layoutApproval ? 'text-green-400' : 'text-gray-500'}`}
          >
            <CheckCircle2 size={12} /> Layout Aprovado
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
         <span className="text-xs font-mono text-gray-500">{new Date(project.createdAt).toLocaleDateString().slice(0,5)}</span>
         <button 
           onClick={() => {
             const next = project.status === ProjectStatus.BRIEFING ? ProjectStatus.PRODUCTION : 
                          project.status === ProjectStatus.PRODUCTION ? ProjectStatus.DELIVERED : ProjectStatus.DELIVERED;
             if (project.status !== ProjectStatus.DELIVERED) moveProjectStatus(project, next);
           }}
           className="text-brand-400 hover:text-white"
         >
           <ChevronRight size={16} />
         </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">Fluxo Criativo</h2>
      
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-[1000px] pb-4">
          
          {/* Column 1: Negociação (Leads) */}
          <div className="w-72 bg-gray-900/50 rounded-xl flex flex-col border border-gray-800/50">
            <div className="p-3 border-b border-gray-800 bg-gray-800/20 rounded-t-xl font-bold text-indigo-400 flex justify-between">
              <span>Em Negociação</span>
              <span className="bg-gray-800 px-2 rounded text-xs py-0.5">{negotiationLeads.length}</span>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {negotiationLeads.map(lead => (
                <div key={lead.id} className="bg-dark-card border border-gray-700 p-3 rounded-lg mb-2 opacity-90 hover:opacity-100">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">{lead.businessName}</span>
                    <span className="text-[9px] bg-indigo-900/50 text-indigo-300 px-1 rounded">{lead.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{lead.interestedService || lead.niche}</p>
                </div>
              ))}
              {negotiationLeads.length === 0 && <div className="text-xs text-center text-gray-600 mt-4">Nenhuma negociação ativa</div>}
            </div>
          </div>

          {/* Column 2: Briefing & Entrada (Projects) */}
          <div className="w-72 bg-gray-900/50 rounded-xl flex flex-col border border-gray-800/50">
            <div className="p-3 border-b border-gray-800 bg-gray-800/20 rounded-t-xl font-bold text-yellow-400 flex justify-between">
              <span>Briefing & Entrada</span>
              <span className="bg-gray-800 px-2 rounded text-xs py-0.5">{briefingProjects.length}</span>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {briefingProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>

          {/* Column 3: Produção (Projects) */}
          <div className="w-72 bg-gray-900/50 rounded-xl flex flex-col border border-gray-800/50">
            <div className="p-3 border-b border-gray-800 bg-gray-800/20 rounded-t-xl font-bold text-blue-400 flex justify-between">
              <span>Produção & Aprovação</span>
              <span className="bg-gray-800 px-2 rounded text-xs py-0.5">{productionProjects.length}</span>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {productionProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>

          {/* Column 4: Entregue (Projects) */}
          <div className="w-72 bg-gray-900/50 rounded-xl flex flex-col border border-gray-800/50">
            <div className="p-3 border-b border-gray-800 bg-gray-800/20 rounded-t-xl font-bold text-green-400 flex justify-between">
              <span>Finalizado</span>
              <span className="bg-gray-800 px-2 rounded text-xs py-0.5">{deliveredProjects.length}</span>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {deliveredProjects.map(p => (
                 <div key={p.id} className="bg-dark-card border border-gray-800 p-3 rounded-lg mb-2 opacity-70">
                    <div className="flex justify-between">
                       <span className="font-bold text-sm text-gray-300">{p.title}</span>
                       <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Valor: R$ {p.agreedValue}</p>
                 </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
