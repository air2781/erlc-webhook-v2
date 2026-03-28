/**
 * Config for Discord bot and Roblox group
 * Handles Roblox cookie sanitization and masking
 */

/**
 * Sanitize Roblox cookie
 * Keeps the full value, removes whitespace, quotes, and extra attributes
 */
function sanitizeCookie(raw) {
  if (!raw) return null;
  let cookie = raw.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  // If someone pasted the full header like ".ROBLOSECURITY=abc123; path=/", keep only the value
  if (cookie.includes(';')) cookie = cookie.split(';')[0];
  // If the cookie has "name=value", extract only the value
  if (cookie.includes('=')) cookie = cookie.split('=').slice(1).join('=');
  return cookie;
}

/**
 * Mask cookie for logging/debugging
 */
function maskCookie(cookie) {
  if (!cookie) return null;
  if (cookie.length <= 12) return '***';
  return cookie.slice(0, 6) + '...' + cookie.slice(-6);
}

// Full Roblox cookie including the warning prefix
const rawCookie = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhACIhwKBGR1aWQSFDE2OTEzMjYwMDMzOTU0OTYxOTA4KAE.gCLZEuaCRItrlOgYwFAe5xQz7ILxONR2ockEB2df20tQo9LynAny7J-X1Vou4iJsBXawknLKdnwpgZ4Ooecv-k2tIcoX1N3809phVlay1NyaICAGsrmTsAkAPcsk0QcYYfXzxgEr3Esnccj0SuvL0hhM1Tnq-xCG7boQdIsyEoYnijjiaJydZcfnIVrCA4WY0itK99f87g2x8UOwFWT94kUGYLgvfRdqckbAc1-vccbcU3RM4U_KhqCsDF3MPyXwL8DFx16DxwjQMk6M_z9vjrC-r65KwwhFl2_BjvjYvNJVSo3_GgI0sjhRXSO4DwXmSTC-KJIBTt9oAIKkTAZfjjE29Ft7RvZhi6RhlHXU53ILj_-HyhAUh2DxPdP3bZbv_Zj-JX-LRftGxzzk32ZvTr0HzKZvjd7d74xFlc3NBhpswfn-WlKvc8GLuaMmRq_xh_rRUaArVcCoGkCtkTRHnpb42wAvXV2CSET-3fV9X5kWDM0Wp4_O33DDbee1Y7sYeB7UBC7SxH5mV0O2rt9TFf7oAHVS_myo-g8jy3lVlckJ-uZcSnkvFqM_iWzM6nWpaCLZXNlN-qQRqh1R6_thNndONJGuHvpMZqNQ9zVT4fV6KfUw8f6DIVPwzf5ZHg98x4bmzQFVRZP-gCziVXQYQmV9cAEUOJ8lc8eeM3glkqD5inaW-mxmmokeTzyWDXW7lByj3EUyh18WXudB6wHTnM4xlvYbAEnEMV_tW5Zx-T1A6ITYpjIb0VlCUmGvK79M4yPF01LwDVdsnvDgGmd-91e8kTDhvy9wBrt9102jU3-P1JcF_yCW7PrHVbGfkQ560foEWyE77pNJ5RQAcSxyxi5VYzE2w-UzPzJLa17ocra-xFcvk-kfLqAZvOhiRNH6gQNiGk5vfpjch9iMRPmEfNijZAIlaTnpkiaQLZuo5WjlcxwYwfXhDrl8ac6i87jFPVpsiUQpg3TExQUcPpSad67jJtrAZLR2A82FHAh3ocW6F61ZGQEC_HAhl6S-9Lff9PI4c4uhRDM-Opf-jIV8WlVtrjk73Jb5jY70FIM0PadvN1d-9xHmRefESI9IJkfrSBucoYUzSuxlC5F2ujdYb8ej7XUfb84NPA6u6QAXhvX4D6z6iFhJEiBCGvfeUjj-cem6B3gL0JpLf9oDjrTz3fxwXnhrZWrR_ZKdf0K6HlwzO4hV";

const SecurityCookie = sanitizeCookie(rawCookie);
const MaskedSecurityCookie = maskCookie(SecurityCookie);

module.exports = {
  bot: {
    token: "MTQ1MzE3NzAxMTY2ODUyMTAxMA.Ggp8PB.6cCkkMlV3nV5-JAMqD1OS9xYeHfJ_G3oH6hfHk",
    clientId: "1453177011668521010",
    guildId: "1290085306489639023",
    discordEmbedChannelId: "1312854884969873418"
  },

  bloxlink: {
    apiKey: "f1b677db-72d3-4ff4-a2a1-bdb9e7d5925a"
  },

  roblox: {
    groupId: 15990892,
    securityCookie: SecurityCookie,
    maskedCookie: MaskedSecurityCookie,
    whitelistRoleIds: [
      "1312852163000664175",
      "1330398732679643296",
      "1290085306489639026"
    ],
    assignRobloxRoleName: "Whitelisted Member"
  },

  erlc: {
    baseUrl: "https://api.policeroleplay.community",
    apiKey: "dsRRIzjBpWQlFcXUaCjL-dQlxAmQZmikuDAGSdGYvBCBqyFSPnBRlfthgUiQR", // same structure style as maskedCookie

    endpoints: {
      v1: {
        server: "/v1/server",
        players: "/v1/server/players",
        queue: "/v1/server/queue",
        logs: "/v1/server/logs",
        command: "/v1/server/command"
      },

      v2: {
        server: "/v2/server",
        players: "/v2/players", // ✅ Correct V2 players endpoint
        command: "/v2/server/command"
      }
    }
  }
};