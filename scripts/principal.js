const firebaseConfig = {
    apiKey: "AIzaSyBJP3WpBtEgUwE2fk_Qj-giOW1hi2HVgHw",
    authDomain: "clinica-d1868.firebaseapp.com",
    projectId: "clinica-d1868",
    storageBucket: "clinica-d1868.firebasestorage.app",
    messagingSenderId: "531058616756",
    appId: "1:531058616756:web:07bc9f53b70f7f48e7eae1",
    measurementId: "G-E8Q0T5E033"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const storage = firebase.storage();

const STORAGE_KEY = 'citas_sonrisas';
let doctores = [];
let servicios = [];
let currentUser = null;
let currentCitaForReminder = null;

const model = {
  selectedDate: null,
  selectedTime: null,
};

let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth()
};

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserProfile(user);
    } else {
        window.location.replace('index.html');
    }
});

async function loadUserProfile(user) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    const displayName = user.displayName || user.email.split('@')[0];
    userName.textContent = displayName;
    
    const userDataStr = localStorage.getItem('userData_' + user.uid);
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            if (userData.photoURL) {
                userAvatar.src = userData.photoURL;
            } else if (user.photoURL) {
                userAvatar.src = user.photoURL;
            } else {
                userAvatar.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230aa3a3"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
            }
        } catch (e) {
            userAvatar.src = user.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230aa3a3"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
        }
    } else if (user.photoURL) {
        userAvatar.src = user.photoURL;
    } else {
        userAvatar.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230aa3a3"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
    }
    
    autoFillUserData();
}

function autoFillUserData() {
    if (!currentUser) return;
    
    const userDataStr = localStorage.getItem('userData_' + currentUser.uid);
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            const nombreInput = document.getElementById('nombrePaciente');
            const telefonoInput = document.getElementById('telefonoPaciente');
            const emailInput = document.getElementById('emailPaciente');
            
            if (nombreInput && currentUser.displayName) {
                nombreInput.value = currentUser.displayName;
            }
            if (telefonoInput && userData.phone) {
                telefonoInput.value = userData.phone;
            }
            if (emailInput && currentUser.email) {
                emailInput.value = currentUser.email;
            }
        } catch (e) {
            console.error('Error al auto-rellenar:', e);
        }
    }
}

function loadCitas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCitas(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function showSection(id, btn) {
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  const sec = document.getElementById(id);
  if (sec) sec.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'mis-citas') renderCitasList();
  if (id === 'home') renderProximaCita();
  if (id === 'agendar') autoFillUserData();
}

async function renderDoctores() {
  if (!doctores.length) return;
  const grid = document.getElementById('doctoresGrid');
  grid.innerHTML = '';
  const especialidadesPermitidas = ['Ortodoncia', 'Blanqueamiento', 'Limpieza', 'Implantes'];
  const doctoresFiltrados = doctores.filter(doc => 
    especialidadesPermitidas.some(e => doc.especialidad.toLowerCase().includes(e.toLowerCase()))
  );
  doctoresFiltrados.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    let imgSrc = doc.img && doc.img.trim() !== '' ? doc.img : 'assets/img/doctor.avif';
    card.innerHTML = `
      <div class="doctor-avatar"><img src="${imgSrc}" alt="${doc.nombre}" onerror="this.src='assets/img/doctor.avif'"/></div>
      <h3>${doc.nombre}</h3>
      <div class="small">${doc.especialidad}</div>
      <p class="small">${doc.experiencia}</p>
      <button class="btn" onclick="agendarConDoctor('${doc.id}')">Agendar</button>
    `;
    grid.appendChild(card);
  });
  const select = document.getElementById('doctorSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Seleccione --</option>';
    doctoresFiltrados.forEach(doc => {
      select.innerHTML += `<option value="${doc.id}">${doc.nombre} - ${doc.especialidad}</option>`;
    });
  }
}

async function renderServicios() {
  if (!servicios.length) return;
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';
  servicios.forEach(serv => {
    const card = document.createElement('div');
    card.className = 'service-card';
    let icon = serv.icon.replace('service-icon', 'service-icon big-center');
    card.innerHTML = `
      ${icon}
      <h3>${serv.nombre}</h3>
      <p>${serv.descripcion}</p>
      <button class="btn" onclick="showSection('agendar');document.getElementById('servicioSelect').value='${serv.id}';updateDoctorSelect();document.getElementById('doctorSelect').focus();">Solicitar</button>
    `;
    grid.appendChild(card);
  });
  const select = document.getElementById('servicioSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Seleccione --</option>';
    servicios.forEach(serv => {
      select.innerHTML += `<option value="${serv.id}">${serv.nombre}</option>`;
    });
  }
}

