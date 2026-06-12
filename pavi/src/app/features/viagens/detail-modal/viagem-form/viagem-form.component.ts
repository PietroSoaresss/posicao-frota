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

  constructor(private data: DataService) {}

  ngOnInit() {
    const v = this.viagem;
    this.form.set({
      data_inicio: v.data_inicio,
      data_fim: v.data_fim,
      valor_frete: v.valor_frete,
      valor_pedagio: v.valor_pedagio,
      km: v.km,
      status: v.status,
      cod_cidade_origem: v.origemEmpresa?.cod_cidade || '',
      cod_cidade_destino: v.destinoEmpresa?.cod_cidade || '',
      cod_origem_empresa: v.origemEmpresa?.codigo || '',
      cod_destino_empresa: v.destinoEmpresa?.codigo || '',
      cod_motorista: v.cod_motorista || '',
      cod_cavalo: v.cod_cavalo || '',
      cod_carreta: v.cod_carreta || '',
      observacoes: v.observacoes || '',
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
    this.onDirty.emit();
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
}
