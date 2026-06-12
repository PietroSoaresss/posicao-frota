export interface Estado {
  codigo: number;
  nome: string;
  sigla: string;
}

export interface Cidade {
  codigo: number;
  nome: string;
  cod_estado: number;
}

export interface Fabricante {
  codigo: number;
  nome: string;
}

export interface Modelo {
  codigo: number;
  nome: string;
  cod_fabricante: number;
}

export interface Veiculo {
  codigo: number;
  placa: string;
  tipo: 'Cavalo' | 'Carreta';
  chassi: string;
  renavam: string;
  ano_fabricacao: number;
  ano_modelo: number;
  cod_modelo: number;
}

export interface Empresa {
  codigo: number;
  razao_social: string;
  cnpj: string;
  cep: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  cod_cidade: number;
}

export interface Motorista {
  codigo: number;
  nome: string;
  sexo: 'M' | 'F';
  cnh: string;
  validade_cnh: string;
  data_nascimento?: string;
  cod_cidade?: number;
}

export type UserRole = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  codigo: number;
  username: string;
  role: UserRole;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username: string;
  role: UserRole;
}

export const POSICAO_FROTA_STATUS = [
  'Aguardando Descarga',
  'Aguardando Descarga na Diária',
  'Aguardando Carregar',
  'Aguardando Carregar na Diária',
  'Aguardando Troca de Nota',
  'Carregando',
  'Descarregando',
  'Desloc Carregar',
  'Carregado/Folga',
  'Vazio',
  'Viajando',
  'Vazio/Aguardando Canhoto',
  'Aguardando NF',
  'Repaletizando',
  'Folga',
] as const;

export type StatusType = typeof POSICAO_FROTA_STATUS[number];

export const FRETE_STATUS = [
  'Autorizado p/pgto',
  'Bloq Canhoto NF Frete/Venda',
  'Bloq Canhoto NF Frete/Transferência',
  'Solicitar Desacordo',
  'Desacordo Solicitado',
  'Falta Lançamento',
  'Em tratativa',
  'Pavi 3°',
  'Complemento',
  'Pagamento Parcial',
  'Complemento Solicitado',
  'Complemento Aprovado',
  'Prev Pagamento',
] as const;

export const FRETE_TIPOS = [
  'Frete',
  'Complemento',
  'Pallet',
  'Indenizado',
  'NFS',
  'Devolução',
  'Estocagem',
  'Deslocamento',
  'Adicional Frete',
] as const;

export const PEDAGIO_STATUS = [
  'Solicitar Reembolso',
  'Reembolso Solicitado',
  'Pedágio Incluso',
  'Pedágio Pago',
  'Sem pedágio',
] as const;

export interface StatusMeta {
  solid: string;
  fg: string;
  bg: string;
  border: string;
  label: string;
}

export interface ViagemRaw {
  codigo: number;
  data_inicio: string;
  data_fim: string | null;
  valor_frete: number;
  valor_pedagio: number;
  status: StatusType;
  cod_motorista: number;
  cod_cavalo: number;
  cod_carreta: number;
  cod_origem: number;
  cod_destino: number;
  km: number;
  progresso: number;
  observacoes?: string;
}

export interface Viagem extends ViagemRaw {
  codigoStr: string;
  motorista: Motorista | null;
  cavalo: Veiculo | null;
  carreta: Veiculo | null;
  origemEmpresa: Empresa | null;
  destinoEmpresa: Empresa | null;
  origemCidade: Cidade | null;
  destinoCidade: Cidade | null;
  origemLabel: string;
  destinoLabel: string;
  modeloLabel: string;
}

export interface Frete {
  id?: number;
  trip?: { id: number } | null;
  deliveryValue: number;
  deliveryStatus: string;
  date: string;           // formato: 'YYYY-MM-DD'
  paymentDate?: string;
  deadline?: string;
  deliveryType?: string;
  boarding?: string;
  cte?: string;
  complementaryCte?: string;
  icms?: number;
  complementaryIcms?: string;
  tollValue?: number;
  tollStatus?: string;
  observations?: string;
  complementaryDelivery?: string;
}

export interface TrackingPosition {
  packetId: number;
  sascarVehicleId: number | null;
  licensePlate: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  ignition: number | null;
  direction: number | null;
  odometer: number | null;
  city: string | null;
  state: string | null;
  street: string | null;
  packetDateUtc: string;
  positionDateUtc: string | null;
  ingestedAt: string;
}

export interface TrackingTrip {
  tripId: number;
  tripCode: string;
  status: string;
  startDate: string;
  endDate: string;
  driverName: string;
  horsePlate: string;
  trailerPlate: string | null;
  originLabel: string;
  destinationLabel: string;
  latestPosition: TrackingPosition | null;
  trail: TrackingPosition[];
  stale: boolean;
  missingPosition: boolean;
}

export interface TrackingSyncResult {
  status: 'ok' | 'error' | 'skipped' | string;
  startedAt: string;
  finishedAt: string;
  received: number;
  inserted: number;
  duplicates: number;
  ignored: number;
  message: string;
}

export interface TrackingStatus {
  enabled: boolean;
  running: boolean;
  syncIntervalMs: number;
  historyRetentionDays: number;
  lastSync: TrackingSyncResult | null;
}
