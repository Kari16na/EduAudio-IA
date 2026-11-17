describe('Pantalla de Olvidé mi contraseña', () => {

  const correoValido = 'karina@example.com';

  beforeEach(() => {

    cy.visit('https://edu-audio-ia.vercel.app/');

    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('button', '¿Olvidaste tu contraseña?').click();

    cy.get('input[type="email"]')
      .should('be.visible');

  });

  it('muestra el formulario inicial con el botón deshabilitado si el correo está vacío', () => {

    cy.get('input[type="email"]')
      .should('have.value', '');

    cy.contains('button', 'Enviar enlace')
      .should('be.disabled');

  });

  it('habilita el botón al escribir un correo', () => {

    cy.get('input[type="email"]')
      .type(correoValido);

    cy.contains('button', 'Enviar enlace')
      .should('not.be.disabled');

  });

  it('muestra error cuando el correo no contiene @', () => {

    cy.get('input[type="email"]')
      .type('correoinvalido.com');

    cy.contains('button', 'Enviar enlace')
      .click();

    cy.contains('Ingresa un correo electrónico válido')
      .should('be.visible');

  });

  it('permite volver al login', () => {

    cy.contains('button', 'Volver al inicio de sesión')
      .click();

    cy.contains('Iniciar Sesión')
      .should('be.visible');

  });

});