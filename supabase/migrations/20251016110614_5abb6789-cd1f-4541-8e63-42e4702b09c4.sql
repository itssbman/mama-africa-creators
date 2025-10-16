-- Add INSERT policy for transactions - only allow backend edge functions to create transactions
-- In practice, transactions should only be created by payment webhooks/edge functions
CREATE POLICY "Only backend can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (false); -- Completely block client-side inserts

-- Add UPDATE policy for transactions - only allow backend to update payment status
CREATE POLICY "Only backend can update transactions"
ON public.transactions
FOR UPDATE
USING (false); -- Completely block client-side updates

-- Add DELETE policy - only backend/admin should delete (blocked for now)
CREATE POLICY "Block transaction deletions"
ON public.transactions
FOR DELETE
USING (false);