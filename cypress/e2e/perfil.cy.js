describe('Perfil - EduAudio IA', () => {

  beforeEach(() => {

    cy.visit('https://edu-audio-ia.vercel.app/');

    cy.contains('Iniciar Sesión').click();

    cy.get('[data-testid="login-email"]')
      .type('test@eduaudio.com');

    cy.get('[data-testid="login-password"]')
      .type('Test1234');

    cy.get('[data-testid="login-submit"]')
      .click();

    cy.contains('Bienvenido');

    cy.get('[data-testid="dashboard-perfil-btn"]')
      .click();

  });

  it('muestra la sección Perfil', () => {
    cy.contains('Perfil')
      .should('be.visible');
  });

  it('muestra el nombre del usuario', () => {
    cy.contains('Nombre completo')
      .should('be.visible');
  });

  it('muestra el botón Guardar nombre', () => {
    cy.contains('Guardar nombre')
      .should('be.visible');
  });

  it('permite editar el nombre', () => {

    cy.get('input[placeholder="Tu nombre"]')
      .clear()
      .type('Karina Romero Mendez');

    cy.contains('Guardar nombre')
      .should('be.visible');

  });

  it('muestra la sección Cambiar contraseña', () => {

    cy.contains('Cambiar contraseña')
      .should('be.visible');

  });

  it('muestra el campo Contraseña actual', () => {

    cy.get('input[placeholder="Tu contraseña actual"]')
      .should('be.visible');

  });

  it('muestra el campo Nueva contraseña', () => {

    cy.get('input[placeholder="Nueva contraseña"]')
      .should('be.visible');

  });

  it('muestra el campo Confirmar contraseña', () => {

    cy.get('input[placeholder="Repite la nueva contraseña"]')
      .should('be.visible');

  });

  it('permite escribir en los campos de contraseña', () => {

    cy.get('input[placeholder="Tu contraseña actual"]')
      .type('Actual123');

    cy.get('input[placeholder="Nueva contraseña"]')
      .type('Nueva12345');

    cy.get('input[placeholder="Repite la nueva contraseña"]')
      .type('Nueva12345');

  });

  it('muestra la zona de peligro', () => {

    cy.contains('Zona de peligro')
      .should('be.visible');

    cy.contains('Eliminar mi cuenta')
      .should('be.visible');

  });

  it('permite volver al Dashboard', () => {

    cy.contains('Volver')
      .click();

    cy.get('[data-testid="dashboard-welcome"]')
      .should('be.visible');

  });

});