type TErrorDetail = { kind: string }

/**
 * Единая ошибка приложения. `source` — слой или фича, где она возникла (`api`, `auth`,
 * `start-chat`), `detail` — вид (`kind`) и данные. Виды задаёт тот, кто создаёт ошибку:
 * `shared` знает только форму, а не правила фич. `isAppError` проверяет в рантайме и источник,
 * и вид по списку видов источника, поэтому сужение типа не может соврать.
 */
export class AppError<
  TSource extends string = string,
  TDetail extends TErrorDetail = TErrorDetail
> extends Error {
  readonly source: TSource
  readonly detail: TDetail

  constructor(source: TSource, detail: TDetail) {
    super(`${source}: ${detail.kind}`)
    this.source = source
    this.detail = detail
    this.name = "AppError"
  }
}

export const isAppError = <TSource extends string, TDetail extends TErrorDetail>(
  error: unknown,
  source: TSource,
  kinds: readonly string[]
): error is AppError<TSource, TDetail> =>
  error instanceof AppError && error.source === source && kinds.includes(error.detail.kind)
