import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Motorista } from '../../../../core/models/models';
import { DataService } from '../../../../core/services/data.service';
import { FormFieldComponent } from '../../../../shared/form-primitives/form-field/form-field.component';
import { TextInputComponent } from '../../../../shared/form-primitives/text-input/text-input.component';
import { SelectInputComponent } from '../../../../shared/form-primitives/select-input/select-input.component';
import { DateInputComponent } from '../../../../shared/form-primitives/date-input/date-input.component';

@Component({
  selector: 'app-motorista-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldComponent, TextInputComponent, SelectInputComponent, DateInputComponent],
  templateUrl: './motorista-form.component.html',
  styleUrls: ['./motorista-form.component.scss']
})
export class MotoristaFormComponent implements OnInit {
  @Input() motorista!: Motorista | null;
  @Output() onDirty = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  form = signal<any>({});

  cidadeOpts = computed(() => {
    return this.data.CIDADES().map((cidade: any) => {
      const estado = this.data.estadoById(cidade.cod_estado);
      return { value: String(cidade.codigo), label: `${cidade.nome} / ${estado?.sigla || '—'}` };
    });
  });

  constructor(private data: DataService) {}

  ngOnInit() {
    if (this.motorista) {
      this.form.set({
        nome: this.motorista.nome,
        sexo: this.motorista.sexo,
        cnh: this.motorista.cnh,
        validade_cnh: this.motorista.validade_cnh,
        data_nascimento: this.motorista.data_nascimento || '',
        cod_cidade: this.motorista.cod_cidade || '',
      });
      this.formChange.emit(this.form());
    }
  }

  upd(key: string, val: any) {
    this.form.update((prev: any) => ({ ...prev, [key]: val }));
    this.onDirty.emit();
    this.formChange.emit(this.form());
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  padCode(cod: number | undefined): string {
    return cod != null ? String(cod).padStart(3, '0') : '';
  }

  get initials(): string {
    const nome = this.form().nome || '?';
    return nome.split(' ').map((s: string) => s[0]).slice(0, 2).join('');
  }

  sexoOpts = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' }
  ];
}
