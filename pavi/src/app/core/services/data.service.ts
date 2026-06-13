import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Cidade,
  CreateUserRequest,
  Empresa,
  Estado,
  Fabricante,
  Frete,
  Modelo,
  Motorista,
  POSICAO_FROTA_STATUS,
  StatusMeta,
  StatusType,
  UpdateUserRequest,
  Usuario,
  Veiculo,
  Viagem,
  ViagemRaw,
} from '../models/models';
import { ApiService, UserApiResponse } from './api.service';
import { AuthService } from './auth.service';

type ApiTripStop = {
  company?: { id?: number | null } | null;
  order?: number | null;
};

@Injectable({ providedIn: 'root' })
export class DataService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  isLoading = signal(false);
  apiError = signal<string | null>(null);
  lastSync = signal<Date | null>(null);

  private _estados = signal<Estado[]>([]);
  private _cidades = signal<Cidade[]>([]);
  private _fabricantes = signal<Fabricante[]>([]);
  private _modelos = signal<Modelo[]>([]);
  private _veiculos = signal<Veiculo[]>([]);
  private _empresas = signal<Empresa[]>([]);
  private _motoristas = signal<Motorista[]>([]);
  private _usuarios = signal<Usuario[]>([]);
  private _viagensRaw = signal<ViagemRaw[]>([]);
  private _fretes = signal<Frete[]>([]);

  readonly ESTADOS = this._estados.asReadonly();
  readonly CIDADES = this._cidades.asReadonly();
  readonly FABRICANTES = this._fabricantes.asReadonly();
  readonly MODELOS = this._modelos.asReadonly();
  readonly VEICULOS = this._veiculos.asReadonly();
  readonly EMPRESAS = this._empresas.asReadonly();
  readonly MOTORISTAS = this._motoristas.asReadonly();
  readonly USUARIOS = this._usuarios.asReadonly();
  readonly FRETES = this._fretes.asReadonly();

  readonly POSICAO_FROTA_STATUS = POSICAO_FROTA_STATUS;

  readonly STATUS_META: Record<StatusType, StatusMeta> = {
    'Aguardando Descarga': { solid: '#ef6c00', fg: '#b45309', bg: '#fff7ed', border: '#fed7aa', label: 'Aguardando Descarga' },
    'Aguardando Descarga na Diária': { solid: '#c2410c', fg: '#9a3412', bg: '#ffedd5', border: '#fdba74', label: 'Aguardando Descarga na Diária' },
    'Aguardando Carregar': { solid: '#085eac', fg: '#085eac', bg: '#e8f0fe', border: '#c2d7f5', label: 'Aguardando Carregar' },
    'Aguardando Carregar na Diária': { solid: '#1d4ed8', fg: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', label: 'Aguardando Carregar na Diária' },
    'Aguardando Troca de Nota': { solid: '#7c3aed', fg: '#6d28d9', bg: '#f3e8ff', border: '#ddd6fe', label: 'Aguardando Troca de Nota' },
    'Carregando': { solid: '#0284c7', fg: '#0369a1', bg: '#e0f2fe', border: '#bae6fd', label: 'Carregando' },
    'Descarregando': { solid: '#ea580c', fg: '#c2410c', bg: '#ffedd5', border: '#fed7aa', label: 'Descarregando' },
    'Desloc Carregar': { solid: '#0f766e', fg: '#0f766e', bg: '#ccfbf1', border: '#99f6e4', label: 'Desloc Carregar' },
    'Carregado/Folga': { solid: '#16a34a', fg: '#15803d', bg: '#dcfce7', border: '#bbf7d0', label: 'Carregado/Folga' },
    'Vazio': { solid: '#64748b', fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1', label: 'Vazio' },
    'Viajando': { solid: '#2563eb', fg: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', label: 'Viajando' },
    'Vazio/Aguardando Canhoto': { solid: '#9333ea', fg: '#7e22ce', bg: '#f3e8ff', border: '#e9d5ff', label: 'Vazio/Aguardando Canhoto' },
    'Aguardando NF': { solid: '#ca8a04', fg: '#a16207', bg: '#fef9c3', border: '#fde68a', label: 'Aguardando NF' },
    'Repaletizando': { solid: '#be123c', fg: '#be123c', bg: '#ffe4e6', border: '#fecdd3', label: 'Repaletizando' },
    'Folga': { solid: '#2e7d32', fg: '#2e7d32', bg: '#e8f5e9', border: '#bcdfbf', label: 'Folga' },
  };

  async login(username: string, password: string): Promise<boolean> {
    try {
      this.apiError.set(null);
      await this.api.login(username, password);
      this.lastSync.set(new Date());
      return true;
    } catch (e: any) {
      this.apiError.set('Erro ao autenticar: ' + this.extractErrorMessage(e));
      return false;
    }
  }

  async syncAll(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.apiError.set(null);
    const errors: string[] = [];

    const safeSync = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (e: any) {
        errors.push(`${name}: ${this.extractErrorMessage(e)}`);
      }
    };

    await Promise.all([
      safeSync('Estados/Cidades', () => this.syncEstados()),
      safeSync('Fabricantes',     () => this.syncFabricantes()),
      safeSync('Modelos',         () => this.syncModelos()),
    ]);

    await Promise.all([
      safeSync('Empresas',    () => this.syncEmpresas()),
      safeSync('Motoristas',  () => this.syncMotoristas()),
      safeSync('Veículos',    () => this.syncVeiculos()),
      safeSync('Viagens',     () => this.syncViagens()),
      safeSync('Fretes',      () => this.syncFretes()),
    ]);

    if (this.auth.isAdmin()) {
      await safeSync('Usuários', () => this.syncUsuarios());
    } else {
      this._usuarios.set([]);
    }

    this.lastSync.set(new Date());
    this.isLoading.set(false);

    if (errors.length > 0) {
      this.apiError.set('Erros na sincronização: ' + errors.join('; '));
    }
  }

  async syncViagens(): Promise<void> {
    const trips = await this.api.getTrips();
    this._viagensRaw.set(
      trips.map((trip: any) => {
        const origin      = this.primaryStop(trip.origins);
        const destination = this.primaryStop(trip.destinations);
        return {
          codigo:        Number(trip.id),
          data_inicio:   trip.startDate || '',
          data_fim:      trip.endDate || null,
          valor_frete:   this.moneyFromApi(trip.freightValue),
          valor_pedagio: this.moneyFromApi(trip.tollValue),
          status:        this.statusFromApi(trip.status),
          cod_motorista: trip.driver?.id   || 0,
          cod_cavalo:    trip.horse?.id    || 0,
          cod_carreta:   trip.trailer?.id  || 0,
          cod_origem:    origin?.company?.id      || 0,
          cod_destino:   destination?.company?.id || 0,
          km:            Number(trip.distance ?? 0),
          progresso:     Number(trip.progress ?? 0),
          observacoes:   trip.notes || '',
        } satisfies ViagemRaw;
      })
    );
  }

  async syncFretes(): Promise<void> {
    const deliveries = await this.api.getDeliveries();
    this._fretes.set(
      deliveries.map((delivery: any) => ({
        ...delivery,
        date: this.dateFromApi(delivery.date),
        paymentDate: this.dateFromApi(delivery.paymentDate),
        deadline: this.dateFromApi(delivery.deadline),
        deliveryStatus: this.deliveryStatusFromApi(delivery.deliveryStatus),
        tollStatus: this.tollStatusFromApi(delivery.tollStatus),
      })) as Frete[]
    );
  }

  /** Normaliza qualquer formato de data vindo da API para 'YYYY-MM-DD' (ou '' se vazio). */
  dateFromApi(value: any): string {
    if (value == null || value === '') return '';
    // Jackson pode mandar array [ano, mes, dia]
    if (Array.isArray(value) && value.length >= 3) {
      const [y, m, d] = value;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    // String: pega só a parte da data (descarta hora se houver 'T')
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return '';
  }

  async syncMotoristas(): Promise<void> {
    const drivers = await this.api.getDrivers();
    this._motoristas.set(
      drivers.map((driver: any) => ({
        codigo:           driver.id,
        nome:             driver.name,
        sexo:             (driver.sex || 'M') as 'M' | 'F',
        cnh:              driver.licenseNumber   || '',
        validade_cnh:     driver.licenseExpiration || '',
        data_nascimento:  driver.birthDate       || '',
        cod_cidade:       driver.city?.id        || 0,
      }))
    );
  }

  async syncVeiculos(): Promise<void> {
    const vehicles = await this.api.getVehicles();
    this._veiculos.set(
      vehicles.map((vehicle: any) => ({
        codigo:          vehicle.id,
        placa:           vehicle.plate || '',
        tipo:            this.vehicleTypeFromApi(vehicle.type),
        chassi:          vehicle.chassis  || '',
        renavam:         vehicle.renavam  || '',
        ano_fabricacao:  Number(vehicle.manufacturingYear ?? vehicle.modelYear ?? new Date().getFullYear()),
        ano_modelo:      Number(vehicle.modelYear ?? vehicle.manufacturingYear ?? new Date().getFullYear()),
        cod_modelo:      vehicle.vehicleModel?.id || 0,
      }))
    );
  }

  async syncUsuarios(): Promise<void> {
    if (!this.auth.isAdmin()) { this._usuarios.set([]); return; }
    try {
      this.apiError.set(null);
      const users = await this.api.getUsers();
      this._usuarios.set(users.map(user => this.userFromApi(user)));
    } catch (e: any) {
      this.apiError.set(this.extractErrorMessage(e));
      this._usuarios.set([]);
    }
  }

  async syncEmpresas(): Promise<void> {
    const companies = await this.api.getCompanies();
    this._empresas.set(
      companies.map((company: any) => ({
        codigo:       company.id,
        razao_social: company.corporateName || '',
        cnpj:         company.cnpj          || '',
        cep:          company.zipCode       || '',
        bairro:       company.neighborhood  || '',
        rua:          company.street        || '',
        numero:       company.number        || '',
        complemento:  company.complement    || '',
        cod_cidade:   company.city?.id      || 0,
      }))
    );
  }

  async syncEstados(): Promise<void> {
    const [states, cities] = await Promise.all([this.api.getStates(), this.api.getCities()]);
    this._estados.set(states.map((s: any) => ({ codigo: s.id, nome: s.name, sigla: s.acronym })));
    this._cidades.set(cities.map((c: any) => ({ codigo: c.id, nome: c.name, cod_estado: c.state?.id || 0 })));
  }

  async syncFabricantes(): Promise<void> {
    const manufacturers = await this.api.getManufacturers();
    this._fabricantes.set(manufacturers.map((m: any) => ({ codigo: m.id, nome: m.name })));
  }

  async syncModelos(): Promise<void> {
    const models = await this.api.getVehicleModels();
    this._modelos.set(models.map((m: any) => ({ codigo: m.id, nome: m.name, cod_fabricante: m.manufacturer?.id || 0 })));
  }

  // --- Lookups ---
  estadoById(cod: number)    { return this._estados().find(x => x.codigo === cod); }
  cidadeById(cod: number)    { return this._cidades().find(x => x.codigo === cod); }
  modeloById(cod: number)    { return this._modelos().find(x => x.codigo === cod); }
  veiculoById(cod: number)   { return this._veiculos().find(x => x.codigo === cod); }
  motoristaById(cod: number) { return this._motoristas().find(x => x.codigo === cod); }
  empresaById(cod: number)   { return this._empresas().find(x => x.codigo === cod); }

  cidadeLabel(cod: number): string {
    const cidade = this.cidadeById(cod);
    if (!cidade) return '—';
    const estado = this.estadoById(cidade.cod_estado);
    return `${cidade.nome}/${estado?.sigla ?? '??'}`;
  }

  modeloCompleto(cod: number): string {
    const modelo = this.modeloById(cod);
    if (!modelo) return '—';
    const fabricante = this._fabricantes().find(x => x.codigo === modelo.cod_fabricante);
    return `${fabricante ? fabricante.nome + ' ' : ''}${modelo.nome}`.trim();
  }

  brl(n: number | null): string {
    if (n == null) return 'R$ 0,00';
    return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  brlCents(n: number | null): string { return this.brl(n); }

  fmtData(s: string | null): string {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  extractError(e: any): string { return this.extractErrorMessage(e); }

  readonly VIAGENS = computed(() => {
    const raw       = this._viagensRaw();
    const motoristas = this._motoristas();
    const veiculos   = this._veiculos();
    const empresas   = this._empresas();
    const cidades    = this._cidades();
    const estados    = this._estados();

    return raw.map(viagem => {
      const motorista      = motoristas.find(x => x.codigo === viagem.cod_motorista)  ?? null;
      const cavalo         = veiculos.find(x => x.codigo === viagem.cod_cavalo)        ?? null;
      const carreta        = veiculos.find(x => x.codigo === viagem.cod_carreta)       ?? null;
      const origemEmpresa  = empresas.find(x => x.codigo === viagem.cod_origem)        ?? null;
      const destinoEmpresa = empresas.find(x => x.codigo === viagem.cod_destino)       ?? null;
      const origemCidade   = origemEmpresa  ? cidades.find(x => x.codigo === origemEmpresa.cod_cidade)  ?? null : null;
      const destinoCidade  = destinoEmpresa ? cidades.find(x => x.codigo === destinoEmpresa.cod_cidade) ?? null : null;
      const origemEstado   = origemCidade   ? estados.find(x => x.codigo === origemCidade.cod_estado)   ?? null : null;
      const destinoEstado  = destinoCidade  ? estados.find(x => x.codigo === destinoCidade.cod_estado)  ?? null : null;

      return {
        ...viagem,
        codigoStr:     'P-' + String(viagem.codigo).padStart(3, '0'),
        motorista, cavalo, carreta,
        origemEmpresa, destinoEmpresa, origemCidade, destinoCidade,
        origemLabel:  origemCidade  ? `${origemCidade.nome}/${origemEstado?.sigla  ?? '??'}` : '—',
        destinoLabel: destinoCidade ? `${destinoCidade.nome}/${destinoEstado?.sigla ?? '??'}` : 'Sem destino',
        modeloLabel:  cavalo ? this.modeloCompleto(cavalo.cod_modelo) : '—',
      } satisfies Viagem;
    });
  });

  // --- Viagens CRUD ---
  async addViagem(viagem: Omit<ViagemRaw, 'codigo'>): Promise<Viagem | null> {
    try {
      this.apiError.set(null);
      const created = await this.api.createTrip(this.tripPayloadFromRaw({ ...viagem, codigo: 0 }));
      await this.syncViagens();
      return this.VIAGENS().find(x => x.codigo === created.id) || null;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return null; }
  }

  async updateViagem(codigo: number, updates: Partial<ViagemRaw>): Promise<boolean> {
    try {
      const current = this._viagensRaw().find(x => x.codigo === codigo);
      if (!current) return false;
      const merged: ViagemRaw = {
        ...current, ...updates,
        data_fim:    updates.data_fim    === undefined ? current.data_fim    : updates.data_fim,
        observacoes: updates.observacoes ?? current.observacoes ?? '',
      };
      await this.api.updateTrip(codigo, this.tripPayloadFromRaw(merged));
      await this.syncViagens();
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  async deleteViagem(codigo: number): Promise<boolean> {
    try {
      await this.api.deleteTrip(codigo);
      this._viagensRaw.update(v => v.filter(x => x.codigo !== codigo));
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  // --- Motoristas CRUD ---
  async addMotorista(motorista: Omit<Motorista, 'codigo'>): Promise<Motorista | null> {
    try {
      const created = await this.api.createDriver({
        name: motorista.nome, licenseNumber: motorista.cnh, sex: motorista.sexo,
        licenseExpiration: motorista.validade_cnh, birthDate: motorista.data_nascimento,
        city: { id: motorista.cod_cidade },
      });
      await this.syncMotoristas();
      return this._motoristas().find(x => x.codigo === created.id) || null;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return null; }
  }

  async updateMotorista(codigo: number, updates: Partial<Motorista>): Promise<boolean> {
    try {
      const m = this._motoristas().find(x => x.codigo === codigo);
      if (!m) return false;
      await this.api.updateDriver(codigo, {
        name: updates.nome ?? m.nome, licenseNumber: updates.cnh ?? m.cnh,
        sex: updates.sexo ?? m.sexo, licenseExpiration: updates.validade_cnh ?? m.validade_cnh,
        birthDate: updates.data_nascimento ?? m.data_nascimento,
        city: { id: updates.cod_cidade ?? m.cod_cidade },
      });
      await this.syncMotoristas();
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  async deleteMotorista(codigo: number): Promise<boolean> {
    try {
      await this.api.deleteDriver(codigo);
      this._motoristas.update(v => v.filter(x => x.codigo !== codigo));
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  // --- Veículos CRUD ---
  async addVeiculo(veiculo: Omit<Veiculo, 'codigo'>): Promise<Veiculo | null> {
    try {
      const created = await this.api.createVehicle(this.vehiclePayloadFromModel(veiculo));
      await this.syncVeiculos();
      return this._veiculos().find(x => x.codigo === created.id) || null;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return null; }
  }

  async updateVeiculo(codigo: number, updates: Partial<Veiculo>): Promise<boolean> {
    try {
      const v = this._veiculos().find(x => x.codigo === codigo);
      if (!v) return false;
      await this.api.updateVehicle(codigo, this.vehiclePayloadFromModel({ ...v, ...updates, ano_modelo: updates.ano_modelo ?? v.ano_modelo }));
      await this.syncVeiculos();
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  async deleteVeiculo(codigo: number): Promise<boolean> {
    try {
      await this.api.deleteVehicle(codigo);
      this._veiculos.update(v => v.filter(x => x.codigo !== codigo));
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  // --- Empresas CRUD ---
  async addEmpresa(empresa: Omit<Empresa, 'codigo'>): Promise<Empresa | null> {
    try {
      const created = await this.api.createCompany(this.companyPayloadFromModel(empresa));
      await this.syncEmpresas();
      return this._empresas().find(x => x.codigo === created.id) || null;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return null; }
  }

  async updateEmpresa(codigo: number, updates: Partial<Empresa>): Promise<boolean> {
    try {
      const e = this._empresas().find(x => x.codigo === codigo);
      if (!e) return false;
      await this.api.updateCompany(codigo, this.companyPayloadFromModel({ ...e, ...updates, complemento: updates.complemento ?? e.complemento }));
      await this.syncEmpresas();
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  async deleteEmpresa(codigo: number): Promise<boolean> {
    try {
      await this.api.deleteCompany(codigo);
      this._empresas.update(v => v.filter(x => x.codigo !== codigo));
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  // --- Usuários CRUD ---
  async addUsuario(usuario: CreateUserRequest): Promise<Usuario | null> {
    try {
      this.apiError.set(null);
      const created = await this.api.createUser({ username: usuario.username.trim(), password: usuario.password, role: usuario.role });
      await this.syncUsuarios();
      return this._usuarios().find(x => x.codigo === created.id) ?? this.userFromApi(created);
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return null; }
  }

  async updateUsuario(codigo: number, updates: UpdateUserRequest, options?: { skipResync?: boolean }): Promise<boolean> {
    try {
      this.apiError.set(null);
      await this.api.updateUser(codigo, { username: updates.username.trim(), role: updates.role });
      if (!options?.skipResync) await this.syncUsuarios();
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  async deleteUsuario(codigo: number): Promise<boolean> {
    try {
      this.apiError.set(null);
      await this.api.deleteUser(codigo);
      this._usuarios.update(v => v.filter(x => x.codigo !== codigo));
      return true;
    } catch (e: any) { this.apiError.set(this.extractErrorMessage(e)); return false; }
  }

  // --- Payloads privados ---
  private companyPayloadFromModel(empresa: Omit<Empresa, 'codigo'> | Empresa) {
    return {
      corporateName: empresa.razao_social, cnpj: empresa.cnpj,
      zipCode: empresa.cep, neighborhood: empresa.bairro,
      street: empresa.rua, complement: empresa.complemento || '',
      number: empresa.numero, city: { id: empresa.cod_cidade },
    };
  }

  private vehiclePayloadFromModel(veiculo: Omit<Veiculo, 'codigo'> | Veiculo) {
    return {
      plate: veiculo.placa, type: this.vehicleTypeToApi(veiculo.tipo),
      chassis: veiculo.chassi, renavam: veiculo.renavam,
      manufacturingYear: veiculo.ano_fabricacao,
      modelYear: veiculo.ano_modelo || veiculo.ano_fabricacao,
      vehicleModel: { id: veiculo.cod_modelo },
    };
  }

  private tripPayloadFromRaw(viagem: ViagemRaw) {
    return {
      startDate: viagem.data_inicio, endDate: viagem.data_fim || viagem.data_inicio,
      freightValue: this.moneyToApi(viagem.valor_frete), tollValue: this.moneyToApi(viagem.valor_pedagio),
      status: this.statusToApi(viagem.status), distance: viagem.km || 0,
      notes: viagem.observacoes || '',
      driver: { id: viagem.cod_motorista }, horse: { id: viagem.cod_cavalo },
      trailer: viagem.cod_carreta ? { id: viagem.cod_carreta } : null,
      origins:      [{ company: { id: viagem.cod_origem },  order: 1 }],
      destinations: viagem.cod_destino ? [{ company: { id: viagem.cod_destino }, order: 1 }] : [],
    };
  }

  private primaryStop(stops: ApiTripStop[] | null | undefined): ApiTripStop | null {
    if (!Array.isArray(stops) || stops.length === 0) return null;
    return [...stops].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
  }

  private statusFromApi(status: string | null | undefined): StatusType {
    const raw = String(status || '').trim();
    const normalized = this.normalizeEnum(raw);
    const legacy: Record<string, StatusType> = {
      EM_ANDAMENTO: 'Viajando',
      CONCLUIDA: 'Folga',
      CONCLUÍDA: 'Folga',
      AGENDADA: 'Aguardando Carregar',
      CANCELADA: 'Folga',
    };
    const direct = POSICAO_FROTA_STATUS.find((item) => this.normalizeEnum(item) === normalized);
    return direct ?? legacy[normalized] ?? 'Vazio';
  }

  private statusToApi(status: StatusType): string {
    return status;
  }

  deliveryStatusFromApi(status: string | null | undefined): string {
    const raw = String(status || '').trim();
    if (!raw) return 'Autorizado p/pgto';
    const normalized = this.normalizeEnum(status);
    if (normalized === 'PENDING' || normalized === 'PENDENTE') return 'Falta Lançamento';
    if (normalized === 'PAID' || normalized === 'PAGO') return 'Autorizado p/pgto';
    if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'CANCELADO') return 'Solicitar Desacordo';
    if (
      normalized === 'IN_TRANSIT' ||
      normalized === 'EM_TRANSITO' ||
      normalized === 'EM TRANSITO' ||
      normalized === 'EM TRANSITO'
    ) {
      return 'Em tratativa';
    }
    if (normalized === 'DELIVERED' || normalized === 'ENTREGUE') return 'Autorizado p/pgto';
    return raw;
  }

  tollStatusFromApi(status: string | null | undefined): string {
    const raw = String(status || '').trim();
    if (!raw) return '';
    const normalized = this.normalizeEnum(status);
    if (normalized === 'PAID' || normalized === 'PAGO') return 'Pedágio Pago';
    if (normalized === 'EXEMPT' || normalized === 'ISENTO') return 'Sem pedágio';
    if (normalized === 'PENDING' || normalized === 'PENDENTE') return 'Solicitar Reembolso';
    return raw;
  }

  deliveryStatusToApi(status: string | null | undefined): string {
    return String(status || 'Autorizado p/pgto').trim();
  }

  tollStatusToApi(status: string | null | undefined): string | null {
    const raw = String(status || '').trim();
    return raw || null;
  }

  private vehicleTypeFromApi(type: string | null | undefined): Veiculo['tipo'] {
    const n = (type || '').trim().toUpperCase();
    return (n === 'TRAILER' || n === 'CARRETA') ? 'Carreta' : 'Cavalo';
  }

  private vehicleTypeToApi(type: Veiculo['tipo']): string {
    return type === 'Carreta' ? 'TRAILER' : 'TRACTOR';
  }

  private moneyFromApi(value: number | string | null | undefined): number {
    if (value == null || value === '') return 0;
    return Math.round(Number(value) * 100);
  }

  private moneyToApi(value: number | null | undefined): number {
    if (value == null) return 0;
    return Number((value / 100).toFixed(2));
  }

  private userFromApi(user: UserApiResponse): Usuario {
    return { codigo: Number(user.id), username: user.username, role: user.role };
  }

  private normalizeEnum(value: string | null | undefined): string {
    return this.normalizeText(value).toUpperCase().replace(/\s+/g, '_');
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private extractErrorMessage(error: any): string {
    const message = String(error?.message || 'Erro inesperado.');
    return message.replace(/^HTTP \d+:\s*/, '').trim() || 'Erro inesperado.';
  }

  async getFretes(): Promise<Frete[]> {
    try {
      this.apiError.set(null);
      await this.syncFretes();
      return this._fretes();
    } catch (e: any) {
      this.apiError.set(this.extractErrorMessage(e));
      return [];
    }
  }

  async addFrete(frete: any): Promise<any | null> {
    try {
      this.apiError.set(null);
      const created = await this.api.createDelivery({
        ...frete,
        deliveryStatus: this.deliveryStatusToApi(frete.deliveryStatus),
        tollStatus: this.tollStatusToApi(frete.tollStatus),
      });
      await this.syncFretes();
      return created;
    } catch (e: any) {
      this.apiError.set(this.extractErrorMessage(e));
      return null;
    }
  }

  async updateFrete(id: number, updates: any): Promise<boolean> {
    try {
      this.apiError.set(null);
      await this.api.updateDelivery(id, {
        ...updates,
        deliveryStatus: this.deliveryStatusToApi(updates.deliveryStatus),
        tollStatus: this.tollStatusToApi(updates.tollStatus),
      });
      await this.syncFretes();
      return true;
    } catch (e: any) {
      this.apiError.set(this.extractErrorMessage(e));
      return false;
    }
  }

  async deleteFrete(id: number): Promise<boolean> {
    try {
      this.apiError.set(null);
      await this.api.deleteDelivery(id);
      this._fretes.update(fretes => fretes.filter(frete => frete.id !== id));
      return true;
    } catch (e: any) {
      this.apiError.set(this.extractErrorMessage(e));
      return false;
    }
  }
}
