
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, MessageCircle, CheckCircle, Clock, Bell, Flame, Snowflake, Palette, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await db.getStats();
      setStats(data);
    };
    load();
  }, []);

  if (!stats) return <div className="p-10 text-center text-gray-500 flex flex-col items-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>Carregando estúdio...</div>;

  const cards = [
    { title: 'Projetos Ativos', value: stats.activeProjects, icon: Palette, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { title: 'Leads em Negociação', value: stats.pendingLeads, icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { title: 'Taxa de Resposta', value: `${stats.responseRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Total Fechado', value: stats.closedLeads, icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* QUICK START HERO CARD */}
      <div className="bg-gradient-to-r from-brand-900/80 to-indigo-900/80 border border-brand-500/30 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-yellow-400 fill-current" /> Sessão Foco
            </h2>
            <p className="text-gray-300 mt-1 max-w-md">
              Você tem <strong>{stats.newLeads + stats.followUpQueue} leads</strong> na fila de prioridade hoje. 
              Mantenha o ritmo para alcançar sua meta.
            </p>
          </div>
          <Link 
            to="/prospect" 
            className="bg-white text-brand-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
          >
            Começar Agora <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {(stats.followUpQueue > 0) && (
        <Link to="/pipeline" className="block bg-dark-card border border-indigo-500/30 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500 transition-colors">
          <div className="bg-indigo-500/20 p-3 rounded-full text-indigo-400 animate-pulse">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white">Follow-up Necessário</h3>
            <p className="text-sm text-gray-400">Existem <strong className="text-white">{stats.followUpQueue}</strong> leads quentes aguardando retorno.</p>
          </div>
        </Link>
      )}

      <h3 className="text-xl font-bold text-gray-300">Métricas do Negócio</h3>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-dark-card border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">{card.title}</p>
              <h3 className="text-3xl font-bold text-white mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Visual Funnel */}
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Flame className="text-orange-500" size={20} /> Funil de Vendas</h3>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#334155', opacity: 0.2}} />
                <Bar dataKey="value" barSize={25} radius={[0, 4, 4, 0]}>
                  {stats.funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Palette className="text-pink-500" size={20} /> Receita por Serviço</h3>
          </div>
          
          <div className="h-64 w-full flex items-center justify-center">
            {stats.revenueByService.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.revenueByService}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.revenueByService.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#f472b6', '#818cf8', '#34d399', '#fbbf24'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm">Sem dados de projetos ainda.</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
             {stats.revenueByService.map((entry, index) => (
               <div key={index} className="flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#f472b6', '#818cf8', '#34d399', '#fbbf24'][index % 4]}}></div>
                  {entry.name}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
