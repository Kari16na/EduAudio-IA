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

  it('rechaza correos sin formato correcto', () => {
    const correosInvalidos = ['correoinvalido.com', 'nombre@dominio', 'nombre@@dominio.com', 'nombre..apellido@dominio.com', 'nombre@-dominio.com', 'nombre@dominio-.com'];
    correosInvalidos.forEach((correo) => {
      cy.get('[data-testid="signup-name"]').clear().type('Ana Pérez');
      cy.get('[data-testid="signup-email"]').clear().type(correo);
      cy.get('[data-testid="signup-password"]').clear().type('Test1234');
      cy.get('[data-testid="signup-confirm-password"]').clear().type('Test1234');
      cy.get('[data-testid="signup-terms-link"]').click();
      cy.get('[data-testid="terms-body"]').scrollTo('bottom');
      cy.get('[data-testid="terms-accept-btn"]').click();
      cy.get('[data-testid="signup-submit"]').click();
      cy.contains('Ingresa un correo válido');
    });
  });

  it('muestra error si la contraseña tiene menos de 8 caracteres', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('123');
    cy.get('[data-testid="signup-confirm-password"]').type('123');
    cy.get('[data-testid="signup-terms-link"]').click();
    cy.get('[data-testid="terms-body"]').scrollTo('bottom');
    cy.get('[data-testid="terms-accept-btn"]').click();
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('La contraseña debe tener mínimo 8 caracteres.');
  });

  it('muestra error si las contraseñas no coinciden', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test5678');
    cy.get('[data-testid="signup-terms-link"]').click();
    cy.get('[data-testid="terms-body"]').scrollTo('bottom');
    cy.get('[data-testid="terms-accept-btn"]').click();
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Las contraseñas no coinciden.');
  });

  it('solicita aceptar los términos', () => {
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type('ana@test.com');
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test1234');
    cy.get('[data-testid="signup-submit"]').click();
    cy.contains('Debes aceptar los Términos y Condiciones para continuar.');
  });

  it('registra correctamente con un formato de correo válido y redirige al Login', () => {
    const correo = `ana${Date.now()}@gmail.com`;
    cy.intercept('POST', '**/api/users/register', { statusCode: 201, body: { message: 'Usuario registrado correctamente.' } }).as('register');
    cy.get('[data-testid="signup-name"]').type('Ana Pérez');
    cy.get('[data-testid="signup-email"]').type(correo);
    cy.get('[data-testid="signup-password"]').type('Test1234');
    cy.get('[data-testid="signup-confirm-password"]').type('Test1234');
    cy.get('[data-testid="signup-terms-link"]').click();
    cy.get('[data-testid="terms-body"]').scrollTo('bottom');
    cy.get('[data-testid="terms-accept-btn"]').click();
    cy.get('[data-testid="signup-submit"]').click();
    cy.wait('@register');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });
});
