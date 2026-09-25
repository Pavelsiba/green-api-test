import { describe, expect, it, vi } from "vitest"
import { greenApi } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { authQueryKeys, instanceStateQueryOptions } from "./auth-queries"

vi.mock("@/shared/api", () => ({
  greenApi: { getStateInstance: vi.fn() }
}))

const credentials = { apiUrl: "https://x", idInstance: "7201000001", apiTokenInstance: "tkn" }

describe("instanceStateQueryOptions", () => {
  it("keys the state by idInstance under the auth namespace", () => {
    expect(instanceStateQueryOptions(credentials).queryKey).toEqual(["auth", "7201000001", "state"])
    expect(authQueryKeys.instanceState("7201000001")).toEqual(
      instanceStateQueryOptions(credentials).queryKey
    )
  })

  it("checks the explicit credentials, not the stored ones", async () => {
    vi.mocked(greenApi.getStateInstance).mockResolvedValue("authorized")
    const { queryClient } = createQueryWrapper()

    expect(await queryClient.fetchQuery(instanceStateQueryOptions(credentials))).toBe("authorized")
    expect(greenApi.getStateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ auth: credentials })
    )
  })
})
