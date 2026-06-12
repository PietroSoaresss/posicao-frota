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

interface ViagemFormData {
  data_inicio: string;
  data_fim: string;
  valor_frete: number | null;
  valor_pedagio: number | null;
  km: number | null;
  status: StatusType;
  cod_cidade_origem: string;
  cod_cidade_destino: string;
  cod_origem_empresa: string;
  cod_destino_empresa: string;
  cod_motorista: string;
  cod_cavalo: string;
  cod_carreta: string;
  observacoes: string;
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

  form = signal<ViagemFormData>({
    data_inicio: '',
    data_fim: '',
    valor_frete: null,
    valor_pedagio: null,
    km: null,
    status: 'Vazio',
    cod_cidade_origem: '',
    cod_cidade_destino: '',
    cod_origem_empresa: '',
    cod_destino_empresa: '',
    cod_motorista: '',
    cod_cavalo: '',
    cod_carreta: '',
    observacoes: '',
  });

  constructor(private data: DataService) {}

  upd(key: keyof ViagemFormData, val: any) {
    this.form.update(prev => {
      const next = { ...prev, [key]: val };

      if (key === 'cod_cidade_origem' && next.cod_origem_empresa) {
        const empresa = this.data.empresaById(Number(next.cod_origem_empresa));
        if (empresa && String(empresa.cod_cidade) !== String(val)) {
          next.cod_origem_empresa = '';
        }
      }

      if (key === 'cod_cidade_destino' && next.cod_destino_empresa) {
        const empresa = this.data.empresaById(Number(next.cod_destino_empresa));
        if (empresa && String(empresa.cod_cidade) !== String(val)) {
          next.cod_destino_empresa = '';
        }
      }

      if (key === 'cod_origem_empresa') {
        const empresa = this.data.empresaById(Number(val));
        next.cod_cidade_origem = empresa ? String(empresa.cod_cidade) : '';
      }

      if (key === 'cod_destino_empresa') {
        const empresa = this.data.empresaById(Number(val));
        next.cod_cidade_destino = empresa ? String(empresa.cod_cidade) : '';
      }

      return next;
    });

    this.dirty.set(true);
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

    if (!form.data_inicio || !form.cod_origem_empresa || !form.cod_motorista || !form.cod_cavalo) {
      alert('Preencha os campos obrigatórios da posição.');
      return;
    }

    this.onSave.emit({
      ...form,
      cod_motorista: Number(form.cod_motorista),
      cod_cavalo: Number(form.cod_cavalo),
      cod_carreta: form.cod_carreta ? Number(form.cod_carreta) : 0,
      cod_origem_empresa: Number(form.cod_origem_empresa),
      cod_destino_empresa: form.cod_destino_empresa ? Number(form.cod_destino_empresa) : 0,
      km: form.km ?? 0,
      valor_frete: form.valor_frete ?? 0,
      valor_pedagio: form.valor_pedagio ?? 0,
    });
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  onKmInput(event: Event) {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    this.upd('km', val === '' ? null : Number(val));
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

  motoristaOpts = computed(() => {
    return this.data.MOTORISTAS().map((motorista: any) => ({ value: String(motorista.codigo), label: `${motorista.nome} · CNH ${motorista.cnh}` }));
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
