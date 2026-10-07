const CACHE='quantum-board-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/manifest.webmanifest','/icon.svg']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('push',e=>{let d={title:'Quantum Board',body:'New transmission received.',url:'/'};try{d=Object.assign(d,e.data.json())}catch{};e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/icon.svg',badge:'/icon.svg',data:{url:d.url}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data?.url||'/'))});