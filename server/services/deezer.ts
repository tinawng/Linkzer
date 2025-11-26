import { $tryAsync } from "error-by-value"
import { deleteURLSearchParams } from "./utils"

/**
 * @description https://developers.deezer.com/api
 */
const $deezer = $fetch.create({ baseURL: "https://api.deezer.com/" })

export default {
  name: "deezer",
  hostname: "www.deezer.com",
  extractFromLink: async (url: URL): Promise<Identifiers> => {
    /**
     * @example /us/track/3310722131
     *          /us/album/729000781
     *          /us/artist/300488961
     */
    const pathname = deleteURLSearchParams(url).pathname

    if (pathname.includes("track/")) {
      const [_, track_id] = pathname.split("track/")
      if (!track_id || !track_id.length || !/^\d+$/.test(track_id)) throw "failed to parse track id from pathname " + pathname

      const { data, error } = await $tryAsync($deezer(`track/${track_id}`))
      if (error) throw "failed to fetch track data from deezer api for track id " + track_id

      const isrc: string = data.isrc
      if (!isrc || !isrc.length) throw "failed to fetch track isrc from deezer api for track id " + track_id

      return { isrc }
    } else if (pathname.includes("album/")) {
      const [_, album_id] = pathname.split("album/")
      if (!album_id || !album_id.length || !/^\d+$/.test(album_id)) throw "failed to parse album id from pathname " + pathname

      const { data, error } = await $tryAsync($deezer(`album/${album_id}`))
      if (error) throw "failed to fetch album data from deezer api for album id " + album_id

      const upc: string = data.upc
      if (!upc || !upc.length) throw "failed to fetch album upc from deezer api for album id " + album_id

      return { upc }
    } else if (pathname.includes("artist/")) {
      const [_, artist_id] = pathname.split("artist/")
      if (!artist_id || !artist_id.length) throw "failed to parse artist id from pathname " + pathname

      const { data, error } = await $tryAsync($deezer(`artist/${artist_id}`))
      if (error) throw "failed to fetch artist data from deezer api for artist id " + artist_id

      const name: string = data.name
      if (!name || !name.length) throw "failed to fetch artist name from deezer api for artist id " + artist_id

      return { name }
    } else throw ""
  },
  generateLink: async (identifiers: Identifiers): Promise<string> => {
    if (identifiers.isrc) {
      const { data, error } = await $tryAsync($deezer(`track/isrc:${identifiers.isrc}`))
      if (error) throw "failed to fetch track data from deezer api with isrc" + identifiers.isrc
      if (!data.link || !data.link.length) throw "failed to find track using deezer api with isrc " + identifiers.isrc
      return data.link
    } else if (identifiers.upc) {
      const { data, error } = await $tryAsync($deezer(`album/upc:${identifiers.upc}`))
      if (error) throw "failed to fetch album data from deezer api with upc" + identifiers.upc
      if (!data.link || !data.link.length) throw "failed to find album using deezer api with upc " + identifiers.upc
      return data.link
    } else if (identifiers.name) {
      const { data, error } = await $tryAsync($deezer("search/artist", { query: { q: identifiers.name } }))
      if (error) throw "failed to fetch artist data from deezer api with name" + identifiers.name
      if (!data.data.length || !data.data[0] || !data.data[0].link)
        throw "failed to find artist using deezer api with name " + identifiers.name
      return data.data[0].link
    } else throw ""
  },
}
