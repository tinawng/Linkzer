import { $tryAsync } from "error-by-value"
import { deleteURLSearchParams } from "./utils"

/**
 * @description https://developer.spotify.com/documentation/web-api
 */
const $spotify = $fetch.create({ baseURL: "https://api.spotify.com/v1/" })

/**
 * @description https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
 */
const auth_token = { access_token: "", expires_at: 0 }
async function getAccessToken(): Promise<string> {
  if (auth_token.expires_at <= Date.now()) {
    const { data, error } = await $tryAsync(
      $fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: {
          grant_type: "client_credentials",
          client_id: useRuntimeConfig().SPOTIFY_USER_CLIENT,
          client_secret: useRuntimeConfig().SPOTIFY_USER_SECRET,
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
  name: "spotify",
  hostname: "open.spotify.com",
  extractFromLink: async (url: URL): Promise<Identifiers> => {
    /**
     * @example /track/4ZTC6KvnQxloiwmT0Yhypy
     *          /album/4o5dzQHDzmBBc4Z3jSWVR9
     *          /artist/3ETLPQkcEd7z4k3IbZmXMq
     */
    const pathname = deleteURLSearchParams(url).pathname

    if (pathname.includes("track/")) {
      const [_, track_id] = pathname.split("track/")
      if (!track_id || !track_id.length) throw "failed to parse track id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $spotify(`tracks/${track_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` } })
      )
      if (error) throw "failed to fetch track data from spotify api for track id " + track_id

      const isrc: string = data.external_ids?.isrc
      if (!isrc || !isrc.length) throw "failed to fetch track isrc from spotify api for track id " + track_id

      return { isrc }
    } else if (pathname.includes("album/")) {
      const [_, album_id] = pathname.split("album/")
      if (!album_id || !album_id.length) throw "failed to parse album id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $spotify(`albums/${album_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` } })
      )
      if (error) throw "failed to fetch album data from spotify api for album id " + album_id

      const upc: string = data.external_ids?.upc
      if (!upc || !upc.length) throw "failed to fetch album upc from spotify api for album id " + album_id

      return { upc }
    } else if (pathname.includes("artist/")) {
      const [_, artist_id] = pathname.split("artist/")
      if (!artist_id || !artist_id.length) throw "failed to parse artist id from pathname " + pathname

      const { data, error } = await $tryAsync(
        $spotify(`artists/${artist_id}`, { headers: { authorization: `Bearer ${await getAccessToken()}` } })
      )
      if (error) throw "failed to fetch artist data from spotify api for artist id " + artist_id

      const name: string = data.name
      if (!name || !name.length) throw "failed to fetch artist name from spotify api for artist id " + artist_id

      return { name }
    } else throw ""
  },
  generateLink: async (identifiers: Identifiers): Promise<string> => {
    if (identifiers.isrc) {
      const { data, error } = await $tryAsync(
        $spotify("search", {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { q: `isrc:${identifiers.isrc}`, type: "track", limit: 1 },
        })
      )
      if (error) throw "failed to fetch track data from spotify api with isrc " + identifiers.isrc
      if (!data?.tracks?.items[0]?.external_urls?.spotify) throw "failed to find track using spotify api with isrc " + identifiers.isrc

      return data.tracks.items[0].external_urls.spotify
    } else if (identifiers.upc) {
      const { data, error } = await $tryAsync(
        $spotify("search", {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { q: `upc:${identifiers.upc}`, type: "album", limit: 1 },
        })
      )
      if (error) throw "failed to fetch album data from spotify api with upc " + identifiers.upc
      if (!data?.albums?.items[0]?.external_urls?.spotify) throw "failed to find album using spotify api with upc " + identifiers.upc

      return data.albums.items[0].external_urls.spotify
    } else if (identifiers.name) {
      const { data, error } = await $tryAsync(
        $spotify("search", {
          headers: { authorization: `Bearer ${await getAccessToken()}` },
          query: { q: `artist:${identifiers.name}`, type: "artist", limit: 1 },
        })
      )
      if (error) throw "failed to fetch artist data from spotify api with name " + identifiers.name
      if (!data?.artists?.items[0]?.external_urls?.spotify) throw "failed to find artist using spotify api with name " + identifiers.name

      return data.artists.items[0].external_urls.spotify
    } else throw "identifiers object doesnt contains any identifier"
  },
}
