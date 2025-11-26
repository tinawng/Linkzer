import { describe, test, expect } from "bun:test"
import { ofetch } from "ofetch"
import { useRuntimeConfig } from "../nuxt-mocks"

global.$fetch = ofetch
global.useRuntimeConfig = useRuntimeConfig

describe("Spotify extractFromLink", async () => {
  const { default: spotify_service } = await import("../../server/services/spotify")

  test("extract track isrc", async () => {
    expect(
      await spotify_service.extractFromLink(
        new URL(
          "https://open.spotify.com/track/6RQ0i7rApnnWSI8uEiGVVF?si=61865c79535543aa"
        )
      )
    ).toEqual({ isrc: "TCADB1791147" })
  })

  test("extract album upc", async () => {
    expect(
      await spotify_service.extractFromLink(
        new URL(
          "https://open.spotify.com/album/4o5dzQHDzmBBc4Z3jSWVR9"
        )
      )
    ).toEqual({ upc: "859734840785" })
  })

  test("extract artist name", async () => {
    expect(
      await spotify_service.extractFromLink(
        new URL(
          "https://open.spotify.com/artist/3ETLPQkcEd7z4k3IbZmXMq?si=tMxB6LozS5ewU5OroABa1g"
        )
      )
    ).toEqual({ name: "Cleo Sol" })
  })

  test("generate track link", async () => {
    expect(await spotify_service.generateLink({ isrc: "TCADB1791147" })).toBe("https://open.spotify.com/track/6RQ0i7rApnnWSI8uEiGVVF")
  })
  test("generate album link", async () => {
    expect(await spotify_service.generateLink({ upc: "859734840785" })).toBe("https://open.spotify.com/album/4o5dzQHDzmBBc4Z3jSWVR9")
  })
  test("generate artist link", async () => {
    expect(await spotify_service.generateLink({ name: "Cleo Sol" })).toBe("https://open.spotify.com/artist/3ETLPQkcEd7z4k3IbZmXMq")
  })
})
