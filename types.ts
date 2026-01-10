
export enum LeadStatus {
  NEW = 'Novo',
  CONTACTED = 'Abordado',
  PENDING = 'Pendente',
  RESPONDED = 'Respondeu',
  IN_NEGOTIATION = 'Em Negociação',
  BUDGET_SENT = 'Orçamento Enviado',
  WAITING_APPROVAL = 'Aguardando Aprovação',
  NOT_INTERESTED = 'Sem Interesse',
  CLOSED = 'Fechado',
  ARCHIVED = 'Arquivado'
}

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | null;
export type DemandType = 'PONTUAL' | 'RECORRENTE' | 'INDEFINIDO';
export type UrgencyLevel = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface HistoryItem {
  id: string;
  date: string;
  type: 'NOTE' | 'STATUS_CHANGE' | 'CONTACT';
  content: string;
}

export interface Lead {
  id: string;
  businessName: string; // Used as Contact Name now
  company?: string;     // New Company Name field
  instagramHandle: string;
  whatsapp?: string;
  niche: string;
  notes?: string;
  quickNote?: string;
  temperature?: LeadTemperature;
  lastAction?: string;
  status: LeadStatus;
  scriptId?: string;
  listId?: string;
  lastContactedAt?: string;
  createdAt: string;
  
  // History
  history?: HistoryItem[];

  // Design Specifics
  interestedService?: string;
  demandType?: DemandType;
  urgency?: UrgencyLevel;
  leadSource?: string;
  visualReferences?: string;
}

export interface List {
  id: string;
  name: string;
  description?: string;
  defaultScriptId?: string;
  createdAt: string;
}

export enum ScriptType {
  SHORT_OPENER = 'Abertura Curta',
  MEDIUM_OPENER = 'Abertura Média',
  FOLLOW_UP = 'Follow-up',
  REENGAGEMENT = 'Reengajamento',
  FULL_PITCH = 'Script Completo',
  OBJECTION_PRICE = 'Objeção: Preço',      
  OBJECTION_PARTNER = 'Objeção: Sócio',    
  OBJECTION_LATER = 'Objeção: Momento',    
  OBJECTION_TRUST = 'Objeção: Confiança'   
}

export interface Script {
  id: string;
  title: string;
  content: string;
  type: ScriptType;
  isDefault?: boolean;
}

// Project & Pipeline
export enum ProjectStatus {
  BRIEFING = 'Briefing',
  PRODUCTION = 'Produção',
  REVIEW = 'Aprovação/Ajustes',
  DELIVERED = 'Entregue'
}

export interface ProjectChecklist {
  briefing: boolean;
  deposit: boolean;
  layoutApproval: boolean;
  finalPayment: boolean;
  delivery: boolean;
}

export interface Project {
  id: string;
  leadId: string;
  leadName?: string;
  title: string;
  serviceType: string;
  agreedValue: number;
  startDate: string;
  deadline?: string;
  status: ProjectStatus;
  checklist: ProjectChecklist;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  servicesOffered: string[];
  avgTicket: number;
  dailyLimit: number;
  idealClient: string;
  preferredHours: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  pendingLeads: number;
  respondedLeads: number;
  closedLeads: number;
  responseRate: number;
  funnelData: { name: string; value: number; fill: string }[];
  followUpQueue: number;
  coolingDown: number;
  revenueByService: { name: string; value: number }[];
  activeProjects: number;
}
