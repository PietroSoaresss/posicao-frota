import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateMotoristaModalComponent } from './create-motorista-modal.component';
import { DataService } from '../../../core/services/data.service';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

describe('CreateMotoristaModalComponent', () => {
  let component: CreateMotoristaModalComponent;
  let fixture: ComponentFixture<CreateMotoristaModalComponent>;
  let dataServiceMock: any;

  beforeEach(async () => {
    dataServiceMock = {
      CIDADES: signal([]),
      estadoById: () => null
    };

    await TestBed.configureTestingModule({
      imports: [CreateMotoristaModalComponent],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateMotoristaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty and clean form', () => {
    expect(component.form().nome).toBe('');
    expect(component.dirty()).toBeFalse();
  });

  it('should not emit onSave if form is invalid', () => {
    spyOn(window, 'alert');
    spyOn(component.onSave, 'emit');

    component.save();

    expect(window.alert).toHaveBeenCalledWith('Por favor, preencha todos os campos obrigatórios.');
    expect(component.onSave.emit).not.toHaveBeenCalled();
  });

  it('should emit form data when all fields are filled', () => {
    spyOn(component.onSave, 'emit');

    // Fill form
    component.upd('nome', 'João Silva');
    component.upd('sexo', 'M');
    component.upd('cnh', '123456789');
    component.upd('validade_cnh', '2030-01-01');
    component.upd('data_nascimento', '1990-05-15');
    component.upd('cod_cidade', '1');

    component.save();

    expect(component.onSave.emit).toHaveBeenCalledWith({
      nome: 'João Silva',
      sexo: 'M',
      cnh: '123456789',
      validade_cnh: '2030-01-01',
      data_nascimento: '1990-05-15',
      cod_cidade: 1 // Converted to number
    });
  });

  it('should set dirty flag when a field is updated', () => {
    component.upd('nome', 'Teste');
    expect(component.dirty()).toBeTrue();
  });
});
