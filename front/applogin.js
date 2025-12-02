const API_URL = '/api'; 

// Elementos del DOM
const authView = document.getElementById('auth-view');
const profileView = document.getElementById('profile-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const submitBtn = document.getElementById('submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');
const logoutBtn = document.getElementById('logout-btn');
const fetchProfileBtn = document.getElementById('fetch-profile-btn');
const messageBox = document.getElementById('message-box');
const profileData = document.getElementById('profile-data');

// Elementos del Panel de Admin
const adminTabs = document.getElementById('admin-tabs');
const tabProfile = document.getElementById('tab-profile');
const tabAdmin = document.getElementById('tab-admin');
const sectionProfile = document.getElementById('section-profile');
const sectionAdmin = document.getElementById('section-admin');
const refreshUsersBtn = document.getElementById('refresh-users-btn');
const usersTableContainer = document.getElementById('users-table-container');

// Modales
const roleModal = document.getElementById('role-modal');
const modalUserEmail = document.getElementById('modal-user-email');
const modalNewRole = document.getElementById('modal-new-role');
const confirmRoleChange = document.getElementById('confirm-role-change');
const cancelRoleChange = document.getElementById('cancel-role-change');

const deleteModal = document.getElementById('delete-modal');
const modalDeleteEmail = document.getElementById('modal-delete-email');
const confirmDelete = document.getElementById('confirm-delete');
const cancelDelete = document.getElementById('cancel-delete');

let isRegister = false;
let currentUserId = null; // Para guardar el ID del usuario que se está editando
let allUsers = []; // Cache de usuarios

// --- Funciones de Utilidad ---

function setAuthToken(token) {
    localStorage.setItem('jwtToken', token);
}

function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

function clearAuthToken() {
    localStorage.removeItem('jwtToken');
}

function displayMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    
    if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else {
        messageBox.classList.add('bg-green-100', 'text-green-700');
    }
}

function hideMessage() {
    messageBox.classList.add('hidden');
}

function displaySuccessWithNavigation(email, role) {
    // Ocultar formulario de login
    authView.classList.add('hidden');
    
    // Crear mensaje de bienvenida con opciones
    const welcomeDiv = document.createElement('div');
    welcomeDiv.id = 'welcome-navigation';
    welcomeDiv.className = 'text-center py-8';
    welcomeDiv.innerHTML = `
        <div class="mb-6">
            <svg class="w-20 h-20 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">¡Bienvenido!</h2>
            <p class="text-xl text-gray-600 mb-1">${email}</p>
            <p class="text-lg text-indigo-600 font-semibold">Rol: ${role}</p>
        </div>
        
        <div class="space-y-4 max-w-md mx-auto">
            <p class="text-gray-700 mb-6">¿Qué deseas hacer ahora?</p>
            
            <a href="news.html" class="block w-full py-3 px-6 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all font-semibold">
                <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                </svg>
                Ver Noticias
            </a>
            
            <button onclick="showProfileView()" class="block w-full py-3 px-6 bg-gray-100 text-gray-800 rounded-lg shadow-md hover:bg-gray-200 transition-all font-semibold">
                <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Ver Mi Perfil
            </button>
        </div>
        
        <p class="mt-6 text-sm text-gray-500">
            Serás redirigido automáticamente a las noticias en <span id="countdown">5</span> segundos...
        </p>
    `;
    
    // Reemplazar contenido
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '';
    appContainer.appendChild(welcomeDiv);
    
    // Countdown y redirección automática
    let seconds = 5;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        seconds--;
        if (countdownElement) {
            countdownElement.textContent = seconds;
        }
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            window.location.href = 'news.html';
        }
    }, 1000);
}

function showProfileView() {
    // Recargar la página para mostrar la vista de perfil
    location.reload();
}

function isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
}

