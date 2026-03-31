
import os
import stripe
from supabase import create_client

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
supabase = create_client(os.environ.get('VITE_SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

async def handler(req, res):
    if req.method == 'OPTIONS':
        res.status_code = 200
        return res
    if req.method != 'POST':
        res.status_code = 405
        return {'error': 'Method not allowed'}

    try:
        user_id = req.body.get('userId')
        return_url = req.body.get('returnUrl')

        response = supabase.from_('subscriptions').select('stripe_customer_id').eq('user_id', user_id).maybe_single().execute()
        sub = response.data

        if not sub or not sub.get('stripe_customer_id'):
            res.status_code = 404
            return {'error': 'No billing account found. Please subscribe first.'}

        session = stripe.billing_portal.Session.create(
            customer=sub['stripe_customer_id'],
            return_url=return_url or f"{os.environ.get('VITE_APP_URL')}/dashboard/settings"
        )

        res.status_code = 200
        return {'url': session.url}
    except Exception as err:
        print('[billing-portal]', err)
        res.status_code = 500
        return {'error': str(err)}
