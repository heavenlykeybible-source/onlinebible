/* Heavenly Key language preference. This stores a preference only; it does not claim an untranslated Bible is available. */
(() => {
  const STORAGE_KEY = 'hk-preferred-language-v1';
  const languages = [
    ['en','English'],['yo','Yorùbá'],['ig','Igbo'],['ha','Hausa'],['pcm','Nigerian Pidgin'],
    ['fr','Français'],['es','Español'],['pt','Português'],['ar','العربية'],['zh','中文'],
    ['hi','हिन्दी'],['bn','বাংলা'],['ur','اردو'],['sw','Kiswahili'],['am','አማርኛ'],
    ['zu','isiZulu'],['xh','isiXhosa'],['af','Afrikaans'],['ak','Akan'],['ee','Eʋegbe'],
    ['tw','Twi'],['de','Deutsch'],['it','Italiano'],['nl','Nederlands'],['ru','Русский'],
    ['uk','Українська'],['pl','Polski'],['ro','Română'],['el','Ελληνικά'],['tr','Türkçe'],
    ['he','עברית'],['fa','فارسی'],['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['fil','Filipino'],
    ['ja','日本語'],['ko','한국어'],['th','ไทย'],['vi','Tiếng Việt'],['ne','नेपाली'],
    ['ta','தமிழ்'],['te','తెలుగు'],['mr','मराठी'],['pa','ਪੰਜਾਬੀ'],['or','ଓଡ଼ିଆ'],
    ['rw','Ikinyarwanda'],['rn','Ikirundi'],['lg','Luganda'],['sn','chiShona'],['ny','Chichewa'],
    ['st','Sesotho'],['tn','Setswana'],['so','Soomaali'],['om','Afaan Oromoo'],['ti','ትግርኛ'],
    ['km','ខ្មែរ'],['my','မြန်မာ'],['lo','ລາວ'],['si','සිංහල'],['ps','پښتو'],
    ['sq','Shqip'],['sr','Српски'],['hr','Hrvatski'],['cs','Čeština'],['hu','Magyar'],
    ['sv','Svenska'],['no','Norsk'],['da','Dansk'],['fi','Suomi'],['is','Íslenska'],
    ['ga','Gaeilge'],['cy','Cymraeg'],['eu','Euskara'],['ca','Català'],['ht','Kreyòl ayisyen'],
    ['qu','Runasimi'],['ay','Aymar aru'],['gn','Avañe’ẽ'],['nah','Nāhuatl']
  ];
  let saved = 'en';
  try {
    const candidate = localStorage.getItem(STORAGE_KEY);
    if (languages.some(([code]) => code === candidate)) saved = candidate;
  } catch (_) {}
  document.querySelectorAll('[data-language-preference]').forEach(select => {
    languages.forEach(([code, label]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = label + (code === 'en' ? ' — Bible text available' : ' — preference only for now');
      select.append(option);
    });
    select.value = saved;
    select.addEventListener('change', () => {
      saved = select.value;
      try { localStorage.setItem(STORAGE_KEY, saved); } catch (_) {}
      document.querySelectorAll('[data-language-preference]').forEach(other => { other.value = saved; });
      document.querySelectorAll('[data-language-status]').forEach(status => {
        status.textContent = saved === 'en'
          ? 'English (KJV) is currently the available complete Bible text.'
          : 'Your language preference is saved. The Bible text remains English (KJV) until a verified, licensed ' + (languages.find(([code]) => code === saved)?.[1] || 'selected-language') + ' translation is added.';
      });
    });
    const status = select.closest('.language-preference')?.querySelector('[data-language-status]');
    if (status && saved !== 'en') {
      status.textContent = 'Saved preference: ' + (languages.find(([code]) => code === saved)?.[1] || saved) + '. The Bible text remains English (KJV) until a verified, licensed translation is added.';
    }
  });
})();
