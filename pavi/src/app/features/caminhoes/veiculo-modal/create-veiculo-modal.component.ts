import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Veiculo } from '../../../core/models/models';
import { DataService } from '../../../core/services/data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { SelectInputComponent, SelectOption } from '../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';

interface VeiculoFormData {
  placa: string;
  chassi: string;
  renavam: string;
  ano_fabricacao: string;
  ano_modelo: string;
  cod_modelo: string;
  tipo: 'Cavalo' | 'Carreta';
}

@Component({
  selector: 'app-create-veiculo-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormFieldComponent,
    TextInputComponent,
    SelectInputComponent,
    IconComponent,
  ],
  templateUrl: './create-veiculo-modal.component.html',
  styleUrls: ['./create-veiculo-modal.component.scss'],
})
export class CreateVeiculoModalComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  @Input() veiculo: Veiculo | null = null;
  @Input() tipo: 'Cavalo' | 'Carreta' = 'Cavalo';

  dirty = signal(false);
  isEdit = signal(false);

  form = signal<VeiculoFormData>({
    placa: '',
    chassi: '',
    renavam: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cod_modelo: '',
    tipo: 'Cavalo',
  });

  constructor(private data: DataService) {}

  ngOnInit() {
    if (this.veiculo) {
      this.isEdit.set(true);
      this.form.set({
        placa: this.veiculo.placa,
        chassi: this.veiculo.chassi,
        renavam: this.veiculo.renavam,
        ano_fabricacao: String(this.veiculo.ano_fabricacao),
        ano_modelo: String(this.veiculo.ano_modelo),
        cod_modelo: String(this.veiculo.cod_modelo),
        tipo: this.veiculo.tipo,
      });
      return;
    }

    this.form.update(prev => ({ ...prev, tipo: this.tipo }));
  }

  upd(key: keyof VeiculoFormData, val: any) {
    this.form.update(prev => ({ ...prev, [key]: val }));
    this.dirty.set(true);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const form = this.form();

    if (!form.placa || !form.chassi || !form.renavam || !form.ano_fabricacao || !form.ano_modelo || !form.cod_modelo) {
      alert('Preencha todos os campos obrigatórios do veículo.');
      return;
    }

    this.onSave.emit({
      ...form,
      ano_fabricacao: Number(form.ano_fabricacao),
      ano_modelo: Number(form.ano_modelo),
      cod_modelo: Number(form.cod_modelo),
    });
  }

  modeloCompleto(cod: any): string {
    return this.data.modeloCompleto(Number(cod));
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  modeloOpts = computed(() => {
    return this.data.MODELOS().map((modelo: any) => ({
      value: String(modelo.codigo),
      label: this.data.modeloCompleto(modelo.codigo),
    }));
  });

  get tipoOpts(): SelectOption[] {
    return [
      { value: 'Cavalo', label: 'Cavalo' },
      { value: 'Carreta', label: 'Carreta' },
    ];
  }

  get initials(): string {
    const placa = this.form().placa || '?';
    return placa.slice(0, 2).toUpperCase();
  }

  get tipoLabel(): string {
    return this.form().tipo;
  }

  get modeloLabel(): string {
    return this.data.modeloCompleto(Number(this.form().cod_modelo)) || '—';
  }
}
