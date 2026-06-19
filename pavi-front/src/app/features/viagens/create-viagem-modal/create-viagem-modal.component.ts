import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusType } from '../../../core/models/models';
import { DataService } from '../../../core/services/data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { DateInputComponent } from '../../../shared/form-primitives/date-input/date-input.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { MoneyInputComponent } from '../../../shared/form-primitives/money-input/money-input.component';
import { SelectInputComponent } from '../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';

interface ViagemFormData {
  data_inicio: string;
  data_fim: string;
  valor_frete: number | null;
  valor_pedagio: number | null;
  status: StatusType;
  cod_cidade_origem: string;
  cod_cidade_destino: string;
  cod_origem_empresa: string;
  cod_destino_empresa: string;
  origens_adicionais: RotaExtraStop[];
  destinos_adicionais: RotaExtraStop[];
  cod_motorista: string;
  cod_gestor: string;
  cod_cavalo: string;
  cod_carreta: string;
  observacoes: string;
  origem_texto: string;
  tnf: string;
  destino_agenda: string;
  embarcador_texto: string;
  valor_pavi: number | null;
  comprar_pedagio: string;
  pagar_guia: string;
  estados_substituicao: string;
  valor_emissao_segunda_perna: number | null;
  pagar_guia_segunda_perna: string;
}

interface RotaExtraStop {
  cod_cidade: string;
  cod_empresa: string;
}

@Component({
  selector: 'app-create-viagem-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormFieldComponent,
    SelectInputComponent,
    MoneyInputComponent,
    DateInputComponent,
    TextInputComponent,
    IconComponent,
    StatusPillComponent,
  ],
  templateUrl: './create-viagem-modal.component.html',
  styleUrls: ['./create-viagem-modal.component.scss'],
})
export class CreateViagemModalComponent {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();
  @Output() formChange = new EventEmitter<any>();

  dirty = signal(false);
  private motoristaAlteradoManualmente = false;

