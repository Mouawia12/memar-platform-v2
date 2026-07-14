const url1 = 'https://lnhbmwercpvgegsecjhh.supabase.co/rest/v1/memar_crm_clients?select=*';
const url2 = 'https://lnhbmwercpvgegsecjhh.supabase.co/rest/v1/users?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGJtd2VyY3B2Z2Vnc2VjamhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1OTcsImV4cCI6MjA5MjQ3NDU5N30.18G25sd0QVTijMOzfo-HH-mWOZNLgf8tmuRGHeeDDmM';

Promise.all([
  fetch(url1, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(res => res.json().then(data => ({ status: res.status, data }))),
  fetch(url2, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(res => res.json().then(data => ({ status: res.status, data })))
]).then(results => {
  console.log('memar_crm_clients:', results[0].status, JSON.stringify(results[0].data).substring(0, 100));
  console.log('users:', results[1].status, JSON.stringify(results[1].data).substring(0, 100));
});
