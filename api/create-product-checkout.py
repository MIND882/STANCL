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

            product_id  = body.get('productId')
            store_id    = body.get('storeId')
            success_url = body.get('successUrl')
            cancel_url  = body.get('cancelUrl')

            # Fetch product + store info
            res = supabase.from_('products').select('*, store:stores(*)').eq('id', product_id).single().execute()
            product = res.data

            if not product:
                return self._json({'error': 'Product not found'}, 404)
            if not product.get('is_active'):
                return self._json({'error': 'Product is not available'}, 400)

            # Create pending order
            order_res = (
                supabase.from_('orders')
                .insert({'store_id': store_id, 'product_id': product_id,
                         'amount': product['price'], 'status': 'pending'})
                .select().single().execute()
            )
            order = order_res.data

            product_data = {'name': product['name']}
            if product.get('description'):
                product_data['description'] = product['description']

            session = stripe.checkout.Session.create(
                mode='payment',
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': product['price'],
                        'product_data': product_data,
                    },
                    'quantity': 1,
                }],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={'orderId': order['id'], 'productId': product_id, 'storeId': store_id},
            )
            self._json({'url': session.url}, 200)

        except Exception as err:
            print('[create-product-checkout]', err)
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