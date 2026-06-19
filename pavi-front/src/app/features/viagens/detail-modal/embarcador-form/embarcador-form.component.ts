import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../core/models/models';
import { DataService } from '../../../../core/services/data.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../../shared/form-primitives/form-field/form-field.component';
import { SelectInputComponent } from '../../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../../shared/form-primitives/text-input/text-input.component';

@Component({
  selector: 'app-embarcador-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldComponent, TextInputComponent, SelectInputComponent, IconComponent],
  templateUrl: './embarcador-form.component.html',
  styleUrls: ['./embarcador-form.component.scss'],
})
export class EmbarcadorFormComponent implements OnInit {
  @Input() empresa!: Empresa | null;
  @Input() papel: 'Origem' | 'Destino' = 'Origem';
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
    if (!this.empresa) return;

    this.form.set({
      razao_social: this.empresa.razao_social,
      cnpj: this.empresa.cnpj,
      cep: this.empresa.cep,
      bairro: this.empresa.bairro,
      rua: this.empresa.rua,
      numero: this.empresa.numero,
      complemento: this.empresa.complemento,
      cod_cidade: this.empresa.cod_cidade,
    });
    this.formChange.emit(this.form());
  }

  upd(key: string, val: any) {
    this.form.update((prev: any) => ({ ...prev, [key]: val }));
    this.onDirty.emit();
    this.formChange.emit(this.form());
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }
}
