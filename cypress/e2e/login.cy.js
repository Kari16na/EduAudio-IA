describe('Login - EduAudio IA', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Iniciar Sesión').click();
  });

  it('muestra error si los campos están vacíos', () => {
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('Por favor completa todos los campos.');
  });

  it('inicia sesión correctamente con credenciales válidas', () => {
    cy.get('[data-testid="login-email"]').type('test@eduaudio.com');
    cy.get('[data-testid="login-password"]').type('Test1234');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('Bienvenido');
  });

  it('muestra error con credenciales incorrectas', () => {
    cy.get('[data-testid="login-email"]').type('correo_falso@ejemplo.com');
    cy.get('[data-testid="login-password"]').type('claveIncorrecta');
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="login-error"]').should('be.visible');
  });
});