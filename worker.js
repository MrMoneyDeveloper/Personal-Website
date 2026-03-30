export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (request.method !== 'GET' || response.status < 200 || response.status >= 300) {
      return response;
    }

    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    const headers = new Headers(response.headers);

    if (path.startsWith('/assets/')) {
      if (/\.(gif|png|jpe?g|webp|avif|svg|ico|mp4|webm|woff2?|ttf|otf)$/.test(path)) {
        headers.set('Cache-Control', 'public, max-age=2592000');
      } else if (/\.(css|js|mjs|json|map)$/.test(path)) {
        headers.set('Cache-Control', 'public, max-age=86400');
      }
    } else if (path === '/' || /\.html?$/.test(path) || !path.includes('.')) {
      headers.set('Cache-Control', 'public, max-age=120');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
