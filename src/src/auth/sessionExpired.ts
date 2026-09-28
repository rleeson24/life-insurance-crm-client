export class SessionExpiredError extends Error {
  constructor() {
    super('Your session expired. Sign in again.')
    this.name = 'SessionExpiredError'
  }
}
