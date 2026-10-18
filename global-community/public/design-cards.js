// One compact catalogue shared by the browser and Worker. No image assets.
export const CATEGORIES = [
  ['business','Business'],['ministry','Ministry'],['faith','Faith'],['revival','Revival'],
  ['prayer','Prayer'],['rapture','Rapture'],['eternity','Eternity'],['salvation','Salvation'],
  ['jesus','Jesus'],['repentance','Repentance'],['gospel','The Gospel'],['holiness','Holiness'],
  ['bible-study','Bible Study'],['testimony','Testimony'],['encouragement','Encouragement'],
  ['discipleship','Discipleship'],['missions','Missions & Evangelism'],['family','Christian Family'],['worship','Worship & Thanksgiving']
];
export const PALETTES = [
  ['Royal Promise','#173b78','#081c40','#ffffff','#ffdc75'],
  ['Wine & Gold','#781d3b','#3d1026','#ffffff','#ffdf82'],
  ['Living Water','#075e80','#063449','#ffffff','#a8edf1'],
  ['Sunrise Hope','#fff0ce','#ffd7a8','#422c31','#9d3e19'],
  ['Midnight Prayer','#232d67','#101738','#ffffff','#e7c878'],
  ['Scripture Garden','#1d634c','#10382d','#ffffff','#d6edb8'],
  ['Nations Light','#e8f0ff','#c7d9fb','#173b73','#7b2449'],
  ['Glory Rays','#fff5dc','#f8df9b','#513013','#855413'],
  ['Quiet Grace','#f4eafa','#dccbec','#492b60','#785094'],
  ['Ocean Peace','#def6f2','#afe4dc','#124e49','#216f66'],
  ['Covenant Blue','#243f98','#182963','#ffffff','#aee1ff'],
  ['White & Wine','#fff7f4','#f1dedb','#6e2338','#a04758'],
  // Premium collection: appended so published card-0 through card-575 never change.
  ['Crown of Grace','#183e83','#0b204a','#ffffff','#f1cc79'],
  ['Scarlet Testimony','#852d4f','#431b37','#ffffff','#ffe1a1'],
  ['Daybreak Faith','#fff3ce','#e5a462','#402b28','#8f3c28'],
  ['Prayer in the Night','#343873','#171b49','#ffffff','#d5c2ff'],
  ['Scripture Atelier','#fffaf0','#e6d6b7','#382c38','#80542e'],
  ['Emerald Covenant','#135e53','#0c3839','#ffffff','#e1c77e'],
  ['Nations in Motion','#234fb3','#102c6b','#ffffff','#ffdb75'],
  ['Rose of Hope','#fff0ee','#efc4c4','#542c41','#984761'],
  ['World Mission','#075c6b','#073847','#ffffff','#b9eddd'],
  ['Eternal Glory','#57427e','#29214f','#ffffff','#f6d6a1'],
  ['Living Word','#225580','#153154','#ffffff','#bde6fa'],
  ['Pure Light','#fffdf7','#e8e8de','#293d59','#986a38']
];
export const PREMIUM_START = 12;
export const LAYOUTS = [['classic','Classic'],['frame','Double Frame'],['banner','Banner'],['arch','Arch'],['corner','Corner Flourish'],['ribbon','Ribbon']];
export const PATTERNS = [['plain','Clean'],['rays','Light Rays'],['dots','Fine Dots'],['waves','Waves'],['diamonds','Diamonds'],['stripes','Stripes'],['rings','Rings'],['stars','Star Pattern']];
export const TEMPLATE_COUNT = PALETTES.length * LAYOUTS.length * PATTERNS.length;
export function templateAt(id) {
  const n=Number(String(id).replace(/^card-/,''));
  if(!/^card-\d+$/.test(String(id))||!Number.isInteger(n)||n<0||n>=TEMPLATE_COUNT) throw Error('Choose a valid Design Card.');
  const themeIndex=Math.floor(n/(LAYOUTS.length*PATTERNS.length));
  const palette=PALETTES[themeIndex];
  const layout=LAYOUTS[Math.floor(n/PATTERNS.length)%LAYOUTS.length],pattern=PATTERNS[n%PATTERNS.length];
  return {id:'card-'+n,palette,layout,pattern,themeIndex,premium:themeIndex>=PREMIUM_START,name:palette[0]+' · '+layout[1]+' · '+pattern[1]};
}
export function normalizeDesign(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Choose valid Design Card settings.');
  const id=raw.templateId||'card-0';templateAt(id);
  const choice=(key,values,fallback)=>{const v=raw[key]||fallback;if(!values.includes(v))throw Error('Invalid Design Card '+key+'.');return v;};
  return {templateId:String(id),alignment:choice('alignment',['left','center','right'],'center'),fontSize:choice('fontSize',['standard','large','spacious'],'standard'),size:choice('size',['auto','square','portrait','landscape','social','facebook'],'auto'),decoration:choice('decoration',['subtle','normal','bold'],'normal')};
}
export function parseVideoLink(value) {
  let u;try{u=new URL(String(value).trim());}catch{throw Error('Paste a valid YouTube or Facebook video link.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Use an HTTPS YouTube or Facebook video link.');
  const h=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(h)) {
    const id=h==='youtu.be'?parts[0]:parts[0]==='watch'?u.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:null;
    if(!/^[\w-]{11}$/.test(id||''))throw Error('Use a link to one YouTube video.');
    return {provider:'youtube',url:'https://www.youtube.com/watch?v='+id,embedUrl:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1',canEmbed:true};
  }
  if(['facebook.com','www.facebook.com','m.facebook.com','web.facebook.com'].includes(h)) {
    const v=u.searchParams.get('v');
    const known=(parts[0]==='watch'&&/^\d+$/.test(v||''))||/\/(?:videos|reel)\/\d+(?:\/|$)/.test(u.pathname);
    if(!known)throw Error('Use a Facebook video, reel or watch link.');
    const canonical='https://www.facebook.com'+u.pathname+(v?'?v='+v:'');
    return {provider:'facebook',url:canonical,embedUrl:'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(canonical)+'&show_text=false&autoplay=true',canEmbed:true};
  }
  if(h==='fb.watch'&&/^[\w-]+\/?$/.test(u.pathname.slice(1)))return {provider:'facebook',url:'https://fb.watch'+u.pathname,embedUrl:null,canEmbed:false};
  throw Error('Only YouTube and Facebook video links are supported.');
}
export function validatePostPresentation(input) {
  const format=input.postFormat||'article';
  if(!['design_card','article','video_link','premium_text'].includes(format))throw Error('Choose Design Card, Premium Text Studio, Article or Video Link.');
  const category=input.designCategory||'faith';
  if(!CATEGORIES.some(([id])=>id===category))throw Error('Choose a valid category.');
  const title=String(input.title??'').trim(),body=String(input.body??'').trim(),scripture=String(input.scripture??'').trim();
  if(title.length>180||scripture.length>240)throw Error('Use a title of up to 180 characters and a scripture reference of up to 240 characters.');
  if(body.length<2||body.length>(format==='article'?30000:10000))throw Error(format==='article'?'Write between 2 and 30,000 characters.':'Write between 2 and 10,000 characters.');
  if(format==='article'&&!title)throw Error('Give your article a title for its Design Card cover.');
  if(Array.isArray(input.mediaIds)&&input.mediaIds.length)throw Error('File attachments are disabled. Choose a Design Card or a video link.');
  const design=format==='video_link'||format==='premium_text'?null:normalizeDesign(input.design);
  if(format==='premium_text'){
    if(/^\\[theme=/.test(body)&&!/^\\[theme=[0-5]\\](?:\\n|$)/.test(body))throw Error('Choose a supported Premium Text Studio theme.');
    const tags=body.match(/\[(?:\/)?(?:bold|italic|color(?:=#[0-9a-fA-F]{6})?)\]/g)||[];
    if(tags.length>150)throw Error('Too many text style changes.');
    if(/\[(?:color|\/color|bold|\/bold|italic|\/italic)[^\]]*\]/i.test(body.replace(/\[(?:\/)?(?:bold|italic|color(?:=#[0-9a-fA-F]{6})?)\]/g,'')))throw Error('Use a supported text colour or style.');
  }
  const video=format==='video_link'?parseVideoLink(input.videoUrl):null;
  return {format,category,title,body,scripture,design,video};
}
export const REPORT_REASONS = [['sexual_content','Pornography / sexual content'],['harassment','Harassment / bullying'],['threat','Threats / violence'],['hate_or_abuse','Hate / abusive language'],['scam','Scam / exploitation'],['spam','Spam'],['impersonation','Impersonation'],['religious_promotion_debate','Against the Christian purpose'],['other','Other policy violation']];
export const COMMUNITY_RULES = [
  'No pornography, nudity or sexually explicit content, including linked videos.',
  'No harassment, bullying, hate speech, abusive language or threats.',
  'No promotion of violence, illegal activity or dangerous conduct.',
  'No scams, impersonation, spam or financial exploitation in the name of ministry.',
  'Respect privacy. Do not share another person’s private information without permission.',
  'Keep posts consistent with this Christian community’s purpose. No promotion of non-Christian worship or hostile religious debates.',
  'Advance the gospel of Christ, equip the saints, uphold the faith of our fathers, and live meaningfully in the will of God.',
  'Report anything against these values immediately and respectfully. Site staff review all reports; group managers also review reports from their groups. Do not attack the author.'
];

