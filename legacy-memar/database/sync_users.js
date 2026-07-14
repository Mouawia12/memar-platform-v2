const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEMO_EMPLOYEES = [
  { id: 'E1', name: 'م. أيمن الطوخي', role: 'admin', email: 'admin@memar.kw' },
  { id: 'E2', name: 'م. عبدالله', role: 'manager', email: 'pm@memar.kw' },
  { id: 'E3', name: 'م. دعاء', role: 'engineer', email: 'arch1@memar.kw' },
  { id: 'E4', name: 'م. خالد', role: 'engineer', email: 'arch2@memar.kw' },
  { id: 'E5', name: 'م. إسماعيل', role: 'engineer', email: 'struct1@memar.kw' },
  { id: 'E6', name: 'م. بيشوي', role: 'engineer', email: 'struct2@memar.kw' },
  { id: 'E7', name: 'أ. وليد', role: 'finance', email: 'acc@memar.kw' },
  { id: 'E8', name: 'أ. رنا', role: 'employee', email: 'sec@memar.kw' },
  { id: 'E9', name: 'مندوب أبو علي', role: 'employee', email: 'rep@memar.kw' },
  { id: 'E10', name: 'رسام نشأت', role: 'employee', email: 'draft@memar.kw' },
  { id: 'E11', name: 'أوفيس بوي جميل', role: 'employee', email: 'office@memar.kw' },
  { id: 'E12', name: 'م. أحمد سمير', role: 'engineer', email: '3d@memar.kw' },
  { id: 'E13', name: 'م. سمر', role: 'engineer', email: 'interior@memar.kw' },
  { id: 'E14', name: 'م. آلاء', role: 'engineer', email: 'ui@memar.kw' }
];

const DEMO_CLIENTS = [
  { name: 'أحمد العلي', email: 'client1@memar.kw' },
  { name: 'خالد خلف العازمي', email: 'client2@memar.kw' },
  { name: 'د. آمنة الرشيدي', email: 'client3@memar.kw' }
];

async function syncUsers() {
  console.log('Fetching existing users from auth.users...');
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  console.log(`Found ${users.length} existing users. Deleting...`);
  for (const user of users) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) console.error(`Error deleting user ${user.email}:`, delError);
    else console.log(`Deleted user ${user.email}`);
  }

  // Clear public.users
  console.log('Clearing public.users table...');
  const { error: pubDelError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (pubDelError) console.error('Error clearing public.users:', pubDelError);

  console.log('Creating demo employees...');
  for (const emp of DEMO_EMPLOYEES) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: `Memar@${emp.id}#2026`,
      email_confirm: true,
      user_metadata: { name: emp.name, role: emp.role }
    });

    if (createError) {
      console.error(`Error creating ${emp.email}:`, createError);
      continue;
    }

    console.log(`Created auth user ${emp.email} (${newUser.user.id})`);
    
    // Insert into public.users
    let mappedRole = emp.role;
    if (!['admin','super_admin','client','employee','guest'].includes(mappedRole)) {
       mappedRole = 'employee';
    }
    const { error: pubInsertError } = await supabase.from('users').insert({
      id: newUser.user.id,
      full_name_ar: emp.name,
      email: emp.email,
      role: mappedRole
    });

    if (pubInsertError) {
      console.error(`Error inserting ${emp.email} into public.users:`, pubInsertError);
    }
  }

  console.log('Creating demo clients...');
  for (const client of DEMO_CLIENTS) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: client.email,
      password: `Client@123#2026`,
      email_confirm: true,
      user_metadata: { name: client.name, role: 'client' }
    });

    if (createError) {
      console.error(`Error creating ${client.email}:`, createError);
      continue;
    }

    console.log(`Created auth user ${client.email} (${newUser.user.id})`);
    
    // Insert into public.users
    const { error: pubInsertError } = await supabase.from('users').insert({
      id: newUser.user.id,
      full_name_ar: client.name,
      email: client.email,
      role: 'client'
    });

    if (pubInsertError) {
      console.error(`Error inserting ${client.email} into public.users:`, pubInsertError);
    }
  }

  console.log('Sync complete!');
}

syncUsers();
