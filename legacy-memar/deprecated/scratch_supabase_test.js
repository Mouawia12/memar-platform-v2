const url = `${process.env.SUPABASE_URL}/rest/v1/memar_sys_users?select=*`;
const key = process.env.SUPABASE_ANON_KEY;

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(({status, data}) => {
  console.log('Status:', status);
  console.log('Data:', JSON.stringify(data).substring(0, 500));
})
.catch(err => console.error('Fetch error:', err));