function updateView() {
    const token = getAuthToken();
    hideMessage();
    profileData.textContent = '';

    // Handle navbar
    const mainNavbar = document.getElementById('main-navbar');

    if (token) {
        authView.classList.add('hidden');
        profileView.classList.remove('hidden');
        
        // Show navbar
        if (mainNavbar) {
            mainNavbar.classList.remove('hidden');
            // Add padding to body to account for fixed navbar
            document.body.style.paddingTop = '4rem';
        }
        
        const userEmail = localStorage.getItem('userEmail') || 'Usuario';
        const userRole = localStorage.getItem('userRole') || 'desconocido';
        document.getElementById('user-email-display').textContent = userEmail;
        document.getElementById('user-role-display').textContent = userRole;

        // Mostrar tabs de admin si el usuario es admin
        if (isAdmin()) {
            // Asegurarse de que el elemento existe antes de modificarlo
            if (adminTabs) {
                adminTabs.classList.remove('hidden');
            } else {
                console.error('Elemento admin-tabs no encontrado');
            }
            
            // Pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                switchTab('profile');
            }, 100);
        } else {
            if (adminTabs) {
                adminTabs.classList.add('hidden');
            }
            sectionProfile.classList.remove('hidden');
            sectionAdmin.classList.add('hidden');
        }
    } else {
        authView.classList.remove('hidden');
        profileView.classList.add('hidden');
        
        // Hide navbar
        const mainNavbar = document.getElementById('main-navbar');
        if (mainNavbar) {
            mainNavbar.classList.add('hidden');
            document.body.style.paddingTop = '0';
        }
    }
}

function toggleAuthMode() {
    isRegister = !isRegister;
    if (isRegister) {
        authTitle.textContent = 'Registro de Nuevo Usuario';
        submitBtn.textContent = 'Registrar';
        toggleAuthBtn.textContent = 'Inicia Sesión aquí';
    } else {
        authTitle.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Entrar';
        toggleAuthBtn.textContent = 'Regístrate aquí';
    }
}

// --- Gestión de Tabs ---
function switchTab(tabName) {
    // Verificar que los elementos existen
    if (!tabProfile || !tabAdmin || !sectionProfile || !sectionAdmin) {
        console.error('Elementos de tabs no encontrados');
        return;
    }

    // Remover clase activa de todos los tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-indigo-600', 'text-indigo-600');
        btn.classList.add('border-transparent', 'text-gray-600');
    });

    // Ocultar todas las secciones
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.add('hidden');
    });

    // Activar el tab seleccionado
    if (tabName === 'profile') {
        tabProfile.classList.add('border-indigo-600', 'text-indigo-600');
        tabProfile.classList.remove('border-transparent', 'text-gray-600');
        sectionProfile.classList.remove('hidden');
    } else if (tabName === 'admin') {
        tabAdmin.classList.add('border-indigo-600', 'text-indigo-600');
        tabAdmin.classList.remove('border-transparent', 'text-gray-600');
        sectionAdmin.classList.remove('hidden');
        loadUsers(); // Cargar usuarios al entrar al panel
    }
}

// --- Funciones del Panel de Admin ---

async function loadUsers() {
    const token = getAuthToken();
    if (!token || !isAdmin()) return;

    usersTableContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Cargando usuarios...</p>';

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error('Respuesta inválida del servidor');
        }

        const users = await response.json();

        if (response.ok) {
            allUsers = users;
            renderUsersTable(users);
        } else {
            displayMessage('Error al cargar usuarios: ' + users.message, 'error');
            usersTableContainer.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar usuarios</p>';
        }
    } catch (error) {
        displayMessage('Error de conexión: ' + error.message, 'error');
        usersTableContainer.innerHTML = '<p class="text-center text-red-500 py-8">Error de conexión</p>';
    }
}

