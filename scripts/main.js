
// main.js - Clínica Sonrisas y Salud
// Navegación, renderizado dinámico, simulación de paciente logueado

const STORAGE_KEY = 'citas_sonrisas';
let doctores = [];
let servicios = [];
const model = {
	selectedDate: null,
	selectedTime: null,
	selectedDoctor: null,
};

// Utilidades de citas
function loadCitas(){
	try{
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	}catch{return []}
}
function saveCitas(list){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Navegación moderna
function showSection(id, btn){
	document.querySelectorAll('main section').forEach(s=>s.style.display='none');
	const sec = document.getElementById(id);
	if(sec) sec.style.display='block';
	window.scrollTo({top:0, behavior:'smooth'});
	document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
	if(btn) btn.classList.add('active');
	if(id === 'mis-citas') renderCitasList();
	if(id === 'home') renderProximaCita();
}

// Renderizar doctores
async function renderDoctores(){
	if(!doctores.length) return;
	const grid = document.getElementById('doctoresGrid');
	grid.innerHTML = '';
	// Solo mostrar doctores de los servicios requeridos
	const especialidadesPermitidas = ['Ortodoncia', 'Blanqueamiento', 'Limpieza', 'Implantes'];
	const doctoresFiltrados = doctores.filter(doc => especialidadesPermitidas.some(e => doc.especialidad.toLowerCase().includes(e.toLowerCase())));
	doctoresFiltrados.forEach(doc=>{
		const card = document.createElement('div');
		card.className = 'doctor-card';
		// Usar solo el campo img del JSON, o imagen por defecto si está vacío
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
	// Llenar select de doctores en agendar
	const select = document.getElementById('doctorSelect');
	if(select){
		select.innerHTML = '<option value="">-- Seleccione --</option>';
		doctoresFiltrados.forEach(doc => {
			select.innerHTML += `<option value="${doc.id}">${doc.nombre} - ${doc.especialidad}</option>`;
		});
	}
}

// Renderizar servicios
async function renderServicios(){
	if(!servicios.length) return;
	const grid = document.getElementById('servicesGrid');
	grid.innerHTML = '';
	servicios.forEach(serv=>{
		const card = document.createElement('div');
		card.className = 'service-card';
		   // Agrandar y centrar el icono
		   let icon = serv.icon.replace('service-icon', 'service-icon big-center');
		   card.innerHTML = `
				   ${icon}
				   <h3>${serv.nombre}</h3>
				   <p>${serv.descripcion}</p>
				   <button class="btn" onclick="showSection('agendar');document.getElementById('servicioSelect').value='${serv.id}';updateDoctorSelect();document.getElementById('doctorSelect').focus();">Solicitar</button>
		   `;
		   grid.appendChild(card);
	   });
	   // Llenar select de servicios en agendar
	   const select = document.getElementById('servicioSelect');
	   if(select){
		   select.innerHTML = '<option value="">-- Seleccione --</option>';
		   servicios.forEach(serv => {
			   select.innerHTML += `<option value="${serv.id}">${serv.nombre}</option>`;
		   });
	   }
}

// Renderizar próxima cita en home
function renderProximaCita(){
	const citas = loadCitas().filter(c=>{
		const now = new Date();
		const citaDate = new Date(c.date + 'T' + c.time);
		return citaDate >= now;
	}).sort((a,b)=>new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
	const el = document.getElementById('proximaCita');
	if(!el) return;
	if(citas.length === 0){
		el.textContent = 'No tienes citas próximas.';
		return;
	}
	const c = citas[0];
	const doc = doctores.find(d=>d.id===c.doctor);
	el.innerHTML = `<strong>${c.date} ${c.time}</strong> con ${doc ? doc.nombre : 'Doctor'} (${doc ? doc.especialidad : ''})`;
}

// Renderizar historial de citas
function renderCitasList(){
	let list = loadCitas().sort((a,b)=>new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
	const container = document.getElementById('citasList');
	container.innerHTML = '';
	if(list.length === 0){
		// Demo: mostrar dos ejemplos si no hay citas reales
		// Mostrar demo solo si no hay citas reales
		container.innerHTML = `
				<!-- Ejemplo de cita 1 -->
				<div class="cita-card demo">
					<div class="cita-row">
						<div>
							<span class="badge badge-pendiente">Pendiente</span>
							<strong style="margin-left:8px">25 nov. 2025 - 07:00</strong><br>
							<span class="small">Dr. Jorge Castillo (Ortodoncia)</span>
						</div>
						<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
							<button class="btn alt" style="padding:4px 12px;font-size:0.98rem" onclick="reschedule('demo1')">Reprogramar</button>
							<button class="btn" style="padding:4px 12px;font-size:0.98rem" onclick="cancelCita('demo1')">Cancelar</button>
						</div>
					</div>
					<div class="small" style="margin-top:4px;display:flex;align-items:center;gap:6px">
						<img src='assets/icons/reminder-sms.svg' width='18' alt='SMS'/>
						<img src='assets/icons/reminder-whatsapp.svg' width='18' alt='WhatsApp'/>
						<img src='assets/icons/reminder-gmail.svg' width='18' alt='Gmail'/>
						<span>Recordatorio enviado</span>
						<button class="btn" style="margin-left:16px;padding:4px 12px;font-size:0.98rem" onclick="abrirRecordatorioDemo(this)">Recordatorio</button>
						<button class="btn alt" style="margin-left:8px;padding:4px 12px;font-size:0.98rem" onclick="verDetalleDemo(this)">Más detalle</button>
					</div>
					<div class="recordatorio-opciones" style="display:none;margin-top:10px">
						<label style="font-weight:700">¿Cómo quieres que te recordemos?</label>
						<div style="display:flex;gap:10px;margin:8px 0">
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'sms')"><img src='assets/icons/reminder-sms.svg' class='icono-recordatorio'/>SMS</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'whatsapp')"><img src='assets/icons/reminder-whatsapp.svg' class='icono-recordatorio'/>WhatsApp</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'gmail')"><img src='assets/icons/reminder-gmail.svg' class='icono-recordatorio'/>Correo</button>
						</div>
						<label style="font-weight:700">¿Cuándo?</label>
						<div style="display:flex;gap:8px;margin-bottom:8px">
							<button class="noti-btn" onclick="setRecordatorioDemo(this, '2025-11-25T06:00')">1 hora antes</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, '2025-11-25T04:00')">3 horas antes</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'personalizado')">Personalizado</button>
						</div>
						<input type="datetime-local" name="rec-hora" min="2025-11-25T07:00" max="2025-11-25T09:00" value="2025-11-25T07:00" style="margin-bottom:8px;display:none"/>
						<button class="btn" style="margin-left:8px" onclick="guardarRecordatorioDemo(this)">Guardar recordatorio</button>
					</div>
				</div>
				<!-- Ejemplo de cita 2 -->
				<div class="cita-card demo">
					<div class="cita-row">
						<div>
							<span class="badge badge-confirmada">Confirmada</span>
							<strong style="margin-left:8px">25 nov. 2025 - 09:00</strong><br>
							<span class="small">Dra. Ana M. Torres (Limpieza)</span>
						</div>
						<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
							<button class="btn alt" style="padding:4px 12px;font-size:0.98rem" onclick="reschedule('demo2')">Reprogramar</button>
							<button class="btn" style="padding:4px 12px;font-size:0.98rem" onclick="cancelCita('demo2')">Cancelar</button>
						</div>
					</div>
					<div class="small" style="margin-top:4px;display:flex;align-items:center;gap:6px">
						<img src='assets/icons/reminder-sms.svg' width='18' alt='SMS'/>
						<img src='assets/icons/reminder-whatsapp.svg' width='18' alt='WhatsApp'/>
						<img src='assets/icons/reminder-gmail.svg' width='18' alt='Gmail'/>
						<span>Recordatorio enviado</span>
						<button class="btn" style="margin-left:16px;padding:4px 12px;font-size:0.98rem" onclick="abrirRecordatorioDemo(this)">Recordatorio</button>
						<button class="btn alt" style="margin-left:8px;padding:4px 12px;font-size:0.98rem" onclick="verDetalleDemo(this)">Más detalle</button>
					</div>
					<div class="recordatorio-opciones" style="display:none;margin-top:10px">
						<label style="font-weight:700">¿Cómo quieres que te recordemos?</label>
						<div style="display:flex;gap:10px;margin:8px 0">
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'sms')"><img src='assets/icons/reminder-sms.svg' class='icono-recordatorio'/>SMS</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'whatsapp')"><img src='assets/icons/reminder-whatsapp.svg' class='icono-recordatorio'/>WhatsApp</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'gmail')"><img src='assets/icons/reminder-gmail.svg' class='icono-recordatorio'/>Correo</button>
						</div>
						<label style="font-weight:700">¿Cuándo?</label>
						<div style="display:flex;gap:8px;margin-bottom:8px">
							<button class="noti-btn" onclick="setRecordatorioDemo(this, '2025-11-25T08:00')">1 hora antes</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, '2025-11-25T06:00')">3 horas antes</button>
							<button class="noti-btn" onclick="setRecordatorioDemo(this, 'personalizado')">Personalizado</button>
						</div>
						<input type="datetime-local" name="rec-hora" min="2025-11-25T09:00" max="2025-11-25T11:00" value="2025-11-25T09:00" style="margin-bottom:8px;display:none"/>
						<button class="btn" style="margin-left:8px" onclick="guardarRecordatorioDemo(this)">Guardar recordatorio</button>
					</div>
				</div>
				`;
		return;
	}
	// Renderizar citas reales
	list.forEach((cita, idx) => {
		const doc = doctores.find(d=>d.id===cita.doctor);
		const fechaLegible = new Date(cita.date).toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
		const card = document.createElement('div');
		card.className = 'cita-card';
		// Generar un id único para el recordatorio de esta cita
		const recId = `rec-real-${cita.id}`;
		card.innerHTML = `
			<div class="cita-row">
				<div>
					<div style="font-weight:800">${fechaLegible} • ${cita.time}</div>
					<div class="small">${doc ? doc.nombre : 'Doctor'} — Paciente: ${cita.name}</div>
				</div>
				<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
					<span class="badge">${cita.status === 'espera' ? 'Pendiente' : 'Confirmada'}</span>
					<div style="display:flex;gap:8px">
						<button class="btn alt" onclick="reschedule('${cita.id}')">Reprogramar</button>
						<button class="btn" style="background:#ff6b6b" onclick="cancelCita('${cita.id}')">Cancelar</button>
					</div>
				</div>
			</div>
			<div class="small" style="margin-top:4px;display:flex;align-items:center;gap:6px">
				<img src='assets/icons/reminder-sms.svg' width='18' alt='SMS'/>
				<img src='assets/icons/reminder-whatsapp.svg' width='18' alt='WhatsApp'/>
				<img src='assets/icons/reminder-gmail.svg' width='18' alt='Gmail'/>
				<span>Recordatorio enviado</span>
				<button class="btn" style="margin-left:16px;padding:4px 12px;font-size:0.98rem" onclick="abrirRecordatorioReal(this)">Recordatorio</button>
				<button class="btn alt" style="margin-left:8px;padding:4px 12px;font-size:0.98rem" onclick="verDetalleReal(this)">Más detalle</button>
			</div>
			<div class="recordatorio-opciones" id="${recId}" style="display:none;margin-top:10px">
				<label style="font-weight:700">¿Cómo quieres que te recordemos?</label>
				<div style="display:flex;gap:10px;margin:8px 0">
					<button class="noti-btn" onclick="setRecordatorioReal(this, 'sms')"><img src='assets/icons/reminder-sms.svg' class='icono-recordatorio'/>SMS</button>
					<button class="noti-btn" onclick="setRecordatorioReal(this, 'whatsapp')"><img src='assets/icons/reminder-whatsapp.svg' class='icono-recordatorio'/>WhatsApp</button>
					<button class="noti-btn" onclick="setRecordatorioReal(this, 'gmail')"><img src='assets/icons/reminder-gmail.svg' class='icono-recordatorio'/>Correo</button>
				</div>
				<label style="font-weight:700">¿Cuándo?</label>
				<div style="display:flex;gap:8px;margin-bottom:8px">
					<button class="noti-btn" onclick="setRecordatorioReal(this, '1h')">1 hora antes</button>
					<button class="noti-btn" onclick="setRecordatorioReal(this, '3h')">3 horas antes</button>
					<button class="noti-btn" onclick="setRecordatorioReal(this, '30m')">30 minutos antes</button>
					<button class="noti-btn" onclick="setRecordatorioReal(this, 'personalizado')">Personalizado</button>
				</div>
				<input type="datetime-local" name="rec-hora" style="margin-bottom:8px;display:none"/>
				<button class="btn" style="margin-left:8px" onclick="guardarRecordatorioReal(this)">Guardar recordatorio</button>
			</div>
		`;
		// Modo noche para tarjetas
		if(document.body.classList.contains('night')){
			card.style.background = '#232a36';
			card.style.color = '#f6fafd';
		}
		container.appendChild(card);
	});
}

// --- Recordatorio para citas reales ---
// Abrir opciones de recordatorio en cita real
window.abrirRecordatorioReal = function(btn) {
	const box = btn.closest('.cita-card').querySelector('.recordatorio-opciones');
	box.style.display = box.style.display === 'none' ? 'block' : 'none';
};
// Seleccionar canal o tiempo para recordatorio real
window.setRecordatorioReal = function(btn, val) {
	const box = btn.closest('.recordatorio-opciones');
	const input = box.querySelector('input[name="rec-hora"]');
	if(val === 'personalizado') {
		input.style.display = 'inline-block';
	} else if(['1h','3h','30m'].includes(val)) {
		// Calcular hora según la cita
		const card = box.closest('.cita-card');
		// Buscar fecha y hora de la cita
		let fechaHora = card.querySelector('div[style*="font-weight:800"]').textContent.split(' • ');
		let fecha = fechaHora[0];
		let hora = fechaHora[1];
		// Convertir fecha a formato yyyy-mm-dd
		let partes = fecha.split(',')[1].trim().split(' ');
		let dia = partes[0];
		let mes = partes[1];
		let anio = partes[2];
		let meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
		let mesNum = (meses.indexOf(mes.toLowerCase())+1).toString().padStart(2,'0');
		let fechaISO = `${anio}-${mesNum}-${dia.padStart(2,'0')}`;
		let horaISO = hora;
		let dt = new Date(`${fechaISO}T${horaISO}`);
		if(val==='1h') dt.setHours(dt.getHours()-1);
		if(val==='3h') dt.setHours(dt.getHours()-3);
		if(val==='30m') dt.setMinutes(dt.getMinutes()-30);
		let local = dt.toISOString().slice(0,16);
		input.value = local;
		input.style.display = 'inline-block';
	} else {
		input.style.display = 'none';
	}
};
// Guardar recordatorio real (simulado)
window.guardarRecordatorioReal = function(btn) {
	const box = btn.closest('.recordatorio-opciones');
	const input = box.querySelector('input[name="rec-hora"]');
	if(input.style.display !== 'none' && !input.value) {
		alert('Selecciona una hora para el recordatorio.');
		return false;
	}
	alert('¡Recordatorio guardado! (simulado)');
	box.style.display = 'none';
	return false;
};
window.verDetalleReal = function(btn) {
	alert('Aquí se mostrarían los detalles completos de la cita.');
};

// Agendar con doctor desde tarjeta
function agendarConDoctor(doctorId){
	document.getElementById('doctorSelect').value = doctorId;
	showSection('agendar');
	setTimeout(()=>document.getElementById('calendarDays').scrollIntoView({behavior:'smooth', block:'center'}),200);
}

// Calendar y horarios (igual que antes)
function generateCalendar(){
	       const container = document.getElementById('calendarDays');
	       container.innerHTML = '';
	       // Calendario mensual navegable
	       let calendarState = window._calendarState || {};
	       const today = new Date();
	       if(!calendarState.year || !calendarState.month) {
		       calendarState.year = today.getFullYear();
		       calendarState.month = today.getMonth();
	       }
	       window._calendarState = calendarState;
	       const year = calendarState.year;
	       const month = calendarState.month;
	       const firstDay = new Date(year, month, 1);
	       const lastDay = new Date(year, month + 1, 0);
	       // Header de mes
	       const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
	       let html = `<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'>
		       <button class='btn' style='padding:4px 10px;font-size:1rem;' onclick='_calendarPrevMonth()'>&lt;</button>
		       <span style='font-weight:700;font-size:1.1rem;'>${monthNames[month]} ${year}</span>
		       <button class='btn' style='padding:4px 10px;font-size:1rem;' onclick='_calendarNextMonth()'>&gt;</button>
	       </div>`;
	       html += `<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:4px 2px;margin-bottom:4px;'>`;
	       const weekDays = ['lun','mar','mié','jue','vie','sáb','dom'];
	       weekDays.forEach(d=>{html += `<div class='small' style='font-weight:700;text-align:center;'>${d}</div>`});
	       html += `</div><div style='display:grid;grid-template-columns:repeat(7,1fr);gap:6px;'>`;
	       let day = 1;
	       let start = (firstDay.getDay() + 6) % 7; // lunes=0
	       for(let i=0;i<start;i++) html += `<div></div>`;
	       for(;day<=lastDay.getDate();day++){
		       const d = new Date(year, month, day);
		       const iso = d.toISOString().slice(0,10);
		       let disabled = d < today.setHours(0,0,0,0) ? 'disabled' : '';
		       html += `<div class='day-slot${model.selectedDate===iso?' selected':''}' data-date='${iso}' ${disabled?'style="opacity:0.3;pointer-events:none;"':''} onclick='selectDate("${iso}",this)'>
			       <div class='date'>${day}</div>
			       <div class='weekday small'>${weekDays[((start+day-1)%7)]}</div>
		       </div>`;
	       }
	       html += `</div>`;
		container.innerHTML = html;
	}
	 // Navegación de meses
	 window._calendarPrevMonth = function(){
	       if(!window._calendarState) return;
	       if(window._calendarState.month === 0){
		       window._calendarState.month = 11;
		       window._calendarState.year--;
	       }else{
		       window._calendarState.month--;
	       }
	       generateCalendar();
	 }
	 window._calendarNextMonth = function(){
	       if(!window._calendarState) return;
	       if(window._calendarState.month === 11){
		       window._calendarState.month = 0;
		       window._calendarState.year++;
	       }else{
		       window._calendarState.month++;
	       }
	       generateCalendar();
	 }

function selectDate(iso, el){
	model.selectedDate = iso;
	document.querySelectorAll('.day-slot').forEach(s=>s.classList.remove('selected'));
	el.classList.add('selected');
	generateTimeSlots(iso);
}
function generateTimeSlots(isoDate){
	       const container = document.getElementById('timeSlots');
	       container.innerHTML = '';
	       const citas = loadCitas();
	       const start = 8, end = 17;
	       // Mostrar solo cada 2 horas
	       for(let h=start; h<end; h+=2){
		       const hh = String(h).padStart(2,'0') + ':00';
		       const selDoc = document.getElementById('doctorSelect').value;
		       const occupied = citas.some(c => c.date === isoDate && c.time === hh && c.doctor === selDoc);
		       const btn = document.createElement('button');
		       btn.type = 'button';
		       btn.className = 'time-slot' + (occupied ? ' disabled' : '');
		       btn.innerText = hh;
		       if(!occupied){
			       btn.addEventListener('click', ()=>selectTime(hh, btn));
		       } else {
			       btn.title = 'Horario ocupado';
			       btn.setAttribute('aria-disabled','true');
		       }
		       container.appendChild(btn);
	       }
	       model.selectedTime = null;
}
function selectTime(hh, el){
	model.selectedTime = hh;
	document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
	el.classList.add('selected');
}

// Formulario de agendar cita
document.getElementById('citaForm').addEventListener('submit', function(e){
	e.preventDefault();
	const nombre = document.getElementById('nombrePaciente').value.trim();
	const telefono = document.getElementById('telefonoPaciente').value.trim();
	const email = document.getElementById('emailPaciente').value.trim();
	const doctor = document.getElementById('doctorSelect').value;
	if(!nombre || !telefono || !doctor) { alert('Complete los campos obligatorios (nombre, teléfono, doctor).'); return; }
	if(!model.selectedDate || !model.selectedTime) { alert('Seleccione fecha y horario disponibles.'); return; }
	const citas = loadCitas();
	const conflict = citas.some(c => c.date === model.selectedDate && c.time === model.selectedTime && c.doctor === doctor);
	if(conflict){ alert('El horario ya fue reservado. Elija otro.'); generateTimeSlots(model.selectedDate); return; }
	       const nueva = {
		       id: 'c' + Date.now(),
		       name: nombre,
		       phone: telefono,
		       email: email,
		       doctor: doctor,
		       date: model.selectedDate,
		       time: model.selectedTime,
		       status: 'espera',
		       createdAt: new Date().toISOString()
	       };
	       citas.push(nueva);
	       saveCitas(citas);
	       showConfirmation(nueva);
	       showToast('¡Cita agendada exitosamente!');
	       document.getElementById('citaForm').reset();
	       model.selectedDate = null; model.selectedTime = null;
	       generateCalendar();
	       renderProximaCita();
// Toast flotante para feedback
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
       setTimeout(()=>{
	       toast.style.transition = 'opacity 0.5s';
	       toast.style.opacity = 0;
	       setTimeout(()=>toast.remove(), 500);
       }, 2000);
}
});

// Confirmación visual
function showConfirmation(cita){
	const details = document.getElementById('confirmationDetails');
	const doc = doctores.find(d=>d.id===cita.doctor);
	const fechaLegible = new Date(cita.date).toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
	details.innerHTML = `
		<div class="confirmacion-panel-adapt">
			<strong>Paciente:</strong> ${cita.name}<br>
			<strong>Doctor:</strong> ${doc ? doc.nombre : 'Doctor'}<br>
			<strong>Fecha:</strong> ${fechaLegible}<br>
			<strong>Hora:</strong> ${cita.time}<br>
			<strong>Teléfono:</strong> ${cita.phone}<br>
			<span class="small confirmacion-recordatorio" style="display:flex;align-items:center;gap:6px;margin-top:6px">
				<img src='assets/icons/reminder-sms.svg' width='18' alt='SMS'/>
				<img src='assets/icons/reminder-whatsapp.svg' width='18' alt='WhatsApp'/>
				<img src='assets/icons/reminder-gmail.svg' width='18' alt='Gmail'/>
				Recordatorio enviado automáticamente
			</span>
		</div>
	`;
	showSection('confirmacion');
}

// Cancelar y reprogramar cita (igual que antes)
function cancelCita(id){
	   if(id.startsWith('demo')){
		   const card = Array.from(document.querySelectorAll('.cita-card')).find(c=>c.innerHTML.includes(id));
		   if(card) card.remove();
		   return;
	   }
	   if(!confirm('¿Desea cancelar esta cita?')) return;
	   let citas = loadCitas();
	   citas = citas.filter(c => c.id !== id);
	   saveCitas(citas);
	   renderCitasList();
	   generateCalendar();
	   renderProximaCita();
}
function reschedule(id){
	   if(id.startsWith('demo')){
		   // Demo: llenar el form con datos demo
		   const demo = id==='demo1' ? {
			   name: 'Ana Pérez', phone: '987654321', email: 'ana@demo.com', doctor: '3', date: '2025-12-01', time: '09:00'
		   } : {
			   name: 'Carlos Ruiz', phone: '912345678', email: 'carlos@demo.com', doctor: '5', date: '2025-12-03', time: '11:00'
		   };
		   document.getElementById('nombrePaciente').value = demo.name;
		   document.getElementById('telefonoPaciente').value = demo.phone;
		   document.getElementById('emailPaciente').value = demo.email;
		   document.getElementById('doctorSelect').value = demo.doctor;
		   showSection('agendar');
		   generateCalendar();
		   return;
	   }
	   const citas = loadCitas();
	   const c = citas.find(x=>x.id===id);
	   if(!c) return alert('Cita no encontrada.');
	   document.getElementById('nombrePaciente').value = c.name;
	   document.getElementById('telefonoPaciente').value = c.phone;
	   document.getElementById('emailPaciente').value = c.email || '';
	   document.getElementById('doctorSelect').value = c.doctor;
	   const remaining = citas.filter(x=>x.id !== id);
	   saveCitas(remaining);
	   showSection('agendar');
	   generateCalendar();
	   const slot = document.querySelector(`.day-slot[data-date="${c.date}"]`);
	   if(slot) { selectDate(c.date, slot); setTimeout(()=> {
		   const ts = Array.from(document.querySelectorAll('.time-slot')).find(t=>t.innerText===c.time && !t.classList.contains('disabled'));
		   if(ts) { selectTime(c.time, ts); }
	   },200); }
	   renderCitasList();
}

// Cargar datos de doctores y servicios (fetch local)
async function fetchData(){
	try {
		const doctoresResp = await fetch('src/doctores.json');
		doctores = await doctoresResp.json();
	} catch {
		doctores = [
			{"id":"1","nombre":"Dr. Jorge Castillo","especialidad":"Ortodoncia","experiencia":"15 años de experiencia","img":"assets/img/doctor.avif"},
			{"id":"2","nombre":"Dr. Leonel Sánchez","especialidad":"Endodoncia","experiencia":"Tratamientos de conducto","img":"assets/img/doctor2.jpg"},
			{"id":"3","nombre":"Dra. Ana M. Torres","especialidad":"Odontopediatría","experiencia":"Atención a niños y familias","img":"assets/img/doctora.jpg"},
			{"id":"4","nombre":"Dr. Carlos Mendoza","especialidad":"Implantes","experiencia":"Procedimientos con guía 3D","img":"assets/img/doctor4.jpg"},
			{"id":"5","nombre":"Dra. Lucía Fernández","especialidad":"Periodoncia","experiencia":"Salud de encías y tejidos","img":"assets/img/doctor5.jpg"},
			{"id":"6","nombre":"Dra. Sofía Rivas","especialidad":"Rehabilitación Oral","experiencia":"Prótesis y restauraciones","img":"assets/img/doctor.avif"},
			{"id":"7","nombre":"Dr. Pablo Ramírez","especialidad":"Cirugía Maxilofacial","experiencia":"Cirugía avanzada y extracciones","img":"assets/img/doctor7.jpg"},
			{"id":"8","nombre":"Dra. Gabriela Salas","especialidad":"Estética Dental","experiencia":"Carillas y diseño de sonrisa","img":"assets/img/doctor8.jpg"},
			{"id":"9","nombre":"Dr. Martín Quispe","especialidad":"Odontología General","experiencia":"Atención integral adultos","img":"assets/img/doctor9.jpg"},
			{"id":"10","nombre":"Dra. Paula Aguirre","especialidad":"Odontopediatría","experiencia":"Especialista en niños y adolescentes","img":"assets/img/doctor10.jpg"}
		];
	}
	try {
		const serviciosResp = await fetch('src/servicios.json');
		servicios = await serviciosResp.json();
	} catch {
		servicios = [
			{"id":"limpieza","nombre":"Limpieza","descripcion":"Profilaxis profesional","icon":"<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/><path d='M10 22l6-12 6 12H10z' fill='#0aa3a3'/></svg>"},
			{"id":"blanqueamiento","nombre":"Blanqueamiento","descripcion":"Opciones seguras","icon":"<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/><path d='M16 10a6 6 0 016 6c0 3.31-2.69 6-6 6s-6-2.69-6-6a6 6 0 016-6z' fill='#f7b731'/></svg>"},
			{"id":"ortodoncia","nombre":"Ortodoncia","descripcion":"Brackets y alineadores","icon":"<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/><rect x='10' y='14' width='12' height='4' rx='2' fill='#0aa3a3'/></svg>"},
			{"id":"implantes","nombre":"Implantes","descripcion":"Técnicas modernas","icon":"<svg class='service-icon' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#e0f7fa'/><rect x='14' y='10' width='4' height='12' rx='2' fill='#0aa3a3'/></svg>"}
		];
	}
	await renderDoctores();
	await renderServicios();
	generateCalendar();
	renderProximaCita();
	const servicioSelect = document.getElementById('servicioSelect');
	if (servicioSelect) servicioSelect.addEventListener('change', updateDoctorSelect);
}

function updateDoctorSelect(){
	       const servicio = document.getElementById('servicioSelect').value;
	       const select = document.getElementById('doctorSelect');
	       select.innerHTML = '<option value="">-- Seleccione --</option>';
	       if(!servicio) return;
	       doctores.forEach(doc=>{
		       if(doc.especialidad && (doc.especialidad.toLowerCase().includes(servicio.toLowerCase()) || (servicio==='odontopediatria' && doc.especialidad.toLowerCase().includes('pediatr')))){
			       select.innerHTML += `<option value="${doc.id}">${doc.nombre} — ${doc.especialidad}</option>`;
		       }
	       });
}


// Inicialización
window.showSection = showSection;
window.agendarConDoctor = agendarConDoctor;
window.cancelCita = cancelCita;
window.reschedule = reschedule;

fetchData();
