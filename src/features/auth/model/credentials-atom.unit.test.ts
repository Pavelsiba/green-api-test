import { createStore } from "jotai"
import { RESET } from "jotai/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { setCredentials } from "@/shared/api"

vi.mock("@/shared/api", () => ({ setCredentials: vi.fn() }))

const STORAGE_KEY = "green-api-credentials"
const credentials = {
  apiUrl: "https://7201.api.green-api.com",
  idInstance: "7201000001",
  apiTokenInstance: "tkn"
}

/** Атом читает localStorage при импорте, поэтому каждый тест импортирует модуль заново */
const importAtom = async () => {
  vi.resetModules()
  const { credentialsAtom } = await import("./credentials-atom")
  return credentialsAtom
}

describe("credentialsAtom", () => {
  beforeEach(() => {
    vi.mocked(setCredentials).mockClear()
  })

  it("restores saved credentials and hands them to the transport on import", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
    const credentialsAtom = await importAtom()

    expect(setCredentials).toHaveBeenCalledWith(credentials)
    expect(createStore().get(credentialsAtom)).toEqual(credentials)
  })

  it("treats corrupted storage as logged out", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ idInstance: "abc" }))
    const credentialsAtom = await importAtom()

    expect(createStore().get(credentialsAtom)).toBeNull()
    expect(setCredentials).toHaveBeenLastCalledWith(null)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it("persists on login and clears storage and transport on RESET", async () => {
    const credentialsAtom = await importAtom()
    const store = createStore()

    store.set(credentialsAtom, credentials)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual(credentials)
    expect(setCredentials).toHaveBeenLastCalledWith(credentials)

    store.set(credentialsAtom, RESET)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(setCredentials).toHaveBeenLastCalledWith(null)
    expect(store.get(credentialsAtom)).toBeNull()
  })
})
