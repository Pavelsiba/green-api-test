import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ApiError, greenApi } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { InstanceStateError } from "../../lib/instance-state-error"
import { credentialsAtom } from "../credentials-atom"
import { useLogin } from "./use-login"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  greenApi: { getStateInstance: vi.fn() },
  setCredentials: vi.fn()
}))

const credentials = {
  apiUrl: "https://7201.api.green-api.com",
  idInstance: "7201000001",
  apiTokenInstance: "tkn"
}

const renderLogin = () => {
  const { wrapper, store } = createQueryWrapper()
  const { result } = renderHook(() => useLogin(), { wrapper })
  return { result, store }
}

describe("useLogin", () => {
  it("saves credentials when the instance is authorized", async () => {
    vi.mocked(greenApi.getStateInstance).mockResolvedValue("authorized")
    const { result, store } = renderLogin()

    act(() => result.current.login(credentials))

    await waitFor(() => expect(store.get(credentialsAtom)).toEqual(credentials))
    expect(greenApi.getStateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ auth: credentials })
    )
  })

  it("rejects an instance that is not authorized and keeps the user logged out", async () => {
    vi.mocked(greenApi.getStateInstance).mockResolvedValue("notAuthorized")
    const { result, store } = renderLogin()

    act(() => result.current.login(credentials))

    await waitFor(() => expect(result.current.error).toBeInstanceOf(InstanceStateError))
    expect(result.current.error).toMatchObject({ state: "notAuthorized" })
    expect(store.get(credentialsAtom)).toBeNull()
  })

  it("asks the server again on retry instead of reusing the cached state", async () => {
    vi.mocked(greenApi.getStateInstance)
      .mockResolvedValueOnce("notAuthorized")
      .mockResolvedValueOnce("authorized")
    const { result, store } = renderLogin()

    act(() => result.current.login(credentials))
    await waitFor(() => expect(result.current.error).not.toBeNull())
    act(() => result.current.login(credentials))

    await waitFor(() => expect(store.get(credentialsAtom)).toEqual(credentials))
  })

  it("passes transport errors through", async () => {
    vi.mocked(greenApi.getStateInstance).mockRejectedValue(new ApiError({ kind: "unauthorized" }))
    const { result, store } = renderLogin()

    act(() => result.current.login(credentials))

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError))
    expect(store.get(credentialsAtom)).toBeNull()
  })
})
