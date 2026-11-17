describe('Mis Audios - EduAudio IA', () => {

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

  });

  it('muestra el título de la biblioteca', () => {

    cy.contains('Tu Biblioteca de Estudio')
      .should('be.visible');

  });

  it('muestra el subtítulo de la biblioteca', () => {

    cy.contains('Aquí están todos tus documentos convertidos a audio.')
      .should('be.visible');

  });

  it('muestra el buscador', () => {

    cy.get('input[placeholder="Buscar audio..."]')
      .should('be.visible');

  });

  it('permite escribir en el buscador', () => {

    cy.get('input[placeholder="Buscar audio..."]')
      .type('matematicas')
      .should('have.value', 'matematicas');

  });

  it('muestra el botón volver al dashboard', () => {

    cy.contains('Volver al Dashboard')
      .should('be.visible');

  });

  it('vuelve al dashboard al pulsar Volver al Dashboard', () => {

    cy.contains('Volver al Dashboard')
      .click();

    cy.get('[data-testid="dashboard-welcome"]')
      .should('be.visible');

  });

  it('muestra el estado de carga o contenido de audios', () => {

    cy.contains('Tu Biblioteca de Estudio')
      .should('be.visible');

  });

});
