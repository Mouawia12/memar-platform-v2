const memar_countries = [
  {iso:'KW',code:'+965',flag:'🇰🇼'},{iso:'SA',code:'+966',flag:'🇸🇦'},
  {iso:'AE',code:'+971',flag:'🇦🇪'},{iso:'BH',code:'+973',flag:'🇧🇭'},
  {iso:'QA',code:'+974',flag:'🇶🇦'},{iso:'OM',code:'+968',flag:'🇴🇲'},
  {iso:'EG',code:'+20',flag:'🇪🇬'},{iso:'JO',code:'+962',flag:'🇯🇴'},
  {iso:'LB',code:'+961',flag:'🇱🇧'},{iso:'IQ',code:'+964',flag:'🇮🇶'},
  {iso:'SY',code:'+963',flag:'🇸🇾'},{iso:'PS',code:'+970',flag:'🇵🇸'},
  {iso:'YE',code:'+967',flag:'🇾🇪'},{iso:'SD',code:'+249',flag:'🇸🇩'},
  {iso:'MA',code:'+212',flag:'🇲🇦'},{iso:'DZ',code:'+213',flag:'🇩🇿'},
  {iso:'TN',code:'+216',flag:'🇹🇳'},{iso:'LY',code:'+218',flag:'🇱🇾'},
  {iso:'MR',code:'+222',flag:'🇲🇷'},{iso:'SO',code:'+252',flag:'🇸🇴'},
  {iso:'US',code:'+1',flag:'🇺🇸'},{iso:'CA',code:'+1',flag:'🇨🇦'},
  {iso:'GB',code:'+44',flag:'🇬🇧'},{iso:'AU',code:'+61',flag:'🇦🇺'},
  {iso:'DE',code:'+49',flag:'🇩🇪'},{iso:'FR',code:'+33',flag:'🇫🇷'},
  {iso:'IT',code:'+39',flag:'🇮🇹'},{iso:'ES',code:'+34',flag:'🇪🇸'},
  {iso:'TR',code:'+90',flag:'🇹🇷'},{iso:'IN',code:'+91',flag:'🇮🇳'},
  {iso:'PK',code:'+92',flag:'🇵🇰'},{iso:'CN',code:'+86',flag:'🇨🇳'},
  {iso:'JP',code:'+81',flag:'🇯🇵'}
];
function getCountryOptions() {
  return memar_countries.map(c => '<option value="' + c.code + '">' + c.flag + ' ' + c.code + '</option>').join('');
}
