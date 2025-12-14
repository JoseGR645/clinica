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

let currentUser = null;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData(user);
    } else {
        window.location.replace('index.html');
    }
});

async function loadUserData(user) {
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const birthdateInput = document.getElementById('birthdate');
    const profilePhoto = document.getElementById('profilePhoto');
    
    displayNameInput.value = user.displayName || '';
    emailInput.value = user.email || '';
    
    const userDataStr = localStorage.getItem('userData_' + user.uid);
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
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
            console.error('Error cargando datos:', e);
            if (user.photoURL) {
                profilePhoto.src = user.photoURL;
            } else {
                setDefaultAvatar(profilePhoto);
            }
        }
    } else if (user.photoURL) {
        profilePhoto.src = user.photoURL;
    } else {
        setDefaultAvatar(profilePhoto);
    }
}

function setDefaultAvatar(imgElement) {
    imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230aa3a3"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    
    setTimeout(() => {
        message.classList.remove('success', 'error');
        message.style.display = 'none';
    }, 5000);
}

async function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showMessage('La imagen es muy grande. Máximo 5MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showMessage('Solo se permiten imágenes', 'error');
        return;
    }
    
    const profilePhoto = document.getElementById('profilePhoto');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        profilePhoto.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    try {
        const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        const userDataStr = localStorage.getItem('userData_' + currentUser.uid);
        let userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.photoURL = base64String;
        localStorage.setItem('userData_' + currentUser.uid, JSON.stringify(userData));
        
        showMessage('Foto actualizada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar foto:', error);
        showMessage('Error al guardar la foto', 'error');
    }
}

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
        await currentUser.updateProfile({
            displayName: displayName
        });
        
        if (email !== currentUser.email) {
            await currentUser.updateEmail(email);
            showMessage('Correo actualizado. Por favor verifica tu nuevo correo.', 'success');
        }
        
        const userDataStr = localStorage.getItem('userData_' + currentUser.uid);
        let userData = userDataStr ? JSON.parse(userDataStr) : {};
        
        userData.phone = phone;
        userData.address = address;
        userData.birthdate = birthdate;
        
        localStorage.setItem('userData_' + currentUser.uid, JSON.stringify(userData));
        
        showMessage('Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
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

async function handleLogout() {
    if (!confirm('¿Estás seguro que deseas cerrar sesión?')) {
        return;
    }
    
    try {
        await auth.signOut();
        window.location.replace('index.html');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showMessage('Error al cerrar sesión', 'error');
    }
}