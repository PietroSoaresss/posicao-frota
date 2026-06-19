import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Veiculo } from '../../../../core/models/models';
import { DataService } from '../../../../core/services/data.service';
import { FormFieldComponent } from '../../../../shared/form-primitives/form-field/form-field.component';
import { TextInputComponent } from '../../../../shared/form-primitives/text-input/text-input.component';
import { SelectInputComponent } from '../../../../shared/form-primitives/select-input/select-input.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SelectOption } from '../../../../shared/form-primitives/select-input/select-input.component';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldComponent, TextInputComponent, SelectInputComponent, IconComponent],
  templateUrl: './veiculo-form.component.html',
  styleUrls: ['./veiculo-form.component.scss']
})
export class VeiculoFormComponent implements OnInit {
  @Input() veiculo!: Veiculo | null;
  @Input() tipo: string = 'Cavalo';
  @Output() onDirty = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  form = signal<any>({});

  modeloOpts = computed(() => {
    return this.data.MODELOS().map((m: any) => ({
      value: String(m.codigo),
      label: this.data.modeloCompleto(m.codigo)
    }));
  });

  constructor(private data: DataService) {}

  ngOnInit() {
    if (this.veiculo) {
      this.form.set({
        placa: this.veiculo.placa,
        tipo: this.veiculo.tipo,
        chassi: this.veiculo.chassi,
        renavam: this.veiculo.renavam,
        ano_fabricacao: this.veiculo.ano_fabricacao,
        ano_modelo: this.veiculo.ano_modelo,
        cod_modelo: this.veiculo.cod_modelo,
      });
      this.formChange.emit(this.form());
    }
  }

  upd(key: string, val: any) {
    this.form.update((prev: any) => ({ ...prev, [key]: val }));
    this.onDirty.emit();
    this.formChange.emit(this.form());
  }

  modeloCompleto(cod: number): string {
    return this.data.modeloCompleto(cod);
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  get tipoOpts(): SelectOption[] {
    return [
      { value: 'Cavalo', label: 'Cavalo' },
      { value: 'Carreta', label: 'Carreta' }
    ];
  }
}