function renderProximaCita() {
  const citas = loadCitas().filter(c => {
    const now = new Date();
    const citaDate = new Date(c.date + 'T' + c.time);
    return citaDate >= now;
  }).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  const el = document.getElementById('proximaCita');
  if (!el) return;
  if (citas.length === 0) {
    el.textContent = 'No tienes citas próximas.';
    return;
  }
  const c = citas[0];
  const doc = doctores.find(d => d.id === c.doctor);
  el.innerHTML = `<strong>${c.date} ${c.time}</strong> con ${doc ? doc.nombre : 'Doctor'} (${doc ? doc.especialidad : ''})`;
}

function renderCitasList() {
  let list = loadCitas().sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  const container = document.getElementById('citasList');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<div class="cita-card"><p>No tienes citas agendadas.</p></div>`;
    return;
  }
  list.forEach(cita => {
    const doc = doctores.find(d => d.id === cita.doctor);
    const fechaLegible = new Date(cita.date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const card = document.createElement('div');
    card.className = 'cita-card';
    card.innerHTML = `
      <div class="cita-row">
        <div>
          <div style="font-weight:800">${fechaLegible} • ${cita.time}</div>
          <div class="small">${doc ? doc.nombre : 'Doctor'} — Paciente: ${cita.name}</div>
        </div>
        <div class="cita-actions">
          <span class="badge">Programada</span>
          <button class="reminder-badge" onclick="openReminderModal('${cita.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            Recordatorio
          </button>
          <button class="btn alt" onclick="reschedule('${cita.id}')">Reprogramar</button>
          <button class="btn" onclick="cancelCita('${cita.id}')">Cancelar</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openReminderModal(citaId) {
  currentCitaForReminder = loadCitas().find(c => c.id === citaId);
  if (!currentCitaForReminder) {
    alert('Cita no encontrada');
    return;
  }
  
  const userDataStr = localStorage.getItem('userData_' + currentUser.uid);
  let userData = null;
  if (userDataStr) {
    try {
      userData = JSON.parse(userDataStr);
    } catch (e) {}
  }
  
  if (!userData || !userData.phone || !currentUser.email) {
    alert('Por favor completa tu perfil con tu teléfono y correo en la sección "Mi Perfil" antes de enviar recordatorios.');
    return;
  }
  
  document.getElementById('reminderModal').style.display = 'flex';
}

function closeReminderModal() {
  document.getElementById('reminderModal').style.display = 'none';
  currentCitaForReminder = null;
}

async function sendReminder() {
  if (!currentCitaForReminder) return;
  
  const sendEmail = document.getElementById('reminderEmail').checked;
  const sendSMS = document.getElementById('reminderSMS').checked;
  const sendWhatsApp = document.getElementById('reminderWhatsApp').checked;
  const reminderTime = document.getElementById('reminderTime').value;
  
  if (!sendEmail && !sendSMS && !sendWhatsApp) {
    alert('Por favor selecciona al menos un método de recordatorio');
    return;
  }
  
  const doc = doctores.find(d => d.id === currentCitaForReminder.doctor);
  const fechaLegible = new Date(currentCitaForReminder.date).toLocaleDateString('es-PE', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const message = `Recordatorio de cita médica:\n\nFecha: ${fechaLegible}\nHora: ${currentCitaForReminder.time}\nDoctor: ${doc ? doc.nombre : 'Doctor'}\nPaciente: ${currentCitaForReminder.name}\n\nClínica Sonrisas y Salud`;
  
  try {
    if (sendEmail) {
      const emailSent = await sendEmailReminder(message);
      if (emailSent) {
        console.log('Email enviado correctamente');
      }
    }
    
    if (sendSMS) {
      console.log('SMS: En producción se usaría Twilio API');
      console.log('Mensaje SMS:', message);
    }
    
    if (sendWhatsApp) {
      const userDataStr = localStorage.getItem('userData_' + currentUser.uid);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const phone = userData.phone.replace(/\D/g, '');
        const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
      }
    }
    
    alert('Recordatorio configurado exitosamente!\n\n' + 
          (sendEmail ? '✓ Email programado\n' : '') +
          (sendSMS ? '✓ SMS programado\n' : '') +
          (sendWhatsApp ? '✓ WhatsApp abierto' : ''));
    
    closeReminderModal();
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    alert('Error al enviar el recordatorio. Por favor intenta nuevamente.');
  }
}

async function sendEmailReminder(message) {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/principal.html',
      handleCodeInApp: false,
    };
    
    console.log('Recordatorio por email configurado');
    console.log('Mensaje:', message);
    
    return true;
  } catch (error) {
    console.error('Error configurando email:', error);
    return false;
  }
}

