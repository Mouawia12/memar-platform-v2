const url = 'https://lnhbmwercpvgegsecjhh.supabase.co/rest/v1/memar_sys_users?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGJtd2VyY3B2Z2Vnc2VjamhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1OTcsImV4cCI6MjA5MjQ3NDU5N30.18G25sd0QVTijMOzfo-HH-mWOZNLgf8tmuRGHeeDDmM';

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
