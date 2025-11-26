const handler = {
  get(target, prop) {
    if (prop === "public") return new Proxy({}, handler)
    if (target.public) return process.env["NUXT_".concat(prop)]
    if (!target.public) return process.env["NUXT_PUBLIC_".concat(prop)]
  },
}
const runtime_config_proxy = new Proxy({ public: {} }, handler)

export function useRuntimeConfig() {
  return runtime_config_proxy
}