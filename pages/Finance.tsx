
import React, { useState, useEffect } from 'react';
import { db, generateId } from '../services/db';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Trash2, Calendar, ArrowRightLeft, Target } from 'lucide-react';

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('INCOME');
  const [category, setCategory] = useState('Venda de Projeto');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    const data = await db.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newTx: Transaction = {
      id: generateId(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString()
    };

    await db.saveTransaction(newTx);
    
    // Reset form
    setAmount('');
    setDescription('');
    setIsModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir transação?')) {
      await db.deleteTransaction(id);
      load();
    }
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  
  // ROI Calculation: (Gain from Investment - Cost of Investment) / Cost of Investment
  // Here assuming 'Expense' is Cost and 'Income' is Gain
  const roi = totalExpense > 0 ? ((totalIncome - totalExpense) / totalExpense) * 100 : 0;

  // Chart Data Preparation (Group by Month)
  const chartDataMap = new Map<string, { name: string, Receita: number, Despesa: number }>();
  
  transactions.forEach(t => {
     const dateObj = new Date(t.date);
     const key = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
     
     if (!chartDataMap.has(key)) {
        chartDataMap.set(key, { name: key, Receita: 0, Despesa: 0 });
     }
     
     const entry = chartDataMap.get(key)!;
     if (t.type === 'INCOME') entry.Receita += t.amount;
     else entry.Despesa += t.amount;
  });

  const chartData = Array.from(chartDataMap.values()).reverse().slice(0, 6); // Last 6 months

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <DollarSign className="text-emerald-400" /> Financeiro
           </h2>
           <p className="text-gray-400 text-sm">Controle de caixa e ROI</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-dark-card border border-gray-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs uppercase font-bold tracking-wider">
               <TrendingUp size={14} /> Receita Total
            </div>
            <div className="text-2xl font-bold text-emerald-400">
               R$ {totalIncome.toLocaleString('pt-BR')}
            </div>
         </div>
         <div className="bg-dark-card border border-gray-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs uppercase font-bold tracking-wider">
               <TrendingDown size={14} /> Despesas / Invest.
            </div>
            <div className="text-2xl font-bold text-red-400">
               R$ {totalExpense.toLocaleString('pt-BR')}
            </div>
         </div>
         <div className="bg-dark-card border border-gray-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs uppercase font-bold tracking-wider">
               <PieChart size={14} /> Lucro Líquido
            </div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
               R$ {netProfit.toLocaleString('pt-BR')}
            </div>
         </div>
         <div className="bg-dark-card border border-gray-800 p-4 rounded-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10">
               <Target size={60} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs uppercase font-bold tracking-wider">
               <Target size={14} /> ROI Estimado
            </div>
            <div className="text-2xl font-bold text-blue-400">
               {totalExpense === 0 && totalIncome > 0 ? '∞' : `${roi.toFixed(1)}%`}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart Section */}
         <div className="lg:col-span-2 bg-dark-card border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><ArrowRightLeft size={18} /> Fluxo de Caixa (Últimos Meses)</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`R$ ${value}`, '']}
                     />
                     <Bar dataKey="Receita" fill="#34d399" radius={[4, 4, 0, 0]} />
                     <Bar dataKey="Despesa" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Recent Transactions List */}
         <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
            <h3 className="font-bold text-lg mb-4">Histórico Recente</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
               {transactions.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum lançamento.</p>}
               {transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors group">
                     <div>
                        <div className="font-bold text-sm text-gray-200">{t.description}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                           <span>{new Date(t.date).toLocaleDateString()}</span>
                           <span className="bg-gray-800 px-1 rounded">{t.category}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={`font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                           {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                        </div>
                        <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Trash2 size={12} /> Excluir
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* New Transaction Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-dark-card border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
               <h3 className="text-xl font-bold mb-4">Novo Lançamento</h3>
               <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                     <button
                        type="button" 
                        onClick={() => setType('INCOME')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${type === 'INCOME' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
                     >
                        Entrada
                     </button>
                     <button
                        type="button" 
                        onClick={() => setType('EXPENSE')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${type === 'EXPENSE' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                     >
                        Saída
                     </button>
                  </div>

                  <div>
                     <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                     <input 
                        type="number" step="0.01" required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-lg font-mono"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                     />
                  </div>

                  <div>
                     <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                     <input 
                        type="text" required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ex: Pagamento Projeto X"
                     />
                  </div>

                  <div>
                     <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                     <select 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                     >
                        <option value="Venda de Projeto">Venda de Projeto</option>
                        <option value="Anúncios (Ads)">Anúncios (Ads)</option>
                        <option value="Ferramentas">Ferramentas / Software</option>
                        <option value="Freelancers">Freelancers</option>
                        <option value="Impostos">Impostos</option>
                        <option value="Outros">Outros</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs text-gray-400 mb-1">Data</label>
                     <input 
                        type="date" required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                     />
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                     <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">Salvar</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