function renderUsersTable(users) {
    if (users.length === 0) {
        usersTableContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No hay usuarios registrados</p>';
        return;
    }

    const currentUserId = localStorage.getItem('userId'); // Asumiendo que guardas el ID al hacer login

    const table = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rol</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fecha Registro</th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                ${users.map(user => `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                  user.role === 'editor' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-green-100 text-green-800'}">
                                ${user.role}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button onclick="openRoleModal('${user._id}', '${user.email}', '${user.role}')" 
                                class="text-indigo-600 hover:text-indigo-900 mr-3">
                                Cambiar Rol
                            </button>
                            ${user._id !== currentUserId ? `
                                <button onclick="openDeleteModal('${user._id}', '${user.email}')" 
                                    class="text-red-600 hover:text-red-900">
                                    Eliminar
                                </button>
                            ` : '<span class="text-gray-400">Tú mismo</span>'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    usersTableContainer.innerHTML = table;
}

// --- Modales ---

function openRoleModal(userId, email, currentRole) {
    currentUserId = userId;
    modalUserEmail.textContent = email;
    modalNewRole.value = currentRole;
    roleModal.classList.remove('hidden');
}

function closeRoleModal() {
    roleModal.classList.add('hidden');
    currentUserId = null;
}

async function changeUserRole() {
    const token = getAuthToken();
    const newRole = modalNewRole.value;

    if (!token || !currentUserId) return;

    try {
        const response = await fetch(`${API_URL}/admin/role/${currentUserId}`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newRole })
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage(data.message, 'success');
            closeRoleModal();
            loadUsers(); // Recargar la lista
        } else {
            displayMessage('Error: ' + data.message, 'error');
        }
    } catch (error) {
        displayMessage('Error de conexión: ' + error.message, 'error');
    }
}

function openDeleteModal(userId, email) {
    currentUserId = userId;
    modalDeleteEmail.textContent = email;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    currentUserId = null;
}

async function deleteUser() {
    const token = getAuthToken();

    if (!token || !currentUserId) return;

    try {
        const response = await fetch(`${API_URL}/admin/user/${currentUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage(data.message, 'success');
            closeDeleteModal();
            loadUsers(); // Recargar la lista
        } else {
            displayMessage('Error: ' + data.message, 'error');
        }
    } catch (error) {
        displayMessage('Error de conexión: ' + error.message, 'error');
    }
}

// --- Event Listeners ---

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    submitBtn.disabled = true;
    submitBtn.textContent = isRegister ? 'Registrando...' : 'Entrando...';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Respuesta inválida del servidor: "${text.substring(0, 50)}..."`);
        }

        const data = await response.json();

        if (response.ok) {
            displayMessage(data.message, 'success');
            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userId', data.user.id);
                
                // Mostrar mensaje de éxito con opciones de navegación
                displaySuccessWithNavigation(data.user.email, data.user.role);
            } else if (isRegister) {
                isRegister = false;
                toggleAuthMode();
                document.getElementById('email').value = email;
            }
        } else {
            displayMessage(data.message || 'Error desconocido del servidor.', 'error');
        }
    } catch (error) {
        displayMessage('Error de conexión: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Registrar' : 'Entrar';
    }
});

logoutBtn.addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        displayMessage('Sesión cerrada exitosamente.', 'success');
    } catch (error) {
        console.error('Error al enviar solicitud de logout:', error);
    } finally {
        clearAuthToken();
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        updateView();
    }
});

fetchProfileBtn.addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return displayMessage('No hay token para verificar.', 'error');

    profileData.textContent = 'Cargando datos del perfil...';

    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Respuesta inválida: "${text.substring(0, 50)}..."`);
        }

        const data = await response.json();

        if (response.ok) {
            profileData.textContent = JSON.stringify(data, null, 2);
            displayMessage('Ruta protegida verificada con éxito.', 'success');
        } else {
            profileData.textContent = JSON.stringify(data, null, 2);
            displayMessage('Error: ' + data.message, 'error');
        }
    } catch (error) {
        profileData.textContent = 'Error de conexión: ' + error.message;
        displayMessage('Error de conexión con la API.', 'error');
    }
});

// Tabs
tabProfile?.addEventListener('click', () => switchTab('profile'));
tabAdmin?.addEventListener('click', () => switchTab('admin'));

// Panel de Admin
refreshUsersBtn?.addEventListener('click', loadUsers);

// Modales de Rol
confirmRoleChange.addEventListener('click', changeUserRole);
cancelRoleChange.addEventListener('click', closeRoleModal);

// Modales de Eliminación
confirmDelete.addEventListener('click', deleteUser);
cancelDelete.addEventListener('click', closeDeleteModal);

// Toggle Auth
toggleAuthBtn.addEventListener('click', toggleAuthMode);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateView();
});

// Exponer funciones globales para los botones inline
window.openRoleModal = openRoleModal;
window.openDeleteModal = openDeleteModal;
window.showProfileView = showProfileView;