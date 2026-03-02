const API = 'http://localhost:5000/api/todos'

beforeEach(() => {
  cy.request('GET', API).then(res => {
    res.body.forEach((todo: { id: number }) => {
      cy.request('DELETE', `${API}/${todo.id}`)
    })
  })
  cy.visit('/')
})

describe('Todo App', () => {

  it('displays the page title', () => {
    cy.contains('To-Do List').should('be.visible')
  })

  it('shows empty state when no tasks', () => {
    cy.contains('Your grimoire is empty').should('be.visible')
  })

  it('can add a new task', () => {
    cy.intercept('POST', API).as('addTodo')
    cy.get('input[type="text"]').type('Brew a potion')
    cy.contains('Add').click()
    cy.wait('@addTodo')
    cy.contains('Brew a potion').should('be.visible')
  })

  it('can complete a task', () => {
    cy.intercept('POST', API).as('addTodo')
    cy.get('input[type="text"]').type('Pick mushrooms')
    cy.contains('Add').click()
    cy.wait('@addTodo')

    cy.intercept('PUT', `${API}/*`).as('toggleTodo')
    cy.contains('Pick mushrooms')
      .closest('div[class*="flex items-center"]')
      .find('[data-testid="toggle"]')
      .click()
    cy.wait('@toggleTodo')

    cy.contains('Pick mushrooms').should('have.class', 'line-through')
  })

  it('can delete a task', () => {
    cy.intercept('POST', API).as('addTodo')
    cy.get('input[type="text"]').type('Task to delete')
    cy.contains('Add').click()
    cy.wait('@addTodo')

    cy.intercept('DELETE', `${API}/*`).as('deleteTodo')
    cy.contains('Task to delete')
      .closest('div[class*="flex items-center"]')
      .find('[data-testid="delete"]')
      .click()
    cy.wait('@deleteTodo')

    cy.contains('Task to delete').should('not.exist')
  })

  it('filters active tasks', () => {
    cy.intercept('POST', API).as('addTodo')
    cy.get('input[type="text"]').type('Active task')
    cy.contains('Add').click()
    cy.wait('@addTodo')
    cy.get('input[type="text"]').type('Done task')
    cy.contains('Add').click()
    cy.wait('@addTodo')

    cy.intercept('PUT', `${API}/*`).as('toggleTodo')
    cy.contains('Done task')
      .closest('div[class*="flex items-center"]')
      .find('[data-testid="toggle"]')
      .click()
    cy.wait('@toggleTodo')

    cy.contains('Active').click()
    cy.contains('Active task').should('be.visible')
    cy.contains('Done task').should('not.exist')
  })

  it('filters completed tasks', () => {
    cy.intercept('POST', API).as('addTodo')
    cy.get('input[type="text"]').type('Task to complete')
    cy.contains('Add').click()
    cy.wait('@addTodo')

    cy.intercept('PUT', `${API}/*`).as('toggleTodo')
    cy.contains('Task to complete')
      .closest('div[class*="flex items-center"]')
      .find('[data-testid="toggle"]')
      .click()
    cy.wait('@toggleTodo')

    cy.contains('Done').click()
    cy.contains('Task to complete').should('be.visible')
  })

})
