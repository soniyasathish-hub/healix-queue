
CREATE POLICY "Users upload own medical reports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own medical reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-reports' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'doctor')
  ));

CREATE POLICY "Users delete own medical reports" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
