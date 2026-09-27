import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ApiError } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { credentialsAtom } from "../credentials-atom"
import { useLogoutOnUnauthorized } from "./use-logout-on-unauthorized"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  setCredentials: vi.fn()
}))

const credentials = {
  apiUrl: "https://7201.api.green-api.com",
  idInstance: "7201000001",
  apiTokenInstance: "tkn"
}

const unauthorized = () => Promise.reject(new ApiError({ kind: "unauthorized" }))
const rateLimited = () => Promise.reject(new ApiError({ kind: "rateLimited" }))

const setup = ({ loggedIn }: { loggedIn: boolean }) => {
  const { wrapper, store, queryClient } = createQueryWrapper()
  if (loggedIn) store.set(credentialsAtom, credentials)
  queryClient.setQueryData(["chats"], ["cached"])
  renderHook(() => useLogoutOnUnauthorized(), { wrapper })
  return { store, queryClient }
}

describe("useLogoutOnUnauthorized", () => {
  it("logs out and clears the cache when a query gets 401", async () => {
    const { store, queryClient } = setup({ loggedIn: true })

    await queryClient.fetchQuery({ queryKey: ["history"], queryFn: unauthorized }).catch(() => {})

    await waitFor(() => expect(store.get(credentialsAtom)).toBeNull())
    expect(queryClient.getQueryData(["chats"])).toBeUndefined()
  })

  it("logs out when a mutation gets 401", async () => {
    const { store, queryClient } = setup({ loggedIn: true })

    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: unauthorized })
      .execute(undefined)
      .catch(() => {})

    await waitFor(() => expect(store.get(credentialsAtom)).toBeNull())
  })

  it("keeps the session on other errors", async () => {
    const { store, queryClient } = setup({ loggedIn: true })

    await queryClient.fetchQuery({ queryKey: ["history"], queryFn: rateLimited }).catch(() => {})

    expect(store.get(credentialsAtom)).toEqual(credentials)
    expect(queryClient.getQueryData(["chats"])).toEqual(["cached"])
  })

  it("does nothing on the login screen, where 401 is a form error", async () => {
    const { queryClient } = setup({ loggedIn: false })

    await queryClient.fetchQuery({ queryKey: ["state"], queryFn: unauthorized }).catch(() => {})

    expect(queryClient.getQueryData(["chats"])).toEqual(["cached"])
  })
})
