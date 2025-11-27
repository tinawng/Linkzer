import { $tryAsync } from "error-by-value"
import { deleteURLSearchParams } from "./utils"

/**
 * @description https://tidal-music.github.io/tidal-api-reference/
 */
const $tidal = $fetch.create({
  baseURL: "https://openapi.tidal.com/v2/",
  onResponseError({ request, response }) {
    console.error("[fetch response error]", request, response.status)
  },
})

/**
 * @description https://developer.tidal.com/documentation/api-sdk/api-sdk-authorization
 */

const auth_token = { access_token: "", expires_at: 0 }
async function getAccessToken(): Promise<string> {
  if (auth_token.expires_at <= Date.now()) {
    const { data, error } = await $tryAsync(
      $fetch("https://auth.tidal.com/v1/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: {
          grant_type: "client_credentials",
          client_id: useRuntimeConfig().TIDAL_CLIENT_ID,
          client_secret: useRuntimeConfig().TIDAL_CLIENT_SECRET,
        },
      })
    )
    if (error || !data?.access_token) throw "failed to get token from spotify accounts api"
    auth_token.access_token = data.access_token
    auth_token.expires_at = Date.now() + data.expires_in * 1000
  }

  return auth_token.access_token
}

export default {
  name: "tidal",
  hostname: "tidal.com",
  extractFromLink: async (url: URL): Promise<Identifiers> => {
    /**
     * @example /browse/track/92662438
     *          /album/92662426/u
     *          /artist/3905394
     */
    const pathname = deleteURLSearchParams(url).pathname

    if (pathname.includes("track/")) {
      const [_, track_id, ...__] = pathname.split("/track").at(-1).split("/")
      if (!track_id || !track_id.length) throw "failed to parse track id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $tidal(`tracks/${track_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` } })
      )
      if (error) throw "failed to fetch track data from tidal api for track id " + track_id

      const isrc: string = data.data?.attributes?.isrc
      if (!isrc || !isrc.length) throw "failed to fetch track isrc from tidal api for track id " + track_id

      return { isrc }
    } else if (pathname.includes("album/")) {
      const [_, album_id, ...__] = pathname.split("/album").at(-1).split("/")
      if (!album_id || !album_id.length) throw "failed to parse album id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $tidal(`albums/${album_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` }, query: { countryCode: "US" } })
      )
      if (error) throw "failed to fetch album data from tidal api for album id " + album_id

      const upc: string = data.data?.attributes?.barcodeId
      if (!upc || !upc.length) throw "failed to fetch album upc from tidal api for album id " + album_id

      return { upc }
    } else if (pathname.includes("artist/")) {
      const [_, artist_id, ...__] = pathname.split("/artist").at(-1).split("/")
      if (!artist_id || !artist_id.length) throw "failed to parse artist id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $tidal(`artists/${artist_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` }, query: { countryCode: "US" } })
      )
      if (error) throw "failed to fetch artist data from tidal api for artist id " + artist_id

      const name: string = data.data?.attributes?.name
      if (!name || !name.length) throw "failed to fetch artist name from tidal api for artist id " + artist_id

      return { name }
    } else throw "only tracks, albums or artists links are supported for now"
  },
  generateLink: async (identifiers: Identifiers): Promise<string> => {
    if (identifiers.isrc) {
      const { data, error } = await $tryAsync(
        $tidal("tracks", {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { "filter[isrc]": identifiers.isrc },
        })
      )
      if (error) throw "failed to fetch track data from tidal api with isrc " + identifiers.isrc

      if (!data.data?.[0]?.attributes?.externalLinks?.[0]?.href) throw "failed to find track using tidal api with isrc " + identifiers.isrc
      return data.data[0].attributes.externalLinks[0].href
    } else if (identifiers.upc) {
      const { data, error } = await $tryAsync(
        $tidal(`albums`, {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { "filter[barcodeId]": identifiers.upc, "countryCode": "US" },
        })
      )
      if (error) throw "failed to fetch album data from tidal api with upc " + identifiers.upc

      if (!data.data?.[0]?.attributes?.externalLinks?.[0]?.href) throw "failed to find album using tidal api with upc " + identifiers.upc
      return data.data[0].attributes.externalLinks[0].href
    } else if (identifiers.name) {
        /**
         * Tidal's fuzzy search is pretty bad and often gives wrong artist if not popular enough.
         */
      const { data, error } = await $tryAsync(
        $tidal(`searchResults/${identifiers.name}/relationships/artists`, {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { countryCode: "US" },
        })
      )
      if (error) throw "failed to fetch artist data from tidal api with name " + identifiers.name

      if (!data.data?.[0]?.id) throw "failed to find artist using tidal api with name " + identifiers.name
      return `https://tidal.com/browse/artist/${data.data[0].id}`
    } else throw "identifiers object does not contains any identifier"
  },
}
