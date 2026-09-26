import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { greenApi } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { LoginForm } from "./LoginForm"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  greenApi: { getStateInstance: vi.fn() },
  setCredentials: vi.fn()
}))

const renderForm = () => render(<LoginForm />, { wrapper: createQueryWrapper().wrapper })

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe("LoginForm", () => {
  it("shows field errors and does not call the server for invalid input", () => {
    renderForm()
    fill(/apiUrl/, "not a url")
    fill(/idInstance/, "abc")
    fill(/apiTokenInstance/, "")

    fireEvent.click(screen.getByRole("button", { name: "Войти" }))

    expect(screen.getByText(/Адрес вида/)).toBeInTheDocument()
    expect(screen.getByText(/Только цифры/)).toBeInTheDocument()
    expect(screen.getByText(/Укажите токен/)).toBeInTheDocument()
    expect(greenApi.getStateInstance).not.toHaveBeenCalled()
  })

  it("shows the server verdict for an instance that is not ready", async () => {
    vi.mocked(greenApi.getStateInstance).mockResolvedValue("notAuthorized")
    renderForm()
    fill(/apiUrl/, "https://7201.api.green-api.com")
    fill(/idInstance/, " 7201000001 ")
    fill(/apiTokenInstance/, "tkn")

    fireEvent.click(screen.getByRole("button", { name: "Войти" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/QR-код/)
    expect(greenApi.getStateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ idInstance: "7201000001" }) })
    )
  })
})
