from http.server import BaseHTTPRequestHandler
import json, os, stripe
from supabase import create_client

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
supabase = create_client(os.environ.get('VITE_SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length)) if length else {}

            user_id    = body.get('userId')
            return_url = body.get('returnUrl') or f"{os.environ.get('VITE_APP_URL')}/dashboard/settings"

            res = supabase.from_('subscriptions').select('stripe_customer_id').eq('user_id', user_id).maybe_single().execute()
            sub = res.data

            if not sub or not sub.get('stripe_customer_id'):
                return self._json({'error': 'No billing account found. Please subscribe first.'}, 404)

            session = stripe.billing_portal.Session.create(
                customer=sub['stripe_customer_id'],
                return_url=return_url,
            )
            self._json({'url': session.url}, 200)

        except Exception as err:
            print('[billing-portal]', err)
            self._json({'error': str(err)}, 500)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # Vercel logs suppress karo