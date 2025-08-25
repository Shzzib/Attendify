
// Attendify app.js - localStorage backend
const DB_KEY = "attendify_db_v1";

function todayISO(){const d=new Date();d.setHours(0,0,0,0);return d.toISOString().slice(0,10);}

function initDB(){ const ex = localStorage.getItem(DB_KEY); if(ex) return JSON.parse(ex); const db = {
  users: [{id:'u-admin',name:'Admin',email:'admin',password:'admin',role:'admin'}],
  classes: [], slots: [], slotEnrollments: [], sessions: [], attendance: []
}; localStorage.setItem(DB_KEY, JSON.stringify(db)); return db; }

function getDB(){ return JSON.parse(localStorage.getItem(DB_KEY)); }
function setDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }

// Auth
function findUserByEmail(email){ return getDB().users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
function login(email, password){ const u = findUserByEmail(email); if(u && u.password === password){ sessionStorage.setItem('currentUser', JSON.stringify(u)); return u;} return null; }
function logout(){ sessionStorage.removeItem('currentUser'); location.href = 'index.html'; }
function currentUser(){ const v = sessionStorage.getItem('currentUser'); return v ? JSON.parse(v) : null; }
function requireRole(role){ const u = currentUser(); if(!u || (Array.isArray(role) ? !role.includes(u.role) : u.role !== role)){ location.href = 'index.html'; } }

// Users
function createUser({name,email,password,role,roll,branch,subject}){
  const db = getDB();
  if(db.users.find(x => x.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already exists');
  const u = { id: uid('u'), name, email, password, role };
  if(role === 'student'){ u.roll = roll || ''; u.branch = branch || ''; }
  if(role === 'teacher'){ u.subject = subject || ''; }
  db.users.push(u); setDB(db); // notify via storage for other tabs
  return u;
}
function getUsersByRole(role){ return getDB().users.filter(u => u.role === role); }
function getUserById(id){ return getDB().users.find(u => u.id === id); }

// Classes & slots
function createClass(name){ const db=getDB(); const c={id:uid('c'),name}; db.classes.push(c); setDB(db); return c; }
function createSlot(classId, teacherId, label){ const db=getDB(); const s={id:uid('slot'),classId,teacherId,label}; db.slots.push(s); setDB(db); return s; }
function getClassById(id){ return getDB().classes.find(c=>c.id===id); }
function getSlotsByTeacher(tid){ return getDB().slots.filter(s=>s.teacherId===tid); }
function getSlotsByStudent(sid){ const db=getDB(); const ids = db.slotEnrollments.filter(e=>e.studentId===sid).map(e=>e.slotId); return db.slots.filter(s=>ids.includes(s.id)); }
function enrollStudentToSlot(slotId, studentId){ const db=getDB(); if(!db.slotEnrollments.find(e=>e.slotId===slotId && e.studentId===studentId)){ db.slotEnrollments.push({slotId, studentId}); setDB(db); } }

// Sessions & attendance
function startSessionForToday(slotId){ const db=getDB(); const slot = db.slots.find(s=>s.id===slotId); if(!slot) throw new Error('Slot not found'); db.sessions.forEach(s=>{ if(s.slotId===slotId && s.date===todayISO() && s.active) s.active=false; }); const sess={id:uid('s'),classId:slot.classId,slotId,date:todayISO(),startedAt:Date.now(),active:true}; db.sessions.push(sess); setDB(db); return sess; }
function endSession(sessionId){ const db=getDB(); const s=db.sessions.find(x=>x.id===sessionId); if(s){ s.active=false; setDB(db); } }
function getActiveSessionForToday(slotId){ return getDB().sessions.find(s=>s.slotId===slotId && s.date===todayISO() && s.active); }

function markAttendance(studentId,payload){ const db=getDB(); const {classId,slotId,sessionId,date} = payload; const exists = db.attendance.find(a=>a.studentId===studentId && a.sessionId===sessionId); if(!exists){ db.attendance.push({studentId,classId,slotId,sessionId,date,timestamp:Date.now()}); setDB(db); // fire storage event by touching a key
  localStorage.setItem('attendify_last_update', Date.now()); return true; } return false; }
function getAttendanceForSlotDate(slotId,date){ return getDB().attendance.filter(a=>a.slotId===slotId && a.date===date); }
function getAttendanceForStudent(studentId){ return getDB().attendance.filter(a=>a.studentId===studentId); }

// QR payload
function buildQRPayload(session){ return JSON.stringify({ type:'attendance', classId:session.classId, slotId:session.slotId, sessionId:session.id, date:session.date }); }
function parseQRPayload(text){ try{ const o = JSON.parse(text); if(o && o.type==='attendance' && o.classId && o.slotId && o.sessionId && o.date) return o; }catch(e){} return null; }

// CSV export
function downloadCSV(filename, rows){ const csv = rows.map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'); const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// init DB on load
initDB();