  origemEmpresaCidadeOpts = computed(() => {
    const cidade = this.form().cod_cidade_origem;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === cidade)
      .map((empresa: any) => ({ value: String(empresa.codigo), label: this.empresaCidadeLabel(empresa) }));
  });

  destinoEmpresaCidadeOpts = computed(() => {
    const cidade = this.form().cod_cidade_destino;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === cidade)
      .map((empresa: any) => ({ value: String(empresa.codigo), label: this.empresaCidadeLabel(empresa) }));
  });

  form = signal<ViagemFormData>({
    data_inicio: this.todayInput(),
    data_fim: '',
    valor_frete: null,
    valor_pedagio: null,
    status: 'Vazio',
    cod_cidade_origem: '',
    cod_cidade_destino: '',
    cod_origem_empresa: '',
    cod_destino_empresa: '',
    origens_adicionais: [],
    destinos_adicionais: [],
    cod_motorista: '',
    cod_gestor: '',
    cod_cavalo: '',
    cod_carreta: '',
    observacoes: '',
    origem_texto: '',
    tnf: 'NÃO',
    destino_agenda: '',
    embarcador_texto: '',
    valor_pavi: null,
    comprar_pedagio: 'NÃO',
    pagar_guia: 'NÃO PAGAR GUIA',
    estados_substituicao: '',
    valor_emissao_segunda_perna: null,
    pagar_guia_segunda_perna: 'NÃO PAGAR GUIA',
  });

  constructor(private data: DataService) {}

  origemEmpresaCidadeOptsFor(index: number) {
    return this.empresaCidadeOptsFor(this.form().origens_adicionais[index]?.cod_cidade || '');
  }

  destinoEmpresaCidadeOptsFor(index: number) {
    return this.empresaCidadeOptsFor(this.form().destinos_adicionais[index]?.cod_cidade || '');
  }

  addOrigem() {
    this.form.update(prev => ({
      ...prev,
      origens_adicionais: [...prev.origens_adicionais, this.blankStop()],
    }));
    this.markDirty();
  }

  removeOrigem(index: number) {
    this.form.update(prev => ({
      ...prev,
      origens_adicionais: prev.origens_adicionais.filter((_, itemIndex) => itemIndex !== index),
    }));
    this.markDirty();
  }

  addDestino() {
    this.form.update(prev => ({
      ...prev,
      destinos_adicionais: [...prev.destinos_adicionais, this.blankStop()],
    }));
    this.markDirty();
  }

  removeDestino(index: number) {
    this.form.update(prev => ({
      ...prev,
      destinos_adicionais: prev.destinos_adicionais.filter((_, itemIndex) => itemIndex !== index),
    }));
    this.markDirty();
  }

  updOrigemAdicional(index: number, key: keyof RotaExtraStop, val: string) {
    this.updateExtraStop('origens_adicionais', index, key, val);
  }

  updDestinoAdicional(index: number, key: keyof RotaExtraStop, val: string) {
    this.updateExtraStop('destinos_adicionais', index, key, val);
  }

  private todayInput(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }

  upd(key: keyof ViagemFormData, val: any) {
    this.form.update(prev => {
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

      if (key === 'cod_cavalo' && (!next.cod_motorista || !this.motoristaAlteradoManualmente)) {
        const motorista = this.data.motoristaAtualPorCavalo(val, next.data_inicio);
        if (motorista) {
          next.cod_motorista = String(motorista);
        }
      }

      if (key === 'cod_cavalo' && !next.cod_gestor) {
        const gestor = this.data.gestorAtualPorCavalo(val, next.data_inicio);
        if (gestor) {
          next.cod_gestor = String(gestor);
        }
      }

      if (key === 'data_inicio' && next.cod_cavalo && !next.cod_motorista) {
        const motorista = this.data.motoristaAtualPorCavalo(next.cod_cavalo, val);
        if (motorista) {
          next.cod_motorista = String(motorista);
        }
      }

      if (key === 'data_inicio' && next.cod_cavalo && !next.cod_gestor) {
        const gestor = this.data.gestorAtualPorCavalo(next.cod_cavalo, val);
        if (gestor) {
          next.cod_gestor = String(gestor);
        }
      }

      return next;
    });

    this.dirty.set(true);
    if (key === 'cod_motorista') {
      this.motoristaAlteradoManualmente = true;
    }
    this.formChange.emit(this.form());
  }

  onObsInput(event: Event) {
    this.upd('observacoes', (event.target as HTMLTextAreaElement).value);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const form = this.form();
    const codOrigens = this.companyIds([
      form.cod_origem_empresa,
      ...form.origens_adicionais.map(stop => stop.cod_empresa),
    ]);
    const codDestinos = this.companyIds([
      form.cod_destino_empresa,
      ...form.destinos_adicionais.map(stop => stop.cod_empresa),
    ]);

    if (!form.data_inicio || !form.cod_cidade_origem || !form.cod_motorista || !form.cod_cavalo || !form.cod_carreta) {
      alert('Preencha os campos obrigatórios da posição.');
      return;
    }

    this.onSave.emit({
      ...form,
      data_posicao: form.data_inicio,
      cod_motorista: Number(form.cod_motorista),
      cod_gestor: form.cod_gestor ? Number(form.cod_gestor) : 0,
      cod_cavalo: Number(form.cod_cavalo),
      cod_carreta: Number(form.cod_carreta),
      origem_texto: codOrigens.length ? '' : (form.origem_texto || this.cidadeLabel(form.cod_cidade_origem)),
      embarcador_texto: codDestinos.length ? '' : (form.embarcador_texto || this.cidadeLabel(form.cod_cidade_destino)),
      cod_origem_empresa: codOrigens[0] || 0,
      cod_destino_empresa: codDestinos[0] || 0,
      cod_origens: codOrigens,
      cod_destinos: codDestinos,
      km: 0,
      valor_frete: form.valor_frete ?? 0,
      valor_pedagio: form.valor_pedagio ?? 0,
      valor_pavi: form.valor_pavi ?? 0,
      valor_emissao_segunda_perna: form.valor_emissao_segunda_perna ?? 0,
    });
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
    this.form.update(prev => {
      const stops = prev[listKey].map((stop, itemIndex) => {
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
    this.markDirty();
  }

  private companyIds(values: Array<string | number | null | undefined>): number[] {
    return Array.from(new Set(
      values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value) && value > 0)
    ));
  }

  private blankStop(): RotaExtraStop {
    return { cod_cidade: '', cod_empresa: '' };
  }

  private markDirty() {
    this.dirty.set(true);
    this.formChange.emit(this.form());
  }

  private empresaLabel(empresa: any): string {
    const cidade = empresa?.cod_cidade ? this.cidadeLabel(empresa.cod_cidade) : '';
    return `${empresa.razao_social} · ${empresa.cnpj}${cidade ? ` · ${cidade}` : ''}`;
  }

  cidadeOpts = computed(() => {
    return this.data.CIDADES().map((cidade: any) => {
      const estado = this.data.estadoById(cidade.cod_estado);
      return { value: String(cidade.codigo), label: `${cidade.nome} / ${estado?.sigla || '—'}` };
    });
  });

  origemEmpresaOpts = computed(() => {
    const cidade = this.form().cod_cidade_origem;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === cidade)
      .map((empresa: any) => ({ value: String(empresa.codigo), label: `${empresa.razao_social} · ${empresa.cnpj}` }));
  });

  destinoEmpresaOpts = computed(() => {
    const cidade = this.form().cod_cidade_destino;
    return this.data.EMPRESAS()
      .filter((empresa: any) => !cidade || String(empresa.cod_cidade) === cidade)
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
}
