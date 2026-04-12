from http.server import BaseHTTPRequestHandler
import json, os, stripe

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length)) if length else {}

            price_id    = body.get('priceId')
            user_id     = body.get('userId')
            email       = body.get('email')
            success_url = body.get('successUrl') or f"{os.environ.get('VITE_APP_URL')}/dashboard"
            cancel_url  = body.get('cancelUrl')  or f"{os.environ.get('VITE_APP_URL')}/pricing"

            if not all([price_id, user_id, email]):
                return self._json({'error': 'Missing required fields: priceId, userId, email'}, 400)

            session = stripe.checkout.Session.create(
                mode='subscription',
                payment_method_types=['card'],
                customer_email=email,
                line_items=[{'price': price_id, 'quantity': 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                subscription_data={
                    'trial_period_days': 14,
                    'metadata': {'userId': user_id},
                },
                metadata={'userId': user_id},
                allow_promotion_codes=True,
            )
            self._json({'url': session.url}, 200)

        except Exception as err:
            print('[create-checkout]', err)
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
        pass