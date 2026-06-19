import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Viagem } from '../../../core/models/models';
import { DataService } from '../../../core/services/data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';
import { SelectInputComponent } from '../../../shared/form-primitives/select-input/select-input.component';
import { MoneyInputComponent } from '../../../shared/form-primitives/money-input/money-input.component';
import { DateInputComponent } from '../../../shared/form-primitives/date-input/date-input.component';
import { isBirthDateValid } from '../../../core/date-utils';
import { ViagemFormComponent } from './viagem-form/viagem-form.component';
import { MotoristaFormComponent } from './motorista-form/motorista-form.component';
import { VeiculoFormComponent } from './veiculo-form/veiculo-form.component';
import { EmbarcadorFormComponent } from './embarcador-form/embarcador-form.component';

type ViewKind = 'viagem' | 'motorista' | 'cavalo' | 'carreta' | 'embarcador';

interface ViewState {
  kind: ViewKind;
  papel?: 'Origem' | 'Destino';
}

@Component({
  selector: 'app-detail-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IconComponent, StatusPillComponent,
    ViagemFormComponent, MotoristaFormComponent,
    VeiculoFormComponent, EmbarcadorFormComponent
  ],
  templateUrl: './detail-modal.component.html',
  styleUrls: ['./detail-modal.component.scss']
})
export class DetailModalComponent implements OnInit, OnChanges {
  @Input() viagem: Viagem | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onSave = new EventEmitter<{ codigo: number; data: any }>();

  view = signal<ViewState>({ kind: 'viagem' });
  dirty = signal(false);
  formData = signal<any>(null);
  confirmDelete = signal(false);

