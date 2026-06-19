import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { Empresa } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { SelectInputComponent } from '../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';

interface EmbarcadorFormData {
  razao_social: string;
  cnpj: string;
  cep: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  cod_cidade: string;
}

@Component({
  selector: 'app-create-embarcador-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormFieldComponent,
    TextInputComponent,
    SelectInputComponent,
    IconComponent,
  ],
  templateUrl: './create-embarcador-modal.component.html',
  styleUrls: ['./create-embarcador-modal.component.scss'],
})
export class CreateEmbarcadorModalComponent implements OnInit {
  @Input() empresa: Empresa | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  dirty = signal(false);
  isEdit = signal(false);

  form = signal<EmbarcadorFormData>({
    razao_social: '',
    cnpj: '',
    cep: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
    cod_cidade: '',
  });

  constructor(private data: DataService) {}

  ngOnInit() {
    if (!this.empresa) return;

    this.isEdit.set(true);
    this.form.set({
      razao_social: this.empresa.razao_social,
      cnpj: this.empresa.cnpj,
      cep: this.empresa.cep,
      bairro: this.empresa.bairro,
      rua: this.empresa.rua,
      numero: this.empresa.numero,
      complemento: this.empresa.complemento,
      cod_cidade: String(this.empresa.cod_cidade),
    });
  }

  upd(key: keyof EmbarcadorFormData, val: any) {
    this.form.update(prev => ({ ...prev, [key]: val }));
    this.dirty.set(true);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const form = this.form();

    const erro = this.validar(form);
    if (erro) {
      alert(erro);
      return;
    }

    this.onSave.emit({
      ...form,
      cod_cidade: Number(form.cod_cidade),
    });
  }

  /** Retorna a primeira mensagem de erro específica, ou null se estiver tudo válido. */
  private validar(form: EmbarcadorFormData): string | null {
    if (!form.razao_social.trim()) return 'Informe a razão social do cliente.';
    if (!form.cnpj) return 'Informe o CNPJ.';
    if (form.cnpj.length !== 14) return `O CNPJ deve ter 14 dígitos. Você informou ${form.cnpj.length}.`;
    if (!form.cep) return 'Informe o CEP.';
    if (form.cep.length !== 8) return `O CEP deve ter 8 dígitos. Você informou ${form.cep.length}.`;
    if (!form.bairro.trim()) return 'Informe o bairro.';
    if (!form.rua.trim()) return 'Informe a rua.';
    if (!form.numero) return 'Informe o número do endereço.';
    if (!form.cod_cidade) return 'Selecione a cidade.';
    return null;
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  cidadeOpts = computed(() => {
    return this.data.CIDADES().map((cidade: any) => {
      const estado = this.data.estadoById(cidade.cod_estado);
      return { value: String(cidade.codigo), label: `${cidade.nome} / ${estado?.sigla || '—'}` };
    });
  });

  codigoStr = computed(() => {
    if (!this.empresa) return '???';
    return String(this.empresa.codigo).padStart(3, '0');
  });
}
