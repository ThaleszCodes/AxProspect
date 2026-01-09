import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbdpihlfjujvsrteohn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmRwaWhsZmp1anZzcnRlb2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkyNjUsImV4cCI6MjA4MzU2NTI2NX0.QN9zCgxf9tsajPh5IirKhNKnRKOjLIuxecNa1SzuNGU';

export const supabase = createClient(supabaseUrl, supabaseKey);