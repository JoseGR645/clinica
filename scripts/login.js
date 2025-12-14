const firebaseConfig = {
    apiKey: "AIzaSyBJP3WpBtEgUwE2fk_Qj-giOW1hi2HVgHw",
    authDomain: "clinica-d1868.firebaseapp.com",
    projectId: "clinica-d1868",
    storageBucket: "clinica-d1868.firebasestorage.app",
    messagingSenderId: "531058616756",
    appId: "1:531058616756:web:07bc9f53b70f7f48e7eae1",
    measurementId: "G-E8Q0T5E033"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let isLogin = true;
let isForgotPassword = false;

document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
});

function showForgotPassword() {
    isForgotPassword = true;
    const nameGroup = document.getElementById('nameGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const formOptions = document.getElementById('formOptions');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleText = document.getElementById('toggleText');
    const toggleBtn = document.getElementById('toggleBtn');
    const googleBtn = document.getElementById('googleBtn');
    const divider = document.querySelector('.divider');
    
    nameGroup.classList.add('hidden');
    passwordGroup.classList.add('hidden');
    formOptions.classList.add('hidden');
    googleBtn.classList.add('hidden');
    divider.classList.add('hidden');
    
    formTitle.textContent = 'Recuperar Contraseña';
    submitBtn.textContent = 'Enviar correo de recuperación';
    toggleText.textContent = '¿Recordaste tu contraseña?';
    toggleBtn.textContent = 'Volver al login';
    
    hideMessage();
}

function toggleForm() {
    if (isForgotPassword) {
        isForgotPassword = false;
        isLogin = true;
        
        const nameGroup = document.getElementById('nameGroup');
        const passwordGroup = document.getElementById('passwordGroup');
        const formOptions = document.getElementById('formOptions');
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const toggleText = document.getElementById('toggleText');
        const toggleBtn = document.getElementById('toggleBtn');
        const googleBtn = document.getElementById('googleBtn');
        const divider = document.querySelector('.divider');
        
        nameGroup.classList.add('hidden');
        passwordGroup.classList.remove('hidden');
        formOptions.classList.remove('hidden');
        googleBtn.classList.remove('hidden');
        divider.classList.remove('hidden');
        
        formTitle.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Iniciar Sesión';
        toggleText.textContent = '¿No tienes una cuenta?';
        toggleBtn.textContent = 'Regístrate aquí';
    } else {
        isLogin = !isLogin;
        const nameGroup = document.getElementById('nameGroup');
        const passwordGroup = document.getElementById('passwordGroup');
        const formOptions = document.getElementById('formOptions');
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const toggleText = document.getElementById('toggleText');
        const toggleBtn = document.getElementById('toggleBtn');
        
        if (isLogin) {
            nameGroup.classList.add('hidden');
            passwordGroup.classList.remove('hidden');
            formOptions.classList.remove('hidden');
            formTitle.textContent = 'Iniciar Sesión';
            submitBtn.textContent = 'Iniciar Sesión';
            toggleText.textContent = '¿No tienes una cuenta?';
            toggleBtn.textContent = 'Regístrate aquí';
        } else {
            nameGroup.classList.remove('hidden');
            passwordGroup.classList.remove('hidden');
            formOptions.classList.add('hidden');
            formTitle.textContent = 'Crear Cuenta';
            submitBtn.textContent = 'Registrarse';
            toggleText.textContent = '¿Ya tienes una cuenta?';
            toggleBtn.textContent = 'Inicia sesión';
        }
    }
    
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    hideMessage();
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type} show`;
}

function hideMessage() {
    const message = document.getElementById('message');
    message.classList.remove('show');
}

function setLoading(loading) {
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    submitBtn.disabled = loading;
    googleBtn.disabled = loading;
    
    if (isForgotPassword) {
        submitBtn.textContent = loading ? 'Enviando...' : 'Enviar correo de recuperación';
    } else {
        submitBtn.textContent = loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse');
    }
}

async function handleAuth() {
    const email = document.getElementById('email').value.trim();
    
    hideMessage();
    
    if (isForgotPassword) {
        if (!email) {
            showMessage('Por favor ingresa tu correo electrónico', 'error');
            return;
        }
        
        setLoading(true);
        
        try {
            await auth.sendPasswordResetEmail(email);
            showMessage('Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.', 'success');
            
            setTimeout(() => {
                toggleForm();
            }, 3000);
        } catch (error) {
            console.error('Error:', error);
            let errorMessage = 'Error al enviar el correo';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No existe una cuenta con este correo';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
        
        return;
    }
    
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!isLogin && !name) {
        showMessage('Por favor ingresa tu nombre', 'error');
        return;
    }
    
    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.replace('principal.html');
            }, 1500);
        } else {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            showMessage('¡Registro exitoso! Bienvenido ' + name, 'success');
            
            setTimeout(() => {
                window.location.replace('principal.html');
            }, 1500);
        }
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'Error en la autenticación';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este correo ya está registrado';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
                break;
            default:
                errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
}

async function handleGoogleAuth() {
    hideMessage();
    setLoading(true);
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        showMessage('¡Autenticación con Google exitosa! Redirigiendo...', 'success');
        
        setTimeout(() => {
            window.location.replace('principal.html');
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'Error al autenticar con Google';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Autenticación cancelada';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup bloqueado. Permite popups para este sitio';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'Dominio no autorizado. Configura 127.0.0.1 y localhost en Firebase Console';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
}

document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleAuth();
    }
});

document.getElementById('email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && isForgotPassword) {
        handleAuth();
    }
});

auth.onAuthStateChanged((user) => {
    if (user && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.includes('index.html'))) {
        window.location.replace('principal.html');
    }
});