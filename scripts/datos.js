// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBJP3WpBtEgUwE2fk_Qj-giOW1hi2HVgHw",
    authDomain: "clinica-d1868.firebaseapp.com",
    projectId: "clinica-d1868",
    storageBucket: "clinica-d1868.firebasestorage.app",
    messagingSenderId: "531058616756",
    appId: "1:531058616756:web:07bc9f53b70f7f48e7eae1",
    measurementId: "G-E8Q0T5E033"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const storage = firebase.storage();

// Firestore and functions
const db = firebase.firestore();
const functions = firebase.functions();

let currentUser = null;

// Verificar autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData(user);
    } else {
        window.location.replace('index.html');
    }
});

// Cargar datos del usuario
async function loadUserData(user) {
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const birthdateInput = document.getElementById('birthdate');
    const profilePhoto = document.getElementById('profilePhoto');
    
    // Cargar datos básicos de Firebase Auth y Firestore users/doc
    displayNameInput.value = user.displayName || '';
    emailInput.value = user.email || '';
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const userData = doc.exists ? doc.data() : {};
        phoneInput.value = userData.phone || '';
        addressInput.value = userData.address || '';
        birthdateInput.value = userData.birthdate || '';
        if (userData.photoURL) {
            profilePhoto.src = userData.photoURL;
        } else if (user.photoURL) {
            profilePhoto.src = user.photoURL;
        } else {
            setDefaultAvatar(profilePhoto);
        }
    } catch (e) {
        console.error('Error cargando datos desde Firestore:', e);
        if (user.photoURL) profilePhoto.src = user.photoURL;
        else setDefaultAvatar(profilePhoto);
    }
}

// Avatar predeterminado
function setDefaultAvatar(imgElement) {
    imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230aa3a3"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
}

// Mostrar mensaje
function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    
    setTimeout(() => {
        message.classList.remove('success', 'error');
        message.style.display = 'none';
    }, 5000);
}

// Manejar cambio de foto
async function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('La imagen es muy grande. Máximo 5MB', 'error');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showMessage('Solo se permiten imágenes', 'error');
        return;
    }
    
    const profilePhoto = document.getElementById('profilePhoto');
    
    // Mostrar preview inmediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
        profilePhoto.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    try {
        // Subir imagen a Firebase Storage y guardar URL en Firestore
        const storageRef = storage.ref().child(`profiles/${currentUser.uid}`);
        const uploadTask = await storageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        await db.collection('users').doc(currentUser.uid).set({ photoURL: downloadURL }, { merge: true });
        showMessage('Foto actualizada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar foto:', error);
        showMessage('Error al guardar la foto', 'error');
    }
}

// Guardar perfil
async function handleSaveProfile() {
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const birthdate = document.getElementById('birthdate').value;
    
    if (!displayName) {
        showMessage('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!email) {
        showMessage('El correo es obligatorio', 'error');
        return;
    }
    
    try {
        // Actualizar displayName en Firebase Auth
        await currentUser.updateProfile({
            displayName: displayName
        });
        
        // Si el email cambió, actualizarlo
        if (email !== currentUser.email) {
            await currentUser.updateEmail(email);
            showMessage('Correo actualizado. Por favor verifica tu nuevo correo.', 'success');
        }
        
        // Guardar datos adicionales en Firestore
        await db.collection('users').doc(currentUser.uid).set({
            phone: phone,
            address: address,
            birthdate: birthdate
        }, { merge: true });
        showMessage('Perfil actualizado correctamente', 'success');
        
        // Recargar datos (o re-cargar perfil)
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Error al guardar:', error);
        let errorMessage = 'Error al actualizar el perfil';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este correo ya está en uso';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Por seguridad, debes iniciar sesión nuevamente para cambiar el correo';
                break;
            default:
                errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
    }
}

// Cambiar contraseña
async function handleChangePassword() {
    const email = currentUser.email;
    
    if (!confirm('¿Deseas cambiar tu contraseña? Se enviará un correo de recuperación a ' + email)) {
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Se ha enviado un correo para restablecer tu contraseña', 'success');
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al enviar el correo de recuperación', 'error');
    }
}

// Cerrar sesión
async function handleLogout() {
    if (!confirm('¿Estás seguro que deseas cerrar sesión?')) {
        return;
    }
    
    try {
        await auth.signOut();
        // Reemplazar la entrada en el historial para evitar volver a sesión previa
        window.location.replace('index.html');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showMessage('Error al cerrar sesión', 'error');
    }
}