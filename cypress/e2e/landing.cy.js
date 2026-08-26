describe('Pantalla de Landing', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('muestra el contenido principal correctamente', () => {
    cy.get('[data-testid="landing-icon"]').should('be.visible');
    cy.contains('h1', 'Bienvenido a').should('be.visible');
    cy.contains('h1', 'EduAudio IA').should('be.visible');
    cy.contains('PDF y Word').should('be.visible');
  });

  it('muestra los badges de formatos soportados', () => {
    cy.get('[data-testid="landing-badge-pdf"]').should('be.visible').and('contain.text', 'PDF');
    cy.get('[data-testid="landing-badge-word"]').should('be.visible').and('contain.text', 'Word');
  });

  it('navega a Login al hacer clic en "Iniciar Sesión"', () => {
    cy.get('[data-testid="landing-login-btn"]').click();

    cy.get('[data-testid="login-email"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

  it('navega a SignUp al hacer clic en "Comenzar ahora"', () => {
    cy.get('[data-testid="landing-cta-btn"]').click();

    // El contenido de Landing ya no debe estar visible tras navegar
    cy.get('[data-testid="landing-cta-btn"]').should('not.exist');
    cy.contains('h1', 'Bienvenido a').should('not.exist');

    // NOTA: si me compartes SignUp.jsx puedo reforzar esta prueba
    // verificando un elemento específico de esa pantalla (por ejemplo,
    // un data-testid="signup-email" o similar).
  });

  it('vuelve a Landing al hacer clic en el logo/marca desde otra pantalla', () => {
    cy.get('[data-testid="landing-login-btn"]').click();
    cy.get('[data-testid="login-email"]').should('be.visible');

    // El botón de marca (logo + nombre) está dentro de NavBar y no tiene
    // data-testid propio; lo ubicamos por el texto del nombre de la app.
    cy.contains('button', 'EduAudio IA').click();

    cy.contains('h1', 'Bienvenido a').should('be.visible');
    cy.get('[data-testid="landing-login-btn"]').should('be.visible');
  });

});