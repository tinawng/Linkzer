import { describe, test, expect } from "bun:test"
import { ofetch } from "ofetch"
global.$fetch = ofetch

describe("Deezer extractFromLink", async () => {
  const { default: deezer_service } = await import("../../server/services/deezer")

  test("extract track isrc", async () => {
    expect(
      await deezer_service.extractFromLink(
        new URL(
          "https://www.deezer.com/fr/track/2271581077?utm_campaign=clipboard-generic&utm_source=user_sharing&utm_content=track-2271581077&deferredFl=1&universal_link=1"
        )
      )
    ).toEqual({ isrc: "USQX91300808" })
  })

  test("extract album upc", async () => {
    expect(
      await deezer_service.extractFromLink(
        new URL(
          "https://www.deezer.com/fr/album/438167857?utm_campaign=clipboard-generic&utm_source=user_sharing&utm_content=album-438167857&deferredFl=1"
        )
      )
    ).toEqual({ upc: "196589921154" })
  })

  test("extract artist name", async () => {
    expect(
      await deezer_service.extractFromLink(
        new URL(
          "https://www.deezer.com/fr/artist/27?utm_campaign=clipboard-generic&utm_source=user_sharing&utm_content=artist-27&deferredFl=1"
        )
      )
    ).toEqual({ name: "Daft Punk" })
  })

  test("generate track link", async () => {
    expect(await deezer_service.generateLink({ isrc: "USQX91300808" })).toEqual("https://www.deezer.com/track/2271581077")
  })
  test("generate album link", async () => {
    expect(await deezer_service.generateLink({ upc: "196589921154" })).toEqual("https://www.deezer.com/album/438167857")
  })
  test("generate artist link", async () => {
    expect(await deezer_service.generateLink({ name: "Daft Punk" })).toEqual("https://www.deezer.com/artist/27")
  })
})
