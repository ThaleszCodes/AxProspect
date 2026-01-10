
import { supabase } from './supabase';
import { Lead, List, Script, LeadStatus, ScriptType, Project, ProjectStatus, UserSettings } from '../types';

// ID Generator Helper
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to get current user
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

// --- LEADS MAPPERS ---
const mapLeadFromDB = (row: any): Lead => ({
  id: row.id,
  businessName: row.business_name,
  company: row.company, // New field
  instagramHandle: row.instagram_handle,
  whatsapp: row.whatsapp,
  niche: row.niche,
  notes: row.notes,
  quickNote: row.quick_note,
  temperature: row.temperature,
  lastAction: row.last_action,
  status: row.status as LeadStatus,
  scriptId: row.script_id,
  listId: row.list_id,
  lastContactedAt: row.last_contacted_at,
  createdAt: row.created_at,
  history: row.history || [], // New field
  interestedService: row.interested_service,
  demandType: row.demand_type,
  urgency: row.urgency,
  leadSource: row.lead_source,
  visualReferences: row.visual_references,
});

const mapLeadToDB = (lead: Lead, userId?: string) => ({
  id: lead.id,
  user_id: userId,
  business_name: lead.businessName,
  company: lead.company, // New field
  instagram_handle: lead.instagramHandle,
  whatsapp: lead.whatsapp,
  niche: lead.niche,
  notes: lead.notes,
  quick_note: lead.quickNote,
  temperature: lead.temperature,
  last_action: lead.lastAction,
  status: lead.status,
  script_id: lead.scriptId,
  list_id: lead.listId,
  last_contacted_at: lead.lastContactedAt,
  created_at: lead.createdAt,
  history: lead.history, // New field
  interested_service: lead.interestedService,
  demand_type: lead.demandType,
  urgency: lead.urgency,
  lead_source: lead.leadSource,
  visual_references: lead.visualReferences,
});

// --- LISTS/SCRIPTS MAPPERS ---
const mapListFromDB = (row: any): List => ({
  id: row.id,
  name: row.name,
  description: row.description,
  defaultScriptId: row.default_script_id,
  createdAt: row.created_at,
});

const mapListToDB = (list: List, userId?: string) => ({
  id: list.id,
  user_id: userId,
  name: list.name,
  description: list.description,
  default_script_id: list.defaultScriptId,
  created_at: list.createdAt,
});

const mapScriptFromDB = (row: any): Script => ({
  id: row.id,
  title: row.title,
  content: row.content,
  type: row.type as ScriptType,
  isDefault: row.is_default,
});

const mapScriptToDB = (script: Script, userId?: string) => ({
  id: script.id,
  user_id: userId,
  title: script.title,
  content: script.content,
  type: script.type,
  is_default: script.isDefault,
});

// --- PROJECT MAPPERS ---
const mapProjectFromDB = (row: any): Project => ({
  id: row.id,
  leadId: row.lead_id,
  leadName: row.leads?.business_name,
  title: row.title,
  serviceType: row.service_type,
  agreedValue: row.agreed_value,
  startDate: row.start_date,
  deadline: row.deadline,
  status: row.status as ProjectStatus,
  checklist: row.checklist || { briefing: false, deposit: false, layoutApproval: false, finalPayment: false, delivery: false },
  createdAt: row.created_at
});

const mapProjectToDB = (project: Project, userId?: string) => ({
  id: project.id,
  user_id: userId,
  lead_id: project.leadId,
  title: project.title,
  service_type: project.serviceType,
  agreed_value: project.agreedValue,
  start_date: project.startDate,
  deadline: project.deadline,
  status: project.status,
  checklist: project.checklist,
  created_at: project.createdAt
});

