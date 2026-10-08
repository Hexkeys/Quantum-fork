import express from 'express';
import crypto from 'node:crypto';

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json({limit:'100mb'}));
app.use(express.static('public'));

const posts = [];
const chatMessages = [];
const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';
const users = new Map();
const sessions = new Map();
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => new Promise((resolve,reject) =>
  crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve({salt, hash:key.toString('hex')}))
);
const getSessionUser = req => {
  const token = String(req.headers.cookie || '').match(/(?:^|;\\s*)qf_session=([^;]+)/)?.[1];
  return token ? sessions.get(token) : null;
};
const requireAuth = (req,res,next) => {
  const username = getSessionUser(req);
  if (!username || !users.has(username)) return res.status(401).json({error:'Login required.'});
  req.user = username;
  next();
};

app.post('/api/register', async (req,res) => {
  const username = String(req.body?.username || '').trim().slice(0,32);
  const password = String(req.body?.password || '');
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return res.status(400).json({error:'Username must be 3-32 letters, numbers, or underscores.'});
  if (password.length < 6) return res.status(400).json({error:'Password must be at least 6 characters.'});
  if (users.has(username)) return res.status(409).json({error:'Username already exists.'});
  users.set(username, await hashPassword(password));
  const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,username);
  res.setHeader('Set-Cookie',`qf_session=${token}; HttpOnly; SameSite=Lax; Path=/`);
  res.status(201).json({username});
});
app.post('/api/login', async (req,res) => {
  const username=String(req.body?.username || '').trim();
  const password=String(req.body?.password || '');
  const record=users.get(username);
  if(!record) return res.status(401).json({error:'Invalid username or password.'});
  const {hash}=await hashPassword(password,record.salt);
  if(!crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(record.hash,'hex'))) return res.status(401).json({error:'Invalid username or password.'});
  const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,username);
  res.setHeader('Set-Cookie',`qf_session=${token}; HttpOnly; SameSite=Lax; Path=/`);
  res.json({username});
});
app.post('/api/logout',(req,res)=>{
  const token=String(req.headers.cookie || '').match(/(?:^|;\\s*)qf_session=([^;]+)/)?.[1];
  if(token) sessions.delete(token);
  res.setHeader('Set-Cookie','qf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ok:true});
});
app.get('/api/me',(req,res)=>{
  const username=getSessionUser(req);
  if(!username || !users.has(username)) return res.status(401).json({error:'Not logged in.'});
  res.json({username});
});
app.get('/api/posts', requireAuth, (_req,res) => res.json(posts));
app.post('/api/chat', requireAuth, (req,res) => {
  const author = String(req.body?.author || 'you').trim().slice(0,32) || 'you';
  const text = String(req.body?.text || '').trim().slice(0,500);
  const image = typeof req.body?.image === 'string' && req.body.image.startsWith('data:') ? req.body.image : '';
  if (!text && !image) return res.status(400).json({error:'Message or image required.'});
  const message = {id:crypto.randomUUID(), author, text, image, createdAt:Date.now()};
  chatMessages.push(message);
  if (chatMessages.length > 200) chatMessages.shift();
  const broadcast = req.body?.broadcast === true;
  if (broadcast && GOOGLE_CHAT_WEBHOOK_URL) {
    const webhookText = text ? `${author}👍said: ${text}` : `${author}👍sent an image`;
    fetch(GOOGLE_CHAT_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:webhookText})}).catch(()=>{});
  }
  res.status(201).json(message);
});
app.get('/api/chat', requireAuth, (_req,res) => res.json(chatMessages));

app.post('/api/posts', requireAuth, (req,res) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const author = String(req.body?.author || 'you').trim().slice(0,32) || 'you';
  const image = typeof req.body?.image === 'string' && req.body.image.startsWith('data:') ? req.body.image : '';
  if (!title || (!body && !image)) return res.status(400).json({error:'Subject and message or image required.'});
  const post = {id:crypto.randomUUID(), title:title.slice(0,140), body:body.slice(0,5000), image, author, tag:'#announcement', votes:1, createdAt:Date.now()};
  posts.unshift(post);
  res.status(201).json(post);
});
app.post('/api/posts/:id/vote', requireAuth, (req,res) => {
  const p=posts.find(x=>x.id===req.params.id); if(!p) return res.sendStatus(404);
  p.votes += Number(req.body?.delta) < 0 ? -1 : 1; res.json(p);
});
app.use((_req,res) => res.sendFile(process.cwd() + '/public/index.html'));
app.listen(port,()=>console.log(`Quantum Board listening on ${port}`));