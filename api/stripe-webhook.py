from http.server import BaseHTTPRequestHandler
import json, os, stripe
from supabase import create_client
from datetime import datetime, timezone

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
supabase = create_client(os.environ.get('VITE_SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

def ts_to_iso(unix_ts):
    return datetime.fromtimestamp(unix_ts, tz=timezone.utc).isoformat()

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        length   = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(length)
        sig      = self.headers.get('stripe-signature', '')

        try:
            event = stripe.Webhook.construct_event(
                raw_body, sig, os.environ.get('STRIPE_WEBHOOK_SECRET')
            )
        except Exception as err:
            print('[webhook] Signature failed:', err)
            return self._json({'error': str(err)}, 400)

        data     = event['data']['object']
        now_iso  = datetime.now(timezone.utc).isoformat()
        etype    = event['type']

        try:
            if etype == 'checkout.session.completed':
                if data.get('mode') == 'subscription':
                    user_id = (data.get('metadata') or {}).get('userId')
                    if user_id:
                        sub      = stripe.Subscription.retrieve(data['subscription'])
                        price_id = sub['items']['data'][0]['price']['id']
                        plan     = 'pro' if price_id == os.environ.get('STRIPE_PRICE_PRO') else 'starter'
                        supabase.from_('subscriptions').upsert({
                            'user_id':            user_id,
                            'stripe_customer_id': data['customer'],
                            'stripe_sub_id':      data['subscription'],
                            'plan':               plan,
                            'status':             sub['status'],
                            'current_period_end': ts_to_iso(sub['current_period_end']),
                            'updated_at':         now_iso,
                        }, on_conflict='user_id').execute()

            elif etype == 'customer.subscription.updated':
                price_id = data['items']['data'][0]['price']['id']
                plan     = 'pro' if price_id == os.environ.get('STRIPE_PRICE_PRO') else 'starter'
                supabase.from_('subscriptions').update({
                    'plan':               plan,
                    'status':             data['status'],
                    'current_period_end': ts_to_iso(data['current_period_end']),
                    'updated_at':         now_iso,
                }).eq('stripe_sub_id', data['id']).execute()

            elif etype == 'customer.subscription.deleted':
                supabase.from_('subscriptions').update(
                    {'status': 'canceled', 'updated_at': now_iso}
                ).eq('stripe_sub_id', data['id']).execute()

            elif etype == 'payment_intent.succeeded':
                order_id = (data.get('metadata') or {}).get('orderId')
                if order_id:
                    supabase.from_('orders').update({'status': 'paid'}).eq('id', order_id).execute()

        except Exception as err:
            print(f'[webhook] Error in {etype}:', err)
            # 200 return karo taaki Stripe retry na kare

        self._json({'received': True}, 200)

    def _json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass