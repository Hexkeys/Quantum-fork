import express from 'express';
import crypto from 'node:crypto';

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json({limit:'100kb'}));
app.use(express.static('public'));

const posts = [];
const chatMessages = [];

app.get('/api/posts', (_req,res) => res.json(posts));
app.post('/api/chat', (req,res) => {
  const author = String(req.body?.author || 'you').trim().slice(0,32) || 'you';
  const text = String(req.body?.text || '').trim().slice(0,500);
  if (!text) return res.status(400).json({error:'Message required.'});
  const message = {id:crypto.randomUUID(), author, text, createdAt:Date.now()};
  chatMessages.push(message);
  if (chatMessages.length > 200) chatMessages.shift();
  res.status(201).json(message);
});
app.get('/api/chat', (_req,res) => res.json(chatMessages));

app.post('/api/posts', (req,res) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const author = String(req.body?.author || 'you').trim().slice(0,32) || 'you';
  if (!title || !body) return res.status(400).json({error:'Subject and message required.'});
  const post = {id:crypto.randomUUID(), title:title.slice(0,140), body:body.slice(0,5000), author, tag:'#announcement', votes:1, createdAt:Date.now()};
  posts.unshift(post);
  res.status(201).json(post);
});
app.post('/api/posts/:id/vote', (req,res) => {
  const p=posts.find(x=>x.id===req.params.id); if(!p) return res.sendStatus(404);
  p.votes += Number(req.body?.delta) < 0 ? -1 : 1; res.json(p);
});
app.use((_req,res) => res.sendFile(process.cwd() + '/public/index.html'));
app.listen(port,()=>console.log(`Quantum Board listening on ${port}`));