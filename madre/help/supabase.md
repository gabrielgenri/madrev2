npm install -g supabase
supabase login
supabase init

supabase link --project-ref cxuoaydhmvafsgtklwny 
update public.profiles set rol = 'director' where email = 'somoscomunicacionlr@gmail.com';
   update public.profiles set rol = 'editor' where email = 'gabrielgenri@gmail.com';