// Helper dates
const daysAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const db = {
  // --- LEADS ---
  getLeads: async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) return [];
    return data.map(mapLeadFromDB);
  },
  
  saveLead: async (lead: Lead) => {
    const userId = await getCurrentUserId();
    const payload = mapLeadToDB(lead, userId);
    await supabase.from('leads').upsert(payload);
  },

  deleteLead: async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
  },

  deleteAllLeads: async () => {
    const userId = await getCurrentUserId();
    if(userId) {
       await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
  },

  importLeads: async (newLeads: Lead[]) => {
    const userId = await getCurrentUserId();
    const payload = newLeads.map(l => mapLeadToDB(l, userId));
    await supabase.from('leads').insert(payload);
  },

  // --- LISTS ---
  getLists: async (): Promise<List[]> => {
    const { data, error } = await supabase.from('lists').select('*');
    if (error) return [];
    return data.map(mapListFromDB);
  },

  saveList: async (list: List) => {
    const userId = await getCurrentUserId();
    const payload = mapListToDB(list, userId);
    await supabase.from('lists').upsert(payload);
  },

  deleteList: async (id: string) => {
    await supabase.from('lists').delete().eq('id', id);
  },

  // --- SCRIPTS ---
  getScripts: async (): Promise<Script[]> => {
    const { data, error } = await supabase.from('scripts').select('*');
    if (error) return [];
    return data.map(mapScriptFromDB);
  },

  saveScript: async (script: Script) => {
    const userId = await getCurrentUserId();
    const payload = mapScriptToDB(script, userId);
    await supabase.from('scripts').upsert(payload);
  },

  deleteScript: async (id: string) => {
    await supabase.from('scripts').delete().eq('id', id);
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase.from('projects').select('*, leads(business_name)');
    if (error) {
      console.error('Project fetch error', error);
      return [];
    }
    return data.map(mapProjectFromDB);
  },

  saveProject: async (project: Project) => {
    const userId = await getCurrentUserId();
    const payload = mapProjectToDB(project, userId);
    await supabase.from('projects').upsert(payload);
  },

  deleteProject: async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await supabase.from('user_settings').select('*').single();
    if (data) {
      return {
        id: data.id,
        servicesOffered: data.services_offered || [],
        avgTicket: data.avg_ticket || 0,
        dailyLimit: data.daily_limit || 20,
        idealClient: data.ideal_client || '',
        preferredHours: data.preferred_hours || ''
      };
    }
    // Return Default
    return {
      id: 'default',
      servicesOffered: ['Identidade Visual', 'Social Media', 'Web Design', 'Landing Page'],
      avgTicket: 1500,
      dailyLimit: 20,
      idealClient: 'Pequenas empresas locais',
      preferredHours: '09:00 - 11:00'
    };
  },

  saveSettings: async (settings: UserSettings) => {
    const userId = await getCurrentUserId();
    const payload = {
      id: settings.id,
      user_id: userId,
      services_offered: settings.servicesOffered,
      avg_ticket: settings.avgTicket,
      daily_limit: settings.dailyLimit,
      ideal_client: settings.idealClient,
      preferred_hours: settings.preferredHours
    };
    await supabase.from('user_settings').upsert(payload);
  },

  // --- ANALYTICS ---
  getStats: async () => {
    const leads = await db.getLeads();
    const projects = await db.getProjects();
    const total = leads.length;
    
    // Simple statuses
    const newLeads = leads.filter(l => l.status === LeadStatus.NEW).length;
    const contacted = leads.filter(l => l.status === LeadStatus.CONTACTED).length;
    
    // Group negotiation/pending
    const pending = leads.filter(l => 
      [LeadStatus.PENDING, LeadStatus.IN_NEGOTIATION, LeadStatus.BUDGET_SENT, LeadStatus.WAITING_APPROVAL].includes(l.status)
    ).length;
    
    const responded = leads.filter(l => l.status === LeadStatus.RESPONDED).length;
    const closed = leads.filter(l => l.status === LeadStatus.CLOSED).length;
    
    const funnelData = [
      { name: 'Total', value: total, fill: '#64748b' },
      { name: 'Abordados', value: contacted + responded + pending + closed, fill: '#3b82f6' },
      { name: 'Negociação', value: pending + responded, fill: '#8b5cf6' },
      { name: 'Fechados', value: closed, fill: '#f59e0b' },
    ];

    // Smart Queue
    let followUpQueue = 0;
    let coolingDown = 0;
    leads.forEach(l => {
      if ([LeadStatus.PENDING, LeadStatus.IN_NEGOTIATION, LeadStatus.BUDGET_SENT].includes(l.status) && l.lastContactedAt) {
        const d = daysAgo(l.lastContactedAt);
        if (d >= 2 && d < 5) followUpQueue++;
        if (d >= 5) coolingDown++;
      }
    });

    // Revenue by Service (from Projects)
    const revMap = new Map<string, number>();
    projects.forEach(p => {
      const current = revMap.get(p.serviceType) || 0;
      revMap.set(p.serviceType, current + (Number(p.agreedValue) || 0));
    });
    const revenueByService = Array.from(revMap.entries()).map(([name, value]) => ({ name, value }));

    const activeProjects = projects.filter(p => p.status !== ProjectStatus.DELIVERED).length;

    const responseRate = (contacted + responded + pending + closed) > 0 
      ? Math.round(((responded + pending + closed) / (contacted + responded + pending + closed)) * 100) 
      : 0;
    
    return {
      totalLeads: total,
      newLeads,
      contactedLeads: contacted,
      pendingLeads: pending,
      respondedLeads: responded,
      closedLeads: closed,
      responseRate,
      funnelData,
      followUpQueue,
      coolingDown,
      revenueByService,
      activeProjects
    };
  },

  getPendingFollowUps: async (): Promise<Lead[]> => {
    const leads = await db.getLeads();
    return leads.filter(l => {
      if ([LeadStatus.PENDING, LeadStatus.IN_NEGOTIATION, LeadStatus.BUDGET_SENT].includes(l.status) && l.lastContactedAt) {
        const d = daysAgo(l.lastContactedAt);
        return d >= 2;
      }
      return false;
    });
  }
};
