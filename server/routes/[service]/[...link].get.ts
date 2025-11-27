import { $try, $tryAsync } from "error-by-value"
import { deleteURLSearchParams } from "../../services/utils"
import deezer_service from "../../services/deezer"
import spotify_service from "../../services/spotify"
import tidal_service from "../../services/tidal"

const SUPPORTED_SERVICE = ["spotify", "deezer", "tidal", "lastfm"]
const SUPPORTED_LINK_HOSTNAME = ["open.spotify.com", "link.deezer.com", "www.deezer.com", "tidal.com", "www.last.fm"]

const services = [deezer_service, spotify_service, tidal_service]

export default defineEventHandler(async event => {
  const destination_service = getRouterParam(event, "service")
  const link = getRouterParam(event, "link")

  if (!destination_service || !destination_service?.length)
    throw createError({ status: 400, statusMessage: "Bad Request", message: "empty service" })
  if (!SUPPORTED_SERVICE.includes(destination_service))
    throw createError({ status: 400, statusMessage: "Bad Request", message: "unsupported service" })

  if (!link || !link?.length) throw createError({ status: 400, statusMessage: "Bad Request", message: "empty link" })
  let { data: url, error: url_parse_error }: { data: URL; error: Error } = $try(
    () => new URL(link.startsWith("https://") ? link : "https://" + link)
  )
  if (url_parse_error) throw createError({ status: 400, statusMessage: "Bad Request", message: "unsuported link format" })
  if (!SUPPORTED_LINK_HOSTNAME.includes(url.hostname))
    throw createError({ status: 400, statusMessage: "Bad Request", message: "unsuported link hostname" })

  /** Resolve redirection from Deezer url shortner */
  if (url.hostname === "link.deezer.com") {
    const response = await $fetch.raw(url.toString())
    const resolved_url = new URL(response.url)
    /** Remove tracking params */
    url = deleteURLSearchParams(resolved_url)
  }

  let universal_identifiers: Identifiers = { isrc: undefined, upc: undefined, name: undefined }
  for (const service of services)
    if (service.hostname === url.hostname) {
      if (service.name === destination_service)
        throw createError({ status: 400, statusMessage: "Bad Request", message: "source and destination service can't be the same" })

      const { data, error } = await $tryAsync(service.extractFromLink(url))
      if (error) throw createError({ status: 500, message: error })
      universal_identifiers = data
    }

  if (!universal_identifiers || !Object.values(universal_identifiers).filter(Boolean).length)
    throw createError({ status: 500, message: "failed to find universal indentifier when parsing url" })

  let destination_link = undefined
  for (const service of services)
    if (service.name === destination_service) {
      const { data, error } = await $tryAsync(service.generateLink(universal_identifiers))
      
      if (error) throw createError({ status: 500, message: error })
      destination_link = data
    }

  if (!destination_link || !destination_link.length)
    throw createError({ status: 500, message: "failed to find generate link for specified service" })
  
  return sendRedirect(event, destination_link, 301)
})
