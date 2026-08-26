describe('Pantalla de Perfil', () => {

  const usuarioMock = {
    fullName: 'Karina Mendez',
    email: 'karina@example.com',
    createdAt: '2026-01-15T00:00:00.000Z'
  };

  beforeEach(() => {
    // Interceptamos las llamadas al backend para no depender de datos reales
    cy.intercept('POST', '**/api/users/login', {
      statusCode: 200,
      body: { token: 'token-de-prueba', user: usuarioMock }
    }).as('login');

    cy.intercept('GET', '**/api/audios', {
      statusCode: 200,
      body: [{ id: 1 }, { id: 2 }, { id: 3 }]
    }).as('getAudios');

    // La app siempre arranca en Landing (no hay rutas reales, todo vive
    // en un solo estado dentro de App.jsx), así que navegamos por clics
    // exactamente como lo haría una persona usando la app.
    cy.visit('http://localhost:5173');

    cy.contains('button', 'Iniciar Sesión').click();

    cy.get('[data-testid="login-email"]').type(usuarioMock.email);
    cy.get('[data-testid="login-password"]').type('cualquierClave123');
    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@login');

    cy.get('[data-testid="dashboard-welcome"]').should('be.visible');

    cy.get('[data-testid="dashboard-perfil-btn"]').click();

    cy.get('[data-testid="perfil-username"]').should('be.visible');
  });

  it('carga los datos del usuario correctamente', () => {
    cy.get('[data-testid="perfil-username"]').should('contain.text', 'Karina Mendez');
    cy.get('[data-testid="perfil-email"]').should('contain.text', 'karina@example.com');
    cy.get('[data-testid="perfil-audios-count"]').should('contain.text', '3');
  });

  describe('Actualizar nombre', () => {
    it('permite cambiar el nombre y guarda el cambio', () => {
      cy.intercept('PUT', '**/api/users/update', {
        statusCode: 200,
        body: { message: 'Usuario actualizado' }
      }).as('updateUser');

      cy.get('[data-testid="perfil-name-input"]')
        .clear()
        .type('Karina Romero Mendez');

      cy.get('[data-testid="perfil-save-btn"]').click();

      cy.wait('@updateUser');

      cy.get('[data-testid="perfil-success-msg"]')
        .should('be.visible')
        .and('contain.text', 'Nombre actualizado correctamente');

      cy.window().then((win) => {
        const userGuardado = JSON.parse(win.localStorage.getItem('user'));
        expect(userGuardado.fullName).to.eq('Karina Romero Mendez');
      });

      cy.get('[data-testid="perfil-username"]').should('contain.text', 'Karina Romero Mendez');
    });

    it('muestra un mensaje de error si el backend falla al actualizar', () => {
      cy.intercept('PUT', '**/api/users/update', {
        statusCode: 500,
        body: { message: 'Error del servidor' }
      }).as('updateUserError');

      cy.get('[data-testid="perfil-name-input"]').clear().type('Nombre Fallido');
      cy.get('[data-testid="perfil-save-btn"]').click();

      cy.wait('@updateUserError');

      cy.get('[data-testid="perfil-error-msg"]')
        .should('be.visible')
        .and('contain.text', 'Error al actualizar');
    });
  });

  describe('Cambiar foto de perfil', () => {
    it('permite seleccionar y guardar una nueva foto', () => {
      cy.intercept('POST', '**/api/users/photo', {
        statusCode: 200,
        body: { photoUrl: 'https://example.com/fotos/nueva-foto.jpg' }
      }).as('subirFoto');

      cy.get('[data-testid="perfil-photo-save-btn"]').should('not.exist');

      cy.get('[data-testid="perfil-photo-input"]').selectFile(
        {
          contents: Cypress.Buffer.from('contenido-de-prueba'),
          fileName: 'foto-perfil.png',
          mimeType: 'image/png'
        },
        { force: true }
      );

      cy.get('[data-testid="perfil-photo-preview"]').should('be.visible');
      cy.get('[data-testid="perfil-photo-save-btn"]').should('be.visible').click();

      cy.wait('@subirFoto');

      cy.get('[data-testid="perfil-photo-save-btn"]').should('not.exist');

      cy.window().then((win) => {
        const userGuardado = JSON.parse(win.localStorage.getItem('user'));
        expect(userGuardado.profilePhoto).to.eq('https://example.com/fotos/nueva-foto.jpg');
      });

      cy.get('[data-testid="perfil-photo-preview"]')
        .should('have.attr', 'src', 'https://example.com/fotos/nueva-foto.jpg');
    });
  });

  describe('Cambiar contraseña', () => {
    it('cambia la contraseña correctamente con datos válidos', () => {
      cy.intercept('PUT', '**/api/users/change-password', {
        statusCode: 200,
        body: { message: 'Contraseña actualizada' }
      }).as('cambiarPassword');

      cy.get('[data-testid="perfil-current-password"]').type('claveActual123');
      cy.get('[data-testid="perfil-new-password"]').type('claveNueva123');
      cy.get('[data-testid="perfil-confirm-password"]').type('claveNueva123');

      cy.get('[data-testid="perfil-change-password-btn"]').click();

      cy.wait('@cambiarPassword');

      cy.get('[data-testid="perfil-password-success-msg"]')
        .should('be.visible')
        .and('contain.text', 'Contraseña actualizada correctamente');

      cy.get('[data-testid="perfil-current-password"]').should('have.value', '');
      cy.get('[data-testid="perfil-new-password"]').should('have.value', '');
      cy.get('[data-testid="perfil-confirm-password"]').should('have.value', '');
    });

    it('muestra error si las contraseñas nuevas no coinciden', () => {
      cy.get('[data-testid="perfil-current-password"]').type('claveActual123');
      cy.get('[data-testid="perfil-new-password"]').type('claveNueva123');
      cy.get('[data-testid="perfil-confirm-password"]').type('otraClaveDistinta');

      cy.get('[data-testid="perfil-change-password-btn"]').click();

      cy.get('[data-testid="perfil-password-error-msg"]')
        .should('be.visible')
        .and('contain.text', 'Las contraseñas nuevas no coinciden');
    });

    it('muestra error si la nueva contraseña tiene menos de 8 caracteres', () => {
      cy.get('[data-testid="perfil-current-password"]').type('claveActual123');
      cy.get('[data-testid="perfil-new-password"]').type('corta');
      cy.get('[data-testid="perfil-confirm-password"]').type('corta');

      cy.get('[data-testid="perfil-change-password-btn"]').click();

      cy.get('[data-testid="perfil-password-error-msg"]')
        .should('be.visible')
        .and('contain.text', 'mínimo 8 caracteres');
    });

    it('muestra error si se dejan campos vacíos', () => {
      cy.get('[data-testid="perfil-change-password-btn"]').click();

      cy.get('[data-testid="perfil-password-error-msg"]')
        .should('be.visible')
        .and('contain.text', 'completa todos los campos');
    });

    it('muestra el mensaje de error que envía el backend si la contraseña actual es incorrecta', () => {
      cy.intercept('PUT', '**/api/users/change-password', {
        statusCode: 400,
        body: { message: 'La contraseña actual es incorrecta' }
      }).as('cambiarPasswordError');

      cy.get('[data-testid="perfil-current-password"]').type('claveIncorrecta');
      cy.get('[data-testid="perfil-new-password"]').type('claveNueva123');
      cy.get('[data-testid="perfil-confirm-password"]').type('claveNueva123');

      cy.get('[data-testid="perfil-change-password-btn"]').click();

      cy.wait('@cambiarPasswordError');

      cy.get('[data-testid="perfil-password-error-msg"]')
        .should('be.visible')
        .and('contain.text', 'La contraseña actual es incorrecta');
    });
  });

  describe('Navegación', () => {
    it('regresa al dashboard al hacer clic en "Volver"', () => {
      cy.get('[data-testid="perfil-back-btn"]').click();

      cy.get('[data-testid="dashboard-welcome"]').should('be.visible');
      cy.get('[data-testid="dashboard-perfil-btn"]').should('be.visible');
    });

    it('cierra sesión, limpia localStorage y regresa a Landing', () => {
      cy.get('[data-testid="perfil-logout-btn"]').click();

      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
      });

      // De vuelta en Landing: aparece el botón para iniciar sesión de nuevo
      cy.contains('button', 'Iniciar Sesión').should('be.visible');
      cy.contains('Bienvenido a').should('be.visible');
    });
  });

});