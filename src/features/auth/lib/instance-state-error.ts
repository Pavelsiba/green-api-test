/** Креды верные, но инстанс не готов отправлять сообщения (`stateInstance` ≠ `authorized`) */
export class InstanceStateError extends Error {
  readonly state: string

  constructor(state: string) {
    super(`Instance state: ${state}`)
    this.state = state
    this.name = "InstanceStateError"
  }
}
