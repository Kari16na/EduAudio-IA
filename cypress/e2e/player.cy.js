describe('Player - EduAudio IA', () => {

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

    cy.get('[data-testid="dashboard-view-library-btn"]')
      .click();

    cy.wait(3000);

    cy.contains('Escuchar')
      .first()
      .click();

  });

  it('muestra la página del reproductor', () => {
    cy.get('[data-testid="player-page"]')
      .should('exist');
  });

  it('muestra el título del audio', () => {
    cy.get('[data-testid="player-title"]')
      .should('exist');
  });

  it('muestra el texto sincronizado', () => {
    cy.get('[data-testid="player-text-box"]')
      .should('exist');
  });

  it('muestra el botón play pause', () => {
    cy.get('[data-testid="btn-play-pause"]')
      .should('exist');
  });

  it('muestra el botón retroceder', () => {
    cy.get('[data-testid="btn-skip-back"]')
      .should('exist');
  });

  it('muestra el botón avanzar', () => {
    cy.get('[data-testid="btn-skip-forward"]')
      .should('exist');
  });

  it('muestra la barra de progreso', () => {
    cy.get('[data-testid="progress-bar"]')
      .should('exist');
  });

  it('permite volver a Mis Audios', () => {
    cy.get('[data-testid="btn-back-to-audios"]')
      .click();

    cy.contains('Tu Biblioteca de Estudio')
      .should('be.visible');
  });

});