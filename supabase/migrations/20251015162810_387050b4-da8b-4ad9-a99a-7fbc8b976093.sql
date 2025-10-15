-- Create products table for digital goods
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('ebook', 'course', 'template', 'document')),
  file_url TEXT,
  thumbnail_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own products
CREATE POLICY "Creators can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = creator_id);

-- Everyone can view products for marketplace
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paystack', 'flutterwave', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT UNIQUE,
  card_type TEXT CHECK (card_type IN ('visa', 'mastercard', 'verve', NULL)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = buyer_id);

-- Creators can view transactions for their products
CREATE POLICY "Creators can view product transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = transactions.product_id
      AND products.creator_id = auth.uid()
    )
  );

-- Create purchases table to track what users have bought
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Create affiliate commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own commissions
CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (auth.uid() = affiliate_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false);

-- Storage policies for product files
CREATE POLICY "Creators can upload product files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Creators can view own product files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Buyers can view files they purchased
CREATE POLICY "Buyers can view purchased files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-files' AND
    EXISTS (
      SELECT 1 FROM public.purchases
      JOIN public.products ON purchases.product_id = products.id
      WHERE purchases.user_id = auth.uid()
      AND (storage.foldername(name))[1] = products.creator_id::text
    )
  );