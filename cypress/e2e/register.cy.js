describe('Registro de Usuario - EduAudio IA', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Iniciar Sesión').click();
    cy.contains('Regístrate').click();
  });

  it('muestra error si los campos están vacíos', () => {
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Por favor completa todos los campos.');
  });

  it('muestra error si el correo no tiene @', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('correoinvalido.com');
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test1234');
    cy.get('[data-testid="signup-terms"]').check();
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Ingresa un correo electrónico válido');
  });

  it('muestra error si la contraseña tiene menos de 8 caracteres', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('123');
    cy.get('[data-testid="signup-confirm-password"]').type('123');
    cy.get('[data-testid="signup-terms"]').check();
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('La contraseña debe tener mínimo 8 caracteres.');
  });

  it('muestra error si las contraseñas no coinciden', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test5678');
    cy.get('[data-testid="signup-terms"]').check();
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Las contraseñas no coinciden.');
  });

  it('muestra error si no se aceptan los términos', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test1234');
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Debes aceptar los Términos y Condiciones.');
  });

  it('registra correctamente con datos válidos y redirige al Login', () => {
    const correoUnico = `ana${Date.now()}@test.com`;

    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type(correoUnico);
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test1234');
    cy.get('[data-testid="signup-terms"]').check();
    cy.get('[data-testid="signup-submit"]').click();

    cy.contains('Iniciar Sesión');
  });
});