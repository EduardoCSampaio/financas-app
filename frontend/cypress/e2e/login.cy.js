describe('Fluxo de Login', () => {
  it('deve fazer login com sucesso', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('teste@gmail.com');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();

    // Ajuste o que espera ver após o login
    cy.url().should('not.include', '/login');
    cy.contains(/dashboard|contas|bem-vindo/i);
  });
}); 