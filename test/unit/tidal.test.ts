import { describe, test, expect } from "bun:test"
import { ofetch } from "ofetch"
import { useRuntimeConfig } from "../nuxt-mocks"

global.$fetch = ofetch
global.useRuntimeConfig = useRuntimeConfig

describe("Tidal extractFromLink", async () => {
  const { default: tidal_service } = await import("../../server/services/tidal")

  test("extract track isrc", async () => {
    expect(
      await tidal_service.extractFromLink(
        new URL(
          "https://tidal.com/browse/track/92662438"
        )
      )
    ).toEqual({ isrc: "USWB11801231" })
  })

  test("extract album upc", async () => {
    expect(
      await tidal_service.extractFromLink(
        new URL(
          "https://tidal.com/album/92662426/u"
        )
      )
    ).toEqual({ upc: "093624905899" })
  })

  test("extract artist name", async () => {
    expect(
      await tidal_service.extractFromLink(
        new URL(
          "https://tidal.com/artist/3905394"
        )
      )
    ).toEqual({ name: "Mac Miller" })
  })

  test("generate track link", async () => {
    expect(await tidal_service.generateLink({ isrc: "USWB11801231" })).toEqual("https://tidal.com/browse/track/92662438")
  })
  test("generate album link", async () => {
    expect(await tidal_service.generateLink({ upc: "093624905899" })).toEqual("https://tidal.com/browse/album/92662426")
  })
  test("generate artist link", async () => {
    expect(await tidal_service.generateLink({ name: "Mac Miller" })).toEqual("https://tidal.com/browse/artist/3905394")
  })
})
