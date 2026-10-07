import express from 'express';
import webpush from 'web-push';
import crypto from 'node:crypto';

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json({limit:'100kb'}));
app.use(express.static('public'));

const posts = [
  {id: crypto.randomUUID(), title:'WELCOME TO QUANTUM BOARD', body:'This is the new command center.', author:'root', tag:'#system', votes:17, createdAt:Date.now()},
  {id: crypto.randomUUID(), title:'FRIDAY // AFTER-DARK RUN', body:'Meet at the usual spot. Bring a jacket.', author:'nightshift', tag:'#plans', votes:11, createdAt:Date.now()-60000},
  {id: crypto.randomUUID(), title:'NEW RULE: NO SPOILERS', body:'Keep the ending out of chat until Saturday.', author:'cipher', tag:'#important', votes:8, createdAt:Date.now()-120000}
];
const subscriptions = new Map();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

app.get('/api/config', (_req,res) => res.json({pushEnabled:Boolean(process.env.VAPID_PUBLIC_KEY), publicKey:process.env.VAPID_PUBLIC_KEY || null}));
app.get('/api/posts', (_req,res) => res.json(posts));
app.post('/api/subscriptions', (req,res) => {
  if (!req.body?.endpoint) return res.status(400).json({error:'Invalid subscription'});
  subscriptions.set(req.body.endpoint, req.body);
  res.status(201).json({ok:true});
});
app.post('/api/posts', async (req,res) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const author = String(req.body?.author || 'you').trim().slice(0,32) || 'you';
  if (!title || !body) return res.status(400).json({error:'Subject and message required.'});
  const post = {id:crypto.randomUUID(), title:title.slice(0,140), body:body.slice(0,5000), author, tag:'#announcement', votes:1, createdAt:Date.now()};
  posts.unshift(post);
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const payload = JSON.stringify({title:'New Quantum Board post', body:post.title, url:'/'});
    await Promise.all([...subscriptions.entries()].map(async ([endpoint,sub]) => {
      try { await webpush.sendNotification(sub,payload); }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) subscriptions.delete(endpoint); }
    }));
  }
  res.status(201).json(post);
});
app.post('/api/posts/:id/vote', (req,res) => {
  const p=posts.find(x=>x.id===req.params.id); if(!p) return res.sendStatus(404);
  p.votes += Number(req.body?.delta) < 0 ? -1 : 1; res.json(p);
});
app.use((_req,res) => res.sendFile(process.cwd() + '/public/index.html'));
app.listen(port,()=>console.log(`Quantum Board listening on ${port}`));
