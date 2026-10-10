export const REPOSITORY = 'davewilson2-droid/maninaskirt';
export const FILE = 'RemindMeYesterday/notices/feed.json';
const hosts = ['maninaskirt.com','www.maninaskirt.com','testflight.apple.com','apps.apple.com'];
export function validateFeed(feed) {
  if (feed?.schemaVersion !== 1 || !Array.isArray(feed.notices) || feed.notices.length > 100) throw Error('The saved notices could not be read safely. Nothing was changed.');
  const ids = new Set();
  for (const n of feed.notices) {
    if (!n || typeof n.id !== 'string' || !/^[\w-]{1,80}$/.test(n.id) || ids.has(n.id) || !Number.isInteger(n.revision) || n.revision < 1) throw Error('Invalid notice identity.');
    ids.add(n.id);
    validateNotice(n, false);
  }
  if (new TextEncoder().encode(JSON.stringify(feed,null,2)+'\n').length > 256000) throw Error('Notices are too large for the app. Shorten or remove older messages.');
  return feed;
}
export function validateNotice(n, future = true, now = new Date()) {
  for (const [key,max] of [['title',100],['message',2000]]) if (typeof n[key] !== 'string' || !n[key].trim() || [...n[key]].length > max) throw Error(`${key === 'title' ? 'Title' : 'Message'} is required, up to ${max} characters.`);
  for (const [key,values] of Object.entries({kind:['incident','maintenance','news'],status:['active','resolved','withdrawn'],area:['all','ai','email','calendar','app'],audience:['everyone','testers']})) if (!values.includes(n[key])) throw Error('Choose a valid '+key+'.');
  if (![n.startsAt,n.expiresAt,n.updatedAt].every(x => typeof x==='string' && /Z$/.test(x) && Number.isFinite(Date.parse(x)))) throw Error('Choose valid dates.');
  if (Date.parse(n.expiresAt)<=Date.parse(n.startsAt) || (future && (Date.parse(n.expiresAt)<=now.getTime() || Date.parse(n.expiresAt)-Date.parse(n.startsAt)>30*86400000))) throw Error('Choose an expiry after the start, within 30 days.');
  if (!!n.actionTitle !== !!n.actionURL) throw Error('Add both a button label and its link, or neither.');
  if (n.actionURL) {
    const u=new URL(n.actionURL);
    if (u.protocol!=='https:' || u.username || u.password || !hosts.includes(u.hostname) || (u.port && u.port!=='443') || n.actionURL.length>2048 || n.actionTitle.length>60) throw Error('Buttons can link to maninaskirt.com, TestFlight or the App Store using HTTPS.');
  }
  return n;
}
export function applyNotice(feed, notice, expectedRevision, now=new Date()) {
  validateFeed(feed); validateNotice(notice, notice.status!=='withdrawn', now);
  const previous=feed.notices.find(n=>n.id===notice.id);
  if ((previous?.revision ?? 0)!==expectedRevision || notice.revision!==expectedRevision+1) throw Error('This notice changed. Reload and review it before publishing.');
  const notices=feed.notices.filter(n=>n.id!==notice.id);
  // Keep the most recent 100; never remove an active notice to make room.
  if(notices.length>=100) {
    const oldest=notices.filter(n=>Date.parse(n.expiresAt)<now.getTime()-30*86400000).sort((a,b)=>Date.parse(a.updatedAt)-Date.parse(b.updatedAt))[0];
    if (!oldest) throw Error('Notice history is full. Older notices must expire before adding more.');
    notices.splice(notices.indexOf(oldest),1);
  }
  return validateFeed({schemaVersion:1,notices:[notice,...notices]});
}
export function encodeUTF8(value) { const bytes=new TextEncoder().encode(value); let binary=''; for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192)); return btoa(binary); }
export function decodeUTF8(value) { return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0))); }