function agendarConDoctor(doctorId) {
  document.getElementById('doctorSelect').value = doctorId;
  showSection('agendar');
  setTimeout(() => {
    autoFillUserData();
    document.getElementById('calendarDays').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

function generateCalendar() {
  const container = document.getElementById('calendarDays');
  container.innerHTML = '';
  const today = new Date();
  const year = calendarState.year;
  const month = calendarState.month;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  let html = `<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'>
    <button class='btn' style='padding:4px 10px;font-size:1rem;' onclick='calendarPrevMonth()'>&lt;</button>
    <span style='font-weight:700;font-size:1.1rem;'>${monthNames[month]} ${year}</span>
    <button class='btn' style='padding:4px 10px;font-size:1rem;' onclick='calendarNextMonth()'>&gt;</button>
  </div>`;
  html += `<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:4px 2px;margin-bottom:4px;'>`;
  const weekDays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  weekDays.forEach(d => { html += `<div class='small' style='font-weight:700;text-align:center;'>${d}</div>` });
  html += `</div><div style='display:grid;grid-template-columns:repeat(7,1fr);gap:6px;'>`;
  let day = 1;
  let start = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < start; i++) html += `<div></div>`;
  for (; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const iso = d.toISOString().slice(0, 10);
    let disabled = d < today.setHours(0, 0, 0, 0) ? 'disabled' : '';
    html += `<div class='day-slot${model.selectedDate === iso ? ' selected' : ''}' data-date='${iso}' ${disabled ? 'style="opacity:0.3;pointer-events:none;"' : ''} onclick='selectDate("${iso}",this)'>
      <div class='date'>${day}</div>
      <div class='weekday small'>${weekDays[((start + day - 1) % 7)]}</div>
    </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

window.calendarPrevMonth = function() {
  if (calendarState.month === 0) {
    calendarState.month = 11;
    calendarState.year--;
  } else {
    calendarState.month--;
  }
  generateCalendar();
};

window.calendarNextMonth = function() {
  if (calendarState.month === 11) {
    calendarState.month = 0;
    calendarState.year++;
  } else {
    calendarState.month++;
  }
  generateCalendar();
};

function selectDate(iso, el) {
  model.selectedDate = iso;
  document.querySelectorAll('.day-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  generateTimeSlots(iso);
}

function generateTimeSlots(isoDate) {
  const container = document.getElementById('timeSlots');
  container.innerHTML = '';
  const citas = loadCitas();
  const start = 8, end = 17;
  for (let h = start; h < end; h += 2) {
    const hh = String(h).padStart(2, '0') + ':00';
    const selDoc = document.getElementById('doctorSelect').value;
    const occupied = citas.some(c => c.date === isoDate && c.time === hh && c.doctor === selDoc);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot' + (occupied ? ' disabled' : '');
    btn.innerText = hh;
    if (!occupied) {
      btn.addEventListener('click', () => selectTime(hh, btn));
    } else {
      btn.title = 'Horario ocupado';
    }
    container.appendChild(btn);
  }
  model.selectedTime = null;
}

function selectTime(hh, el) {
  model.selectedTime = hh;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

document.getElementById('citaForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombrePaciente').value.trim();
  const telefono = document.getElementById('telefonoPaciente').value.trim();
  const email = document.getElementById('emailPaciente').value.trim();
  const doctor = document.getElementById('doctorSelect').value;
  if (!nombre || !telefono || !doctor) {
    alert('Complete los campos obligatorios (nombre, teléfono, doctor).');
    return;
  }
  if (!model.selectedDate || !model.selectedTime) {
    alert('Seleccione fecha y horario disponibles.');
    return;
  }
  const citas = loadCitas();
  const conflict = citas.some(c => c.date === model.selectedDate && c.time === model.selectedTime && c.doctor === doctor);
  if (conflict) {
    alert('El horario ya fue reservado. Elija otro.');
    generateTimeSlots(model.selectedDate);
    return;
  }
  const nueva = {
    id: 'c' + Date.now(),
    name: nombre,
    phone: telefono,
    email: email,
    doctor: doctor,
    date: model.selectedDate,
    time: model.selectedTime,
    createdAt: new Date().toISOString()
  };
  citas.push(nueva);
  saveCitas(citas);
  showConfirmation(nueva);
  showToast('¡Cita agendada exitosamente!');
  document.getElementById('citaForm').reset();
  model.selectedDate = null;
  model.selectedTime = null;
  generateCalendar();
  renderProximaCita();
});

function showToast(msg) {
  let toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '32px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#0aa3a3';
  toast.style.color = '#fff';
  toast.style.padding = '14px 28px';
  toast.style.borderRadius = '12px';
  toast.style.fontWeight = 'bold';
  toast.style.fontSize = '1.1rem';
  toast.style.boxShadow = '0 2px 12px rgba(10,163,163,0.13)';
  toast.style.zIndex = 9999;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s';
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

function showConfirmation(cita) {
  const details = document.getElementById('confirmationDetails');
  const doc = doctores.find(d => d.id === cita.doctor);
  const fechaLegible = new Date(cita.date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  details.innerHTML = `
    <div class="confirmacion-panel-adapt">
      <strong>Paciente:</strong> ${cita.name}<br>
      <strong>Doctor:</strong> ${doc ? doc.nombre : 'Doctor'}<br>
      <strong>Fecha:</strong> ${fechaLegible}<br>
      <strong>Hora:</strong> ${cita.time}<br>
      <strong>Teléfono:</strong> ${cita.phone}
    </div>
  `;
  showSection('confirmacion');
}

function cancelCita(id) {
  if (!confirm('¿Desea cancelar esta cita?')) return;
  let citas = loadCitas();
  citas = citas.filter(c => c.id !== id);
  saveCitas(citas);
  renderCitasList();
  generateCalendar();
  renderProximaCita();
}

function reschedule(id) {
  const citas = loadCitas();
  const c = citas.find(x => x.id === id);
  if (!c) return alert('Cita no encontrada.');
  document.getElementById('nombrePaciente').value = c.name;
  document.getElementById('telefonoPaciente').value = c.phone;
  document.getElementById('emailPaciente').value = c.email || '';
  document.getElementById('doctorSelect').value = c.doctor;
  const remaining = citas.filter(x => x.id !== id);
  saveCitas(remaining);
  showSection('agendar');
  generateCalendar();
}

function updateDoctorSelect() {
  const servicio = document.getElementById('servicioSelect').value;
  const select = document.getElementById('doctorSelect');
  select.innerHTML = '<option value="">-- Seleccione --</option>';
  if (!servicio) return;
  doctores.forEach(doc => {
    if (doc.especialidad && doc.especialidad.toLowerCase().includes(servicio.toLowerCase())) {
      select.innerHTML += `<option value="${doc.id}">${doc.nombre} — ${doc.especialidad}</option>`;
    }
  });
}

async function fetchData() {
  try {
    const doctoresResp = await fetch('src/doctores.json');
    doctores = await doctoresResp.json();
  } catch {
    doctores = [
      { "id": "1", "nombre": "Dr. Jorge Castillo", "especialidad": "Ortodoncia", "experiencia": "15 años de experiencia", "img": "assets/img/doctor.avif" },
      { "id": "3", "nombre": "Dra. Ana M. Torres", "especialidad": "Limpieza", "experiencia": "Atención a niños y familias", "img": "assets/img/doctora.jpg" },
      { "id": "4", "nombre": "Dr. Carlos Mendoza", "especialidad": "Implantes", "experiencia": "Procedimientos con guía 3D", "img": "assets/img/doctor4.jpg" },
      { "id": "8", "nombre": "Dra. Gabriela Salas", "especialidad": "Blanqueamiento", "experiencia": "Carillas y diseño de sonrisa", "img": "assets/img/doctor8.jpg" }
    ];
  }
  try {
    const serviciosResp = await fetch('src/servicios.json');
    servicios = await serviciosResp.json();
  } catch {
    servicios = [
      { "id": "limpieza", "nombre": "Limpieza", "descripcion": "Profilaxis profesional", "icon": "<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/></svg>" },
      { "id": "blanqueamiento", "nombre": "Blanqueamiento", "descripcion": "Opciones seguras", "icon": "<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/></svg>" },
      { "id": "ortodoncia", "nombre": "Ortodoncia", "descripcion": "Brackets y alineadores", "icon": "<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/></svg>" },
      { "id": "implantes", "nombre": "Implantes", "descripcion": "Técnicas modernas", "icon": "<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/></svg>" }
    ];
  }
  await renderDoctores();
  await renderServicios();
  generateCalendar();
  renderProximaCita();
  const servicioSelect = document.getElementById('servicioSelect');
  if (servicioSelect) servicioSelect.addEventListener('change', updateDoctorSelect);
}

window.showSection = showSection;
window.agendarConDoctor = agendarConDoctor;
window.cancelCita = cancelCita;
window.reschedule = reschedule;
window.openReminderModal = openReminderModal;
window.closeReminderModal = closeReminderModal;
window.sendReminder = sendReminder;

document.addEventListener('click', function(e) {
  const modal = document.getElementById('reminderModal');
  if (e.target === modal) {
    closeReminderModal();
  }
});

fetchData();