  constructor(private data: DataService) {}

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges) {
    if (changes['viagem']) {
      this.view.set({ kind: 'viagem' });
      this.dirty.set(false);
      this.confirmDelete.set(false);
    }
  }

  open(kind: ViewKind, papel?: 'Origem' | 'Destino') {
    this.view.set({ kind, papel });
  }

  openFromEvent(event: { kind: string; papel?: 'Origem' | 'Destino' }) {
    this.open(event.kind as ViewKind, event.papel);
  }

  goBack() {
    this.view.set({ kind: 'viagem' });
  }

  close() {
    this.onClose.emit();
  }

  async save() {
    const form = this.formData();
    if (!form || !this.viagem) return;

    let ok = false;

    if (this.view().kind === 'viagem') {
      const codOrigens = this.companyIds([
        form.cod_origem_empresa,
        ...(form.origens_adicionais || []).map((stop: any) => stop.cod_empresa),
      ]);
      const codDestinos = this.companyIds([
        form.cod_destino_empresa,
        ...(form.destinos_adicionais || []).map((stop: any) => stop.cod_empresa),
      ]);
      ok = await this.data.updateViagem(this.viagem.codigo, {
        data_posicao: form.data_posicao || form.data_inicio,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        valor_frete: form.valor_frete,
        valor_pedagio: form.valor_pedagio,
        km: form.km,
        status: form.status,
        cod_motorista: Number(form.cod_motorista) || this.viagem.cod_motorista,
        cod_gestor: form.cod_gestor ? Number(form.cod_gestor) : 0,
        cod_cavalo: Number(form.cod_cavalo) || this.viagem.cod_cavalo,
        cod_carreta: form.cod_carreta ? Number(form.cod_carreta) : 0,
        cod_origem: codOrigens[0] || 0,
        cod_destino: codDestinos[0] || 0,
        cod_origens: codOrigens,
        cod_destinos: codDestinos,
        observacoes: form.observacoes,
        origem_texto: codOrigens.length ? '' : form.origem_texto,
        tnf: form.tnf,
        destino_agenda: form.destino_agenda,
        embarcador_texto: codDestinos.length ? '' : form.embarcador_texto,
        valor_pavi: form.valor_pavi,
        comprar_pedagio: form.comprar_pedagio,
        pagar_guia: form.pagar_guia,
        estados_substituicao: form.estados_substituicao,
        valor_emissao_segunda_perna: form.valor_emissao_segunda_perna,
        pagar_guia_segunda_perna: form.pagar_guia_segunda_perna,
      });
    } else if (this.view().kind === 'motorista' && this.viagem.motorista) {
      if (!isBirthDateValid(form.data_nascimento)) {
        alert('O motorista deve ter pelo menos 18 anos.');
        return;
      }
      ok = await this.data.updateMotorista(this.viagem.motorista.codigo, {
        nome: form.nome,
        sexo: form.sexo,
        cnh: form.cnh,
        validade_cnh: form.validade_cnh,
        data_nascimento: form.data_nascimento,
        cod_cidade: form.cod_cidade ? Number(form.cod_cidade) : this.viagem.motorista.cod_cidade,
      });
    } else if ((this.view().kind === 'cavalo' || this.view().kind === 'carreta') && (this.viagem.cavalo || this.viagem.carreta)) {
      const veiculo = this.view().kind === 'cavalo' ? this.viagem.cavalo : this.viagem.carreta;
      if (veiculo) {
        ok = await this.data.updateVeiculo(veiculo.codigo, {
          placa: form.placa,
          chassi: form.chassi,
          renavam: form.renavam,
          ano_fabricacao: Number(form.ano_fabricacao),
          ano_modelo: Number(form.ano_modelo),
          cod_modelo: Number(form.cod_modelo),
          tipo: form.tipo || veiculo.tipo,
        });
      }
    } else if (this.view().kind === 'embarcador') {
      const empresa = this.view().papel === 'Origem' ? this.viagem.origemEmpresa : this.viagem.destinoEmpresa;
      if (empresa) {
        ok = await this.data.updateEmpresa(empresa.codigo, {
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          cep: form.cep,
          bairro: form.bairro,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          cod_cidade: Number(form.cod_cidade),
        });
      }
    }

    if (ok) {
      this.onSave.emit({ codigo: this.viagem.codigo, data: form });
      this.dirty.set(false);
      this.close();
    }
  }

  async delete() {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    if (this.viagem) {
      await this.data.deleteViagem(this.viagem.codigo);
      this.onDelete.emit(this.viagem.codigo);
      this.close();
    }
  }

  async finalizarPosicao() {
    if (!this.viagem) return;

    const hoje = this.todayInput();
    const origemHerdada = this.viagem.cod_destino || this.viagem.cod_origem;
    const origemTexto = this.viagem.cod_destino
      ? ''
      : (this.viagem.destino_agenda || this.viagem.destinoLabel || this.viagem.origem_texto || this.viagem.origemLabel);

    const fechouAtual = await this.data.updateViagem(this.viagem.codigo, {
      data_fim: hoje,
      status: 'Folga',
    });

    if (!fechouAtual || !origemHerdada) return;

    const nova = await this.data.addViagem({
      data_posicao: hoje,
      data_inicio: hoje,
      data_fim: null,
      valor_frete: 0,
      valor_pedagio: 0,
      status: 'Vazio',
      cod_motorista: this.viagem.cod_motorista,
      cod_gestor: this.viagem.cod_gestor || this.viagem.gestor?.codigo || 0,
      cod_cavalo: this.viagem.cod_cavalo,
      cod_carreta: this.viagem.cod_carreta || 0,
      cod_origem: origemHerdada,
      cod_destino: 0,
      km: 0,
      progresso: 0,
      observacoes: `Posição vazia criada ao finalizar ${this.viagem.codigoStr}.`,
      copiado_de: this.viagem.codigo,
      origem_texto: origemTexto,
      tnf: 'NÃO',
      destino_agenda: '',
      embarcador_texto: '',
      valor_pavi: 0,
      comprar_pedagio: 'NÃO',
      pagar_guia: 'NÃO PAGAR GUIA',
      estados_substituicao: '',
      valor_emissao_segunda_perna: 0,
      pagar_guia_segunda_perna: 'NÃO PAGAR GUIA',
    });

    if (nova) {
      this.onSave.emit({ codigo: nova.codigo, data: nova });
      this.close();
    }
  }

  cancelDelete() {
    this.confirmDelete.set(false);
  }

  get kickserText(): string {
    return this.view().kind === 'viagem' ? 'EDITAR POSIÇÃO' : 'EDITAR CADASTRO';
  }

  get titleText(): string {
    const v = this.viagem;
    if (!v) return '';
    if (this.view().kind === 'viagem') return '';
    if (this.view().kind === 'motorista') return 'Motorista';
    if (this.view().kind === 'cavalo') return 'Veículo — Cavalo';
    if (this.view().kind === 'carreta') return 'Veículo — Carreta';
    if (this.view().kind === 'embarcador') return `Cliente (${this.view().papel})`;
    return '';
  }

  get codigoStr(): string {
    return this.viagem?.codigoStr || '';
  }

  private companyIds(values: Array<string | number | null | undefined>): number[] {
    return Array.from(new Set(
      values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value) && value > 0)
    ));
  }

  private todayInput(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
