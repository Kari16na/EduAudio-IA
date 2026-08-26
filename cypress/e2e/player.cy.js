describe('Reproductor de Audio - EduAudio IA', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Iniciar Sesión').click();
    cy.get('[data-testid="login-email"]').type('test@eduaudio.com');
    cy.get('[data-testid="login-password"]').type('Test1234');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('Bienvenido');

    cy.intercept('GET', '**/api/audios', { fixture: 'audios.json' }).as('getAudios');
    cy.get('[data-testid="dashboard-view-library-btn"]').click();
    cy.wait('@getAudios');

    // Evita que la prueba falle si el navegador rechaza reproducir
    // un audio de prueba que no es un archivo real
    cy.on('uncaught:exception', () => false);

    cy.get('[data-testid="audio-play-btn"]').first().click();
    cy.get('[data-testid="player-page"]').should('exist');
  });

  it('muestra el título del documento', () => {
    cy.get('[data-testid="player-title"]').should('contain', 'Taller de Software.pdf');
  });

  it('el elemento de audio tiene la fuente correcta', () => {
    cy.get('[data-testid="audio-element"]')
      .should('have.attr', 'src')
      .and('include', 'audio_test1.mp3');
  });

  it('el botón de play/pausa cambia su estado al hacer clic', () => {
    cy.get('[data-testid="btn-play-pause"]').should('have.attr', 'data-playing', 'false');
    cy.get('[data-testid="btn-play-pause"]').click();
    cy.get('[data-testid="btn-play-pause"]').should('have.attr', 'data-playing', 'true');
  });

  it('los botones de retroceder y avanzar existen y son clickeables', () => {
    cy.get('[data-testid="btn-skip-back"]').should('be.visible').click();
    cy.get('[data-testid="btn-skip-forward"]').should('be.visible').click();
  });

  it('la barra de progreso responde al hacer clic', () => {
    cy.get('[data-testid="progress-bar"]').click();
    cy.get('[data-testid="progress-fill"]').should('exist');
  });

  it('el botón "Mis Audios" regresa a la biblioteca', () => {
    cy.get('[data-testid="btn-back-to-audios"]').click();
    cy.contains('Tu Biblioteca de Estudio');
  });
});
