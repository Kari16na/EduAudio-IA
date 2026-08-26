describe('Pantalla de Olvidé mi contraseña (ForgotPassword)', () => {

  const correoValido = 'karina@example.com';

  beforeEach(() => {
    // No requiere login (no está en la lista de páginas "protegidas" de
    // App.jsx), así que solo navegamos Landing -> Login -> Olvidé mi contraseña
    cy.visit('http://localhost:5173');

    cy.contains('button', 'Iniciar Sesión').click();

    cy.get('[data-testid="login-email"]').should('be.visible'); // confirma que estamos en Login

    cy.contains('button', '¿Olvidaste tu contraseña?').click();

    cy.get('[data-testid="forgot-email"]').should('be.visible'); // confirma que estamos en ForgotPassword
  });

  it('muestra el formulario inicial con el botón deshabilitado si el correo está vacío', () => {
    cy.get('[data-testid="forgot-email"]').should('have.value', '');
    cy.get('[data-testid="forgot-submit"]').should('be.disabled');
  });

  it('habilita el botón de envío al escribir un correo', () => {
    cy.get('[data-testid="forgot-email"]').type(correoValido);
    cy.get('[data-testid="forgot-submit"]').should('not.be.disabled');
  });

  it('muestra error si el correo no contiene @ y no llama al backend', () => {
    cy.intercept('POST', '**/api/auth/forgot-password').as('forgotPassword');

    cy.get('[data-testid="forgot-email"]').type('correoinvalido.com');
    cy.get('[data-testid="forgot-submit"]').click();

    cy.get('[data-testid="forgot-error"]')
      .should('be.visible')
      .and('contain.text', 'correo electrónico válido');

    cy.get('@forgotPassword.all').should('have.length', 0);
  });

  it('muestra el texto "Enviando..." mientras la petición está en curso', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', (req) => {
      req.on('response', (res) => {
        res.setDelay(500);
      });
      req.reply({ statusCode: 200, body: { message: 'ok' } });
    }).as('forgotPassword');

    cy.get('[data-testid="forgot-email"]').type(correoValido);
    cy.get('[data-testid="forgot-submit"]').click();

    cy.get('[data-testid="forgot-submit"]').should('contain.text', 'Enviando...');
    cy.wait('@forgotPassword');
  });

  it('muestra la vista de éxito con el correo correcto tras un envío válido', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: { message: 'Correo enviado' }
    }).as('forgotPassword');

    cy.get('[data-testid="forgot-email"]').type(correoValido);
    cy.get('[data-testid="forgot-submit"]').click();

    cy.wait('@forgotPassword').its('request.body').should('deep.equal', { email: correoValido });

    cy.contains('¡Correo enviado!').should('be.visible');
    cy.contains(correoValido).should('be.visible');
    cy.contains('Revisa tu bandeja de entrada').should('be.visible');
  });

  it('muestra el mensaje de error que envía el backend si el correo no existe', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 404,
      body: { message: 'No existe una cuenta con ese correo' }
    }).as('forgotPasswordError');

    cy.get('[data-testid="forgot-email"]').type('noexiste@example.com');
    cy.get('[data-testid="forgot-submit"]').click();

    cy.wait('@forgotPasswordError');

    cy.get('[data-testid="forgot-error"]')
      .should('be.visible')
      .and('contain.text', 'No existe una cuenta con ese correo');

    cy.contains('¡Correo enviado!').should('not.exist');
  });

  it('muestra un error genérico si falla la conexión con el servidor', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', { forceNetworkError: true }).as('forgotPasswordFail');

    cy.get('[data-testid="forgot-email"]').type(correoValido);
    cy.get('[data-testid="forgot-submit"]').click();

    cy.wait('@forgotPasswordFail');

    cy.get('[data-testid="forgot-error"]')
      .should('be.visible')
      .and('contain.text', 'Error al conectar con el servidor');
  });

  it('permite volver al inicio de sesión desde el formulario', () => {
    cy.contains('button', 'Volver al inicio de sesión').click();

    // Confirmamos que estamos de vuelta en Login viendo sus campos propios
    cy.get('[data-testid="login-email"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

  it('permite volver al inicio de sesión desde la vista de éxito', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: { message: 'Correo enviado' }
    }).as('forgotPassword');

    cy.get('[data-testid="forgot-email"]').type(correoValido);
    cy.get('[data-testid="forgot-submit"]').click();
    cy.wait('@forgotPassword');

    cy.contains('button', 'Volver al inicio de sesión').click();

    cy.get('[data-testid="login-email"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

});