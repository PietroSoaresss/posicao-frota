import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Viagem } from '../../../../core/models/models';
import { DataService } from '../../../../core/services/data.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../../shared/form-primitives/date-input/date-input.component';
import { FormFieldComponent } from '../../../../shared/form-primitives/form-field/form-field.component';
import { MoneyInputComponent } from '../../../../shared/form-primitives/money-input/money-input.component';
import { SelectInputComponent } from '../../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../../shared/form-primitives/text-input/text-input.component';

interface RotaExtraStop {
  cod_cidade: string;
  cod_empresa: string;
}

@Component({
  selector: 'app-viagem-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormFieldComponent,
    TextInputComponent,
    SelectInputComponent,
    MoneyInputComponent,
    DateInputComponent,
    IconComponent,
  ],
  templateUrl: './viagem-form.component.html',
  styleUrls: ['./viagem-form.component.scss'],
})
export class ViagemFormComponent implements OnInit {
  @Input() viagem!: Viagem;
  @Output() onOpen = new EventEmitter<{ kind: string; papel?: 'Origem' | 'Destino' }>();
  @Output() onDirty = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  form = signal<any>({});
  private motoristaAlteradoManualmente = false;

  origemEmpresaCidadeOpts = computed(() => {
    const cidade = this.form().cod_cidade_origem;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === String(cidade))
      .map((empresa: any) => ({ value: String(empresa.codigo), label: this.empresaCidadeLabel(empresa) }));
  });

  destinoEmpresaCidadeOpts = computed(() => {
    const cidade = this.form().cod_cidade_destino;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === String(cidade))
      .map((empresa: any) => ({ value: String(empresa.codigo), label: this.empresaCidadeLabel(empresa) }));
  });

  cidadeOpts = computed(() => {
    return this.data.CIDADES().map((cidade: any) => {
      const estado = this.data.estadoById(cidade.cod_estado);
      return { value: String(cidade.codigo), label: `${cidade.nome} / ${estado?.sigla || '—'}` };
    });
  });

  origemEmpresaOpts = computed(() => {
    const cidade = this.form().cod_cidade_origem;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === String(cidade))
      .map((empresa: any) => ({ value: String(empresa.codigo), label: `${empresa.razao_social} · ${empresa.cnpj}` }));
  });

  destinoEmpresaOpts = computed(() => {
    const cidade = this.form().cod_cidade_destino;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === String(cidade))
      .map((empresa: any) => ({ value: String(empresa.codigo), label: `${empresa.razao_social} · ${empresa.cnpj}` }));
  });

  statusOpts = computed(() => {
    return Object.keys(this.data.STATUS_META).map(key => ({ value: key, label: key }));
  });

  simNaoOpts = [
    { value: 'NÃO', label: 'Não' },
    { value: 'SIM', label: 'Sim' },
  ];

  pagarGuiaOpts = [
    { value: 'NÃO PAGAR GUIA', label: 'Não' },
    { value: 'PAGAR GUIA', label: 'Sim' },
  ];

  motoristaOpts = computed(() => {
    return this.data.MOTORISTAS().map((motorista: any) => ({ value: String(motorista.codigo), label: `${motorista.nome} · CNH ${motorista.cnh}` }));
  });

  gestorOpts = computed(() => {
    return this.data.USUARIOS().map((usuario: any) => ({
      value: String(usuario.codigo),
      label: `${usuario.username} · ${usuario.role === 'ADMIN' ? 'Administrador' : 'Operador'}`,
    }));
  });

  cavaloOpts = computed(() => {
    return this.data.VEICULOS()
      .filter((veiculo: any) => veiculo.tipo === 'Cavalo')
      .map((veiculo: any) => ({ value: String(veiculo.codigo), label: `${veiculo.placa} · ${this.data.modeloCompleto(veiculo.cod_modelo)}` }));
  });

  carretaOpts = computed(() => {
    return this.data.VEICULOS()
      .filter((veiculo: any) => veiculo.tipo === 'Carreta')
      .map((veiculo: any) => ({ value: String(veiculo.codigo), label: `${veiculo.placa} · ${this.data.modeloCompleto(veiculo.cod_modelo)}` }));
  });

  constructor(private data: DataService) {}

  origemEmpresaCidadeOptsFor(index: number) {
    return this.empresaCidadeOptsFor(this.form().origens_adicionais?.[index]?.cod_cidade || '');
  }

  destinoEmpresaCidadeOptsFor(index: number) {
    return this.empresaCidadeOptsFor(this.form().destinos_adicionais?.[index]?.cod_cidade || '');
  }

  addOrigem() {
    this.form.update((prev: any) => ({
      ...prev,
      origens_adicionais: [...(prev.origens_adicionais || []), this.blankStop()],
    }));
    this.markRouteDirty();
  }

  removeOrigem(index: number) {
    this.form.update((prev: any) => ({
      ...prev,
      origens_adicionais: (prev.origens_adicionais || []).filter((_: RotaExtraStop, itemIndex: number) => itemIndex !== index),
    }));
    this.markRouteDirty();
  }

  addDestino() {
    this.form.update((prev: any) => ({
      ...prev,
      destinos_adicionais: [...(prev.destinos_adicionais || []), this.blankStop()],
    }));
    this.markRouteDirty();
  }

  removeDestino(index: number) {
    this.form.update((prev: any) => ({
      ...prev,
      destinos_adicionais: (prev.destinos_adicionais || []).filter((_: RotaExtraStop, itemIndex: number) => itemIndex !== index),
    }));
    this.markRouteDirty();
  }

  updOrigemAdicional(index: number, key: keyof RotaExtraStop, val: string) {
    this.updateExtraStop('origens_adicionais', index, key, val);
  }

  updDestinoAdicional(index: number, key: keyof RotaExtraStop, val: string) {
    this.updateExtraStop('destinos_adicionais', index, key, val);
  }

  ngOnInit() {
    const v = this.viagem;
    const origemIds = this.routeIds(v.cod_origens, v.cod_origem);
    const destinoIds = this.routeIds(v.cod_destinos, v.cod_destino);
    const origemEmpresa = origemIds[0] ? this.data.empresaById(origemIds[0]) : v.origemEmpresa;
    const destinoEmpresa = destinoIds[0] ? this.data.empresaById(destinoIds[0]) : v.destinoEmpresa;
    this.form.set({
      data_posicao: v.data_posicao,
      data_inicio: v.data_inicio,
      data_fim: v.data_fim,
      valor_frete: v.valor_frete,
      valor_pedagio: v.valor_pedagio,
      km: v.km,
      status: v.status,
      cod_cidade_origem: origemEmpresa?.cod_cidade || this.cidadeIdFromLabel(v.origem_texto) || '',
      cod_cidade_destino: destinoEmpresa?.cod_cidade || this.cidadeIdFromLabel(v.embarcador_texto) || '',
      cod_origem_empresa: origemEmpresa?.codigo || '',
      cod_destino_empresa: destinoEmpresa?.codigo || '',
      origens_adicionais: origemIds.slice(1).map(id => this.stopFromCompanyId(id)),
      destinos_adicionais: destinoIds.slice(1).map(id => this.stopFromCompanyId(id)),
      cod_motorista: v.cod_motorista || '',
      cod_gestor: v.cod_gestor || v.gestor?.codigo || '',
      cod_cavalo: v.cod_cavalo || '',
      cod_carreta: v.cod_carreta || '',
      observacoes: v.observacoes || '',
      origem_texto: v.origem_texto || '',
      tnf: v.tnf || 'NÃO',
      destino_agenda: v.destino_agenda || '',
      embarcador_texto: v.embarcador_texto || '',
      valor_pavi: v.valor_pavi || 0,
      comprar_pedagio: v.comprar_pedagio || 'NÃO',
      pagar_guia: v.pagar_guia || 'NÃO PAGAR GUIA',
      estados_substituicao: v.estados_substituicao || '',
      valor_emissao_segunda_perna: v.valor_emissao_segunda_perna || 0,
      pagar_guia_segunda_perna: v.pagar_guia_segunda_perna || 'NÃO PAGAR GUIA',
    });
    this.formChange.emit(this.form());
  }

  upd(key: string, val: any) {
    this.form.update((prev: any) => {
      const next = { ...prev, [key]: val };

      if (key === 'cod_cidade_origem' && next.cod_origem_empresa) {
        const empresa = this.data.empresaById(Number(next.cod_origem_empresa));
        if (empresa && String(empresa.cod_cidade) !== String(val)) {
          next.cod_origem_empresa = '';
        }
      }
      if (key === 'cod_cidade_origem' && !next.cod_origem_empresa) {
        next.origem_texto = this.cidadeLabel(val);
      }

      if (key === 'cod_cidade_destino' && next.cod_destino_empresa) {
        const empresa = this.data.empresaById(Number(next.cod_destino_empresa));
        if (empresa && String(empresa.cod_cidade) !== String(val)) {
          next.cod_destino_empresa = '';
        }
      }
      if (key === 'cod_cidade_destino' && !next.cod_destino_empresa) {
        next.embarcador_texto = this.cidadeLabel(val);
      }

      if (key === 'cod_origem_empresa') {
        const empresa = this.data.empresaById(Number(val));
        if (empresa) {
          next.cod_cidade_origem = String(empresa.cod_cidade);
          next.origem_texto = '';
        } else {
          next.origem_texto = this.cidadeLabel(next.cod_cidade_origem);
        }
      }

      if (key === 'cod_destino_empresa') {
        const empresa = this.data.empresaById(Number(val));
        next.cod_cidade_destino = empresa ? String(empresa.cod_cidade) : '';
        next.embarcador_texto = empresa ? '' : this.cidadeLabel(next.cod_cidade_destino);
      }

      if (key === 'data_inicio') {
        next.data_posicao = val;
      }

      if (key === 'cod_cavalo' && (!next.cod_motorista || !this.motoristaAlteradoManualmente)) {
        const motorista = this.data.motoristaAtualPorCavalo(val, next.data_posicao || next.data_inicio);
        if (motorista) {
          next.cod_motorista = String(motorista);
        }
      }

      if (key === 'cod_cavalo' && !next.cod_gestor) {
        const gestor = this.data.gestorAtualPorCavalo(val, next.data_posicao || next.data_inicio);
        if (gestor) {
          next.cod_gestor = String(gestor);
        }
      }

      return next;
    });
    this.onDirty.emit();
    if (key === 'cod_motorista') {
      this.motoristaAlteradoManualmente = true;
    }
    this.formChange.emit(this.form());
  }

  onKmInput(event: Event) {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    this.upd('km', digits === '' ? null : Number(digits));
  }

  onObsInput(event: Event) {
    this.upd('observacoes', (event.target as HTMLTextAreaElement).value);
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  private cidadeLabel(codigo: any): string {
    const cidade = this.data.CIDADES().find((item: any) => String(item.codigo) === String(codigo));
    if (!cidade) return '';
    const estado = this.data.estadoById(cidade.cod_estado);
    return `${cidade.nome}/${estado?.sigla || ''}`;
  }

  private empresaCidadeLabel(empresa: any): string {
    const cidade = empresa?.cod_cidade ? this.cidadeLabel(empresa.cod_cidade) : '';
    return `${empresa.razao_social} · ${empresa.cnpj}${cidade ? ` · ${cidade}` : ''}`;
  }

  private empresaCidadeOptsFor(cidade: string) {
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === String(cidade))
      .map((empresa: any) => ({ value: String(empresa.codigo), label: this.empresaCidadeLabel(empresa) }));
  }

  private updateExtraStop(listKey: 'origens_adicionais' | 'destinos_adicionais', index: number, key: keyof RotaExtraStop, val: string) {
    this.form.update((prev: any) => {
      const stops = (prev[listKey] || []).map((stop: RotaExtraStop, itemIndex: number) => {
        if (itemIndex !== index) return stop;
        const next = { ...stop, [key]: val };

        if (key === 'cod_cidade' && next.cod_empresa) {
          const empresa = this.data.empresaById(Number(next.cod_empresa));
          if (empresa && String(empresa.cod_cidade) !== String(val)) {
            next.cod_empresa = '';
          }
        }

        if (key === 'cod_empresa') {
          const empresa = this.data.empresaById(Number(val));
          next.cod_cidade = empresa ? String(empresa.cod_cidade) : next.cod_cidade;
        }

        return next;
      });

      return { ...prev, [listKey]: stops };
    });
    this.markRouteDirty();
  }

  private routeIds(ids: number[] | null | undefined, fallbackId?: number | null): number[] {
    const source = Array.isArray(ids) && ids.length > 0 ? ids : (fallbackId ? [fallbackId] : []);
    return Array.from(new Set(source.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  }

  private stopFromCompanyId(id: number): RotaExtraStop {
    const empresa = this.data.empresaById(Number(id));
    return {
      cod_empresa: String(id),
      cod_cidade: empresa?.cod_cidade ? String(empresa.cod_cidade) : '',
    };
  }

  private blankStop(): RotaExtraStop {
    return { cod_cidade: '', cod_empresa: '' };
  }

  private markRouteDirty() {
    this.onDirty.emit();
    this.formChange.emit(this.form());
  }

  private cidadeIdFromLabel(label: string | undefined): string {
    const normalized = this.normalizeCityLabel(label);
    if (!normalized) return '';
    const cidade = this.data.CIDADES().find((item: any) => this.normalizeCityLabel(this.cidadeLabel(item.codigo)) === normalized);
    return cidade ? String(cidade.codigo) : '';
  }

  private normalizeCityLabel(label: string | undefined): string {
    return (label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toUpperCase();
  }
}
