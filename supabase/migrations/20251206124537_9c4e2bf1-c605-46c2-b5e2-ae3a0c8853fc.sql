
-- Fix Critical Security Vulnerability #1: transactions table
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Block transaction deletions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can view product transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only backend can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only backend can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

-- Create proper PERMISSIVE policies for transactions
CREATE POLICY "Users can view own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view product transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = transactions.product_id 
  AND products.creator_id = auth.uid()
));

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Critical Security Vulnerability #2: purchases table
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;

CREATE POLICY "Users can view own purchases" 
ON public.purchases 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" 
ON public.purchases 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Critical Security Vulnerability #3: affiliate_commissions table
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Affiliates can view own commissions" 
ON public.affiliate_commissions 
FOR SELECT 
TO authenticated
USING (auth.uid() = affiliate_id);

CREATE POLICY "Admins can view all commissions" 
ON public.affiliate_commissions 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Critical Security Vulnerability #4: community_members table
DROP POLICY IF EXISTS "Owners can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.community_members;

CREATE POLICY "Users can view own memberships" 
ON public.community_members 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Community owners can view their members" 
ON public.community_members 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM communities 
  WHERE communities.id = community_members.community_id 
  AND communities.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all community members" 
ON public.community_members 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Critical Security Vulnerability #5: user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix products table: Only show approved products publicly
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Anyone can view approved products" 
ON public.products 
FOR SELECT 
USING (status = 'approved');
