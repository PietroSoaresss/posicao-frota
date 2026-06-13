import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { FRETE_STATUS, FRETE_TIPOS, Frete, PEDAGIO_STATUS } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';
import { SelectInputComponent } from '../../../shared/form-primitives/select-input/select-input.component';
import { MoneyInputComponent } from '../../../shared/form-primitives/money-input/money-input.component';
import { DateInputComponent } from '../../../shared/form-primitives/date-input/date-input.component';

interface FreteFormData {
  trip_id: string;
  deliveryValue: number | null;
  deliveryStatus: string;
  date: string;
  paymentDate: string;
  deadline: string;
  deliveryType: string;
  boarding: string;
  cte: string;
  complementaryCte: string;
  icms: number | null;
  complementaryIcms: string;
  tollValue: number | null;
  tollStatus: string;
  observations: string;
  complementaryDelivery: string;
}

@Component({
  selector: 'app-create-frete-modal',
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
  templateUrl: './create-frete-modal.component.html',
  styleUrls: ['./create-frete-modal.component.scss'],
})
export class CreateFreteModalComponent implements OnInit {
  @Input() frete: Frete | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  dirty = signal(false);
  isEdit = signal(false);

  readonly STATUS_OPTS = FRETE_STATUS.map((status) => ({ value: status, label: status }));
  readonly DELIVERY_TYPE_OPTS = FRETE_TIPOS.map((tipo) => ({ value: tipo, label: tipo }));
  readonly TOLL_STATUS_OPTS = PEDAGIO_STATUS.map((status) => ({ value: status, label: status }));

  form = signal<FreteFormData>({
    trip_id: '',
    deliveryValue: null,
    deliveryStatus: 'Autorizado p/pgto',
    date: '',
    paymentDate: '',
    deadline: '',
    deliveryType: '',
    boarding: '',
    cte: '',
    complementaryCte: '',
    icms: null,
    complementaryIcms: '',
    tollValue: null,
    tollStatus: '',
    observations: '',
    complementaryDelivery: '',
  });

  constructor(private data: DataService) {}

  ngOnInit() {
    if (!this.frete) return;

    this.isEdit.set(true);
    this.form.set({
      trip_id: String(this.frete.trip?.id ?? ''),
      deliveryValue: this.frete.deliveryValue ?? null,
      deliveryStatus: this.data.deliveryStatusFromApi(this.frete.deliveryStatus) ?? 'Autorizado p/pgto',
      date: this.frete.date ?? '',
      paymentDate: this.frete.paymentDate ?? '',
      deadline: this.frete.deadline ?? '',
      deliveryType: this.frete.deliveryType ?? '',
      boarding: this.frete.boarding ?? '',
      cte: this.frete.cte ?? '',
      complementaryCte: this.frete.complementaryCte ?? '',
      icms: this.frete.icms ?? null,
      complementaryIcms: this.frete.complementaryIcms ?? '',
      tollValue: this.frete.tollValue ?? null,
      tollStatus: this.frete.tollStatus ?? '',
      observations: this.frete.observations ?? '',
      complementaryDelivery: this.frete.complementaryDelivery ?? '',
    });
  }

  upd(key: keyof FreteFormData, val: any) {
    this.form.update((prev) => ({ ...prev, [key]: val }));
    this.dirty.set(true);
  }

  onTextInput(key: keyof FreteFormData, event: Event) {
    this.upd(key, (event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const form = this.form();

    if (!form.deliveryValue || !form.deliveryStatus || !form.date) {
      alert('Preencha os campos obrigatorios: Valor, Status e Data.');
      return;
    }

    this.onSave.emit({
      trip: form.trip_id ? { id: Number(form.trip_id) } : null,
      deliveryValue: form.deliveryValue,
      deliveryStatus: form.deliveryStatus,
      date: form.date,
      paymentDate: form.paymentDate || null,
      deadline: form.deadline || null,
      deliveryType: form.deliveryType || null,
      boarding: form.boarding || null,
      cte: form.cte || null,
      complementaryCte: form.complementaryCte || null,
      icms: form.icms ?? null,
      complementaryIcms: form.complementaryIcms || null,
      tollValue: form.tollValue ?? null,
      tollStatus: form.tollStatus || null,
      observations: form.observations || null,
      complementaryDelivery: form.complementaryDelivery || null,
    });
  }

  toString(val: any): string {
    return val != null ? String(val) : '';
  }

  codigoStr = computed(() => {
    if (!this.frete?.id) return '???';
    return String(this.frete.id).padStart(4, '0');
  });

  viagemOpts = computed(() => {
    return this.data.VIAGENS().map((v: any) => ({
      value: String(v.codigo),
      label: `${v.codigoStr} · ${v.motorista?.nome ?? '-'} · ${v.cavalo?.placa ?? '-'} · ${v.origemLabel ?? '-'} -> ${v.destinoLabel ?? 'sem destino'}`,
    }));
  });

  statusLabel(status: string | null | undefined): string {
    return this.data.deliveryStatusFromApi(status);
  }
}
