-- Create storage policies for product-files bucket to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "Authenticated users can view product files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-files');

CREATE POLICY "Users can update own product files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own product files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]);