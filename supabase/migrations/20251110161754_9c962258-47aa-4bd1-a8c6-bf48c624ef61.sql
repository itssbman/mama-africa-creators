-- Add moderation fields to products table
ALTER TABLE public.products 
ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN flag_reason text,
ADD COLUMN flagged_at timestamp with time zone,
ADD COLUMN flagged_by uuid,
ADD COLUMN reviewed_at timestamp with time zone,
ADD COLUMN reviewed_by uuid;

-- Create index for faster moderation queries
CREATE INDEX idx_products_status ON public.products(status);

-- Update RLS policies to allow admins to update status
CREATE POLICY "Admins can update product status"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));