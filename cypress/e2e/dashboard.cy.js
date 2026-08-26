describe('Dashboard - EduAudio IA', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Iniciar Sesión').click();
    cy.get('[data-testid="login-email"]').type('test@eduaudio.com');
    cy.get('[data-testid="login-password"]').type('Test1234');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('Bienvenido');
  });

  it('muestra el mensaje de bienvenida con el nombre del usuario', () => {
    cy.get('[data-testid="dashboard-welcome"]').should('contain', 'Bienvenido');
  });

  it('el botón de generar audio está deshabilitado sin archivo seleccionado', () => {
    cy.get('[data-testid="upload-generate-btn"]').should('be.disabled');
  });

  it('permite seleccionar un archivo PDF y habilita el botón de generar', () => {
    cy.get('[data-testid="upload-file-input"]').selectFile(
      'cypress/fixtures/documento-prueba.pdf',
      { force: true }
    );
    cy.get('[data-testid="upload-filename"]').should('contain', 'documento-prueba.pdf');
    cy.get('[data-testid="upload-generate-btn"]').should('not.be.disabled');
  });

  it('el botón "Mi Perfil" navega a la página de perfil', () => {
    cy.get('[data-testid="dashboard-perfil-btn"]').click();
    cy.contains('Actualizar nombre');
  });

  it('el botón "Ver toda mi biblioteca" navega a Mis Audios', () => {
    cy.get('[data-testid="dashboard-view-library-btn"]').click();
    cy.contains('Tu Biblioteca de Estudio');
  });

  it('el botón "Cerrar Sesión" cierra sesión y redirige al inicio', () => {
    cy.get('[data-testid="dashboard-logout-btn"]').click();
    cy.contains('Bienvenido a');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
});