const url1 = `${process.env.SUPABASE_URL}/rest/v1/memar_crm_clients?select=*`;
const url2 = `${process.env.SUPABASE_URL}/rest/v1/users?select=*`;
const key = process.env.SUPABASE_ANON_KEY;

Promise.all([
  fetch(url1, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(res => res.json().then(data => ({ status: res.status, data }))),
  fetch(url2, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(res => res.json().then(data => ({ status: res.status, data })))
]).then(results => {
  console.log('memar_crm_clients:', results[0].status, JSON.stringify(results[0].data).substring(0, 100));
  console.log('users:', results[1].status, JSON.stringify(results[1].data).substring(0, 100));
});
