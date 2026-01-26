-- Wallet transactions table for complete ledger
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'purchased', 'slashed', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT CHECK (reference_type IN ('task_submission', 'bank_transfer', 'payment', 'admin_action', 'subscription')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment configurations for gateways
CREATE TABLE public.payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('paystack', 'flutterwave', 'paypal', 'manual_bank')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  public_key TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Bank transfer requests
CREATE TABLE public.bank_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_ngn NUMERIC(12,2) NOT NULL,
  capsules_to_credit INTEGER NOT NULL,
  package_id TEXT,
  proof_url TEXT NOT NULL,
  bank_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment records for gateway transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  provider_reference TEXT,
  amount_ngn NUMERIC(12,2) NOT NULL,
  amount_usd NUMERIC(12,2),
  capsules INTEGER NOT NULL,
  package_id TEXT,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('topup', 'subscription')),
  subscription_months INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- User subscriptions tracking
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'freemium',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- wallet_transactions policies
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- payment_configs policies (admin only + public read for enabled)
CREATE POLICY "Anyone can view enabled payment configs" ON public.payment_configs
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage payment configs" ON public.payment_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- bank_transfers policies
CREATE POLICY "Users can view own bank transfers" ON public.bank_transfers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bank transfers" ON public.bank_transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank transfers" ON public.bank_transfers
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bank transfers" ON public.bank_transfers
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- user_subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default payment configs
INSERT INTO public.payment_configs (provider, is_enabled, config) VALUES
  ('paystack', false, '{"bank_name": "", "account_number": "", "account_name": ""}'::jsonb),
  ('flutterwave', false, '{"bank_name": "", "account_number": "", "account_name": ""}'::jsonb),
  ('paypal', false, '{}'::jsonb),
  ('manual_bank', false, '{"bank_name": "", "account_number": "", "account_name": "", "instructions": "Transfer to our bank account and upload proof of payment."}'::jsonb);

-- Function to credit capsules and create transaction
CREATE OR REPLACE FUNCTION public.credit_capsules(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(total_capsules_earned, 0) INTO current_balance
  FROM public.user_trust_scores
  WHERE user_id = p_user_id;
  
  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;
  
  new_balance := current_balance + p_amount;
  
  -- Update trust scores
  UPDATE public.user_trust_scores
  SET total_capsules_earned = new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  VALUES (p_user_id, p_type, p_amount, new_balance, p_description, p_reference_id, p_reference_type);
  
  RETURN new_balance;
END;
$$;

-- Function to debit capsules
CREATE OR REPLACE FUNCTION public.debit_capsules(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(total_capsules_earned, 0) INTO current_balance
  FROM public.user_trust_scores
  WHERE user_id = p_user_id;
  
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  new_balance := current_balance - p_amount;
  
  -- Update trust scores
  UPDATE public.user_trust_scores
  SET total_capsules_earned = new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record (negative amount for debit)
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  VALUES (p_user_id, p_type, -p_amount, new_balance, p_description, p_reference_id, p_reference_type);
  
  RETURN new_balance;
END;
$$;