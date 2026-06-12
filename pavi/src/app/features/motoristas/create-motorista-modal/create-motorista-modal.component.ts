import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Motorista } from '../../../core/models/models';
import { DataService } from '../../../core/services/data.service';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';
import { SelectInputComponent, SelectOption } from '../../../shared/form-primitives/select-input/select-input.component';
import { DateInputComponent } from '../../../shared/form-primitives/date-input/date-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { isBirthDateValid } from '../../../core/date-utils';

interface MotoristaFormData {
  nome: string;
  sexo: 'M' | 'F';
  cnh: string;
  validade_cnh: string;
  data_nascimento: string;
  cod_cidade: string;
}

@Component({
  selector: 'app-create-motorista-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    FormFieldComponent, TextInputComponent, SelectInputComponent,
    DateInputComponent, IconComponent
  ],
  templateUrl: './create-motorista-modal.component.html',
  styleUrls: ['./create-motorista-modal.component.scss']
})
export class CreateMotoristaModalComponent implements OnInit {
  private data = inject(DataService);

  @Input() motorista: Motorista | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  dirty = signal(false);
  isEdit = signal(false);

  form = signal<MotoristaFormData>({
    nome: '',
    sexo: 'M',
    cnh: '',
    validade_cnh: '',
    data_nascimento: '',
    cod_cidade: '',
  });

  cidadeOpts = computed(() => {
    return this.data.CIDADES().map((c: any) => {
      const est = this.data.estadoById(c.cod_estado);
      return { value: String(c.codigo), label: `${c.nome} / ${est?.sigla || '—'}` };
    });
  });

  constructor() {}

  ngOnInit() {
    if (this.motorista) {
      this.isEdit.set(true);
      this.form.set({
        nome: this.motorista.nome,
        sexo: this.motorista.sexo,
        cnh: this.motorista.cnh,
        validade_cnh: this.motorista.validade_cnh,
        data_nascimento: this.motorista.data_nascimento || '',
        cod_cidade: String(this.motorista.cod_cidade || ''),
      });
    }
  }

  upd(key: keyof MotoristaFormData, val: any) {
    this.form.update(prev => ({ ...prev, [key]: val }));
    this.dirty.set(true);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const data = this.form();
    if (!data.nome || !data.cnh || !data.validade_cnh || !data.data_nascimento || !data.cod_cidade) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!isBirthDateValid(data.data_nascimento)) {
      alert('O motorista deve ter pelo menos 18 anos.');
      return;
    }
    this.onSave.emit({
      ...data,
      cod_cidade: Number(data.cod_cidade)
    });
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  get initials(): string {
    const nome = this.form().nome || '?';
    return nome.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  get sexoOpts(): SelectOption[] {
    return [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Feminino' }
    ];
  }

  get codigoStr(): string {
    if (!this.motorista) return '???';
    return String(this.motorista.codigo).padStart(3, '0');
  }
}
