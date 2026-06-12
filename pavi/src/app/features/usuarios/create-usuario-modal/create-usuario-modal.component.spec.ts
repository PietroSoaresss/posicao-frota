import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateUsuarioModalComponent } from './create-usuario-modal.component';

describe('CreateUsuarioModalComponent', () => {
  let component: CreateUsuarioModalComponent;
  let fixture: ComponentFixture<CreateUsuarioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUsuarioModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUsuarioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit create payload when form is valid', () => {
    spyOn(component.onSave, 'emit');

    component.upd('username', '  novo-admin  ');
    component.upd('password', 'segredo1');
    component.upd('confirmPassword', 'segredo1');
    component.upd('role', 'ADMIN');

    component.save();

    expect(component.onSave.emit).toHaveBeenCalledWith({
      username: 'novo-admin',
      password: 'segredo1',
      role: 'ADMIN',
    });
  });

  it('should expose both role options when creating a user', () => {
    expect(component.roleOptions).toEqual([
      { value: 'ADMIN', label: 'Administrador' },
      { value: 'OPERADOR', label: 'Operador' },
    ]);
  });

  it('should reject create when password is too short', () => {
    spyOn(window, 'alert');
    spyOn(component.onSave, 'emit');

    component.upd('username', 'novo-admin');
    component.upd('password', '12345');
    component.upd('confirmPassword', '12345');

    component.save();

    expect(window.alert).toHaveBeenCalledWith('A senha deve ter pelo menos 6 caracteres.');
    expect(component.onSave.emit).not.toHaveBeenCalled();
  });

  it('should reject create when password confirmation mismatches', () => {
    spyOn(window, 'alert');
    spyOn(component.onSave, 'emit');

    component.upd('username', 'novo-admin');
    component.upd('password', 'segredo1');
    component.upd('confirmPassword', 'segredo2');

    component.save();

    expect(window.alert).toHaveBeenCalledWith('A confirmação de senha não confere.');
    expect(component.onSave.emit).not.toHaveBeenCalled();
  });

  it('should emit update payload without password when editing', () => {
    component.usuario = { codigo: 7, username: 'admin', role: 'ADMIN' };
    component.currentUsername = 'operador';
    component.ngOnInit();
    fixture.detectChanges();
    spyOn(component.onSave, 'emit');

    component.upd('username', 'admin-ajustado');
    component.save();

    expect(component.onSave.emit).toHaveBeenCalledWith({
      username: 'admin-ajustado',
      role: 'ADMIN',
    });
  });

  it('should restrict self role options to admin', () => {
    component.usuario = { codigo: 1, username: 'admin', role: 'ADMIN' };
    component.currentUsername = 'admin';
    component.ngOnInit();

    expect(component.roleOptions).toEqual([
      { value: 'ADMIN', label: 'Administrador' },
      { value: 'OPERADOR', label: 'Operador', disabled: true },
    ]);
  });
}
