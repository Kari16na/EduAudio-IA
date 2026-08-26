describe('Mis Audios - EduAudio IA', () => {
  beforeEach(() => {
    // Login real por la interfaz
    cy.visit('http://localhost:5173');
    cy.contains('Iniciar Sesión').click();
    cy.get('[data-testid="login-email"]').type('test@eduaudio.com');
    cy.get('[data-testid="login-password"]').type('Test1234');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('Bienvenido');

    // Interceptamos la petición de audios para usar datos de prueba fijos
    cy.intercept('GET', '**/api/audios', { fixture: 'audios.json' }).as('getAudios');

    cy.get('[data-testid="dashboard-view-library-btn"]').click();
    cy.wait('@getAudios');
  });

  it('muestra la lista de audios cargados', () => {
    cy.get('[data-testid="audio-card"]').should('have.length', 2);
    cy.contains('Taller de Software.pdf');
    cy.contains('Resumen Biologia.docx');
  });

  it('el buscador filtra los audios por nombre', () => {
    cy.get('[data-testid="audios-search"]').type('Biologia');
    cy.get('[data-testid="audio-card"]').should('have.length', 1);
    cy.contains('Resumen Biologia.docx');
  });

  it('clic en "Escuchar" guarda el audio actual y navega al reproductor', () => {
    cy.get('[data-testid="audio-play-btn"]').first().click();
    cy.window().then((win) => {
      const current = JSON.parse(win.localStorage.getItem('currentAudio'));
      expect(current.fileName).to.eq('Taller de Software.pdf');
    });
  });

  it('clic en "Descargar" dispara la descarga del archivo', () => {
    cy.intercept('GET', '**/public/audio_test1.mp3', {
      statusCode: 200,
      headers: { 'content-type': 'audio/mpeg' },
      body: 'contenido-falso-de-audio'
    }).as('downloadFile');

    cy.get('[data-testid="audio-download-btn"]').first().click();
    cy.wait('@downloadFile');
  });

  it('permite editar el nombre de un audio', () => {
    cy.intercept('PUT', '**/api/audios/audio1', {
      statusCode: 200,
      body: { message: 'Nombre actualizado correctamente.', audio: { fileName: 'Nombre Nuevo.pdf' } }
    }).as('renombrar');

    cy.get('[data-testid="audio-edit-btn"]').first().click();
    cy.get('[data-testid="edit-name-input"]').clear().type('Nombre Nuevo.pdf');
    cy.get('[data-testid="edit-save-btn"]').click();
    cy.wait('@renombrar');
    cy.contains('Nombre Nuevo.pdf');
  });

  it('cancelar la edición cierra el modal sin guardar cambios', () => {
    cy.get('[data-testid="audio-edit-btn"]').first().click();
    cy.get('[data-testid="edit-name-input"]').clear().type('Este cambio no debe guardarse');
    cy.get('[data-testid="edit-cancel-btn"]').click();
    cy.contains('Este cambio no debe guardarse').should('not.exist');
    cy.contains('Taller de Software.pdf');
  });

  it('elimina un audio al confirmar', () => {
    cy.intercept('DELETE', '**/api/audios/audio1', {
      statusCode: 200,
      body: { message: 'Audio eliminado' }
    }).as('eliminar');

    cy.on('window:confirm', () => true);
    cy.get('[data-testid="audio-delete-btn"]').first().click();
    cy.wait('@eliminar');
    cy.get('[data-testid="audio-card"]').should('have.length', 1);
  });

  it('el botón "Volver al Dashboard" navega correctamente', () => {
    cy.get('[data-testid="audios-back-btn"]').click();
    cy.contains('Subir Documento');
  });

  it('el botón "Cerrar Sesión" cierra sesión y redirige al inicio', () => {
    cy.get('[data-testid="audios-logout-btn"]').click();
    cy.contains('Bienvenido a');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
});