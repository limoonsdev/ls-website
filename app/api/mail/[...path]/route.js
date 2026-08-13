export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  return handleRequest(req, params, 'GET');
}

export async function POST(req, { params }) {
  return handleRequest(req, params, 'POST');
}

export async function DELETE(req, { params }) {
  return handleRequest(req, params, 'DELETE');
}

async function handleRequest(req, params, method) {
  try {
    const pathArray = params.path || [];
    const pathStr = pathArray.join('/');
    const url = new URL(req.url);
    const search = url.search; // keep query params
    
    const targetUrl = `https://api.mail.tm/${pathStr}${search}`;
    
    const headers = new Headers();
    // Copy safe headers from original request if needed
    if (req.headers.has('authorization')) headers.set('authorization', req.headers.get('authorization'));
    if (req.headers.has('content-type')) headers.set('content-type', req.headers.get('content-type'));
    if (req.headers.has('accept')) headers.set('accept', req.headers.get('accept'));
    
    const options = {
      method,
      headers
    };

    if (method !== 'GET' && method !== 'HEAD') {
      const body = await req.text();
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json'
      }
    });

  } catch (err) {
    console.error("Mail Proxy Error:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
