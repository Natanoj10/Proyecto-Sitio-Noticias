const API_URL = '/api';

// State
let currentCategory = 'todas';
let currentSkip = 0;
let hasMore = true;
let isLoading = false;
let currentNewsId = null;

// DOM Elements
const newsGrid = document.getElementById('news-grid');
const loadingIndicator = document.getElementById('loading-indicator');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const messageBox = document.getElementById('message-box');
const categoryFilters = document.querySelectorAll('.category-filter');

// Auth elements
const authButtons = document.getElementById('auth-buttons');
const guestButtons = document.getElementById('guest-buttons');
const navbarUserEmail = document.getElementById('navbar-user-email');
const navbarLogout = document.getElementById('navbar-logout');

// Editor panel
const editorPanelToggle = document.getElementById('editor-panel-toggle');
const toggleEditorPanelBtn = document.getElementById('toggle-editor-panel');
const editorModal = document.getElementById('editor-modal');
const closeEditorModal = document.getElementById('close-editor-modal');

// Editor tabs
const tabCreate = document.getElementById('tab-create');
const tabMyNews = document.getElementById('tab-my-news');
const tabAllNews = document.getElementById('tab-all-news');
const sectionCreate = document.getElementById('section-create');
const sectionMyNews = document.getElementById('section-my-news');
const sectionAllNews = document.getElementById('section-all-news');

// Forms
const createNewsForm = document.getElementById('create-news-form');
const editNewsForm = document.getElementById('edit-news-form');

// Modals
const editModal = document.getElementById('edit-modal');
const closeEditModal = document.getElementById('close-edit-modal');
const cancelEdit = document.getElementById('cancel-edit');

const detailModal = document.getElementById('detail-modal');
const closeDetailModal = document.getElementById('close-detail-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');

// ===== Utility Functions =====

function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

function isAuthenticated() {
    return !!getAuthToken();
}

function isEditorOrAdmin() {
    const role = getUserRole();
    return role === 'editor' || role === 'admin';
}

function displayMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-blue-100', 'text-blue-700');
    
    if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else if (type === 'info') {
        messageBox.classList.add('bg-blue-100', 'text-blue-700');
    } else {
        messageBox.classList.add('bg-green-100', 'text-green-700');
    }

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getCategoryColor(category) {
    const colors = {
        'política': 'bg-red-100 text-red-800',
        'deportes': 'bg-green-100 text-green-800',
        'tecnología': 'bg-blue-100 text-blue-800',
        'cultura': 'bg-purple-100 text-purple-800',
        'economía': 'bg-yellow-100 text-yellow-800',
        'internacional': 'bg-pink-100 text-pink-800',
        'otros': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['otros'];
}

// ===== Auth UI =====

function updateAuthUI() {
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (isAuthenticated() && userEmail) {
        authButtons.classList.remove('hidden');
        guestButtons.classList.add('hidden');
        navbarUserEmail.textContent = userEmail;
        
        // Mostrar rol del usuario
        const roleDisplay = document.getElementById('navbar-user-role');
        if (roleDisplay && userRole) {
            const roleNames = {
                'admin': 'Administrador',
                'editor': 'Editor',
                'user': 'Usuario'
            };
            roleDisplay.textContent = roleNames[userRole] || userRole;
        }

        // Show editor panel if user is editor or admin
        if (isEditorOrAdmin()) {
            editorPanelToggle.classList.remove('hidden');
            
            // Show "All News" tab only for admins
            if (getUserRole() === 'admin') {
                tabAllNews.style.display = 'block';
            }
        }
    } else {
        authButtons.classList.add('hidden');
        guestButtons.classList.remove('hidden');
        editorPanelToggle.classList.add('hidden');
    }
}

navbarLogout.addEventListener('click', async () => {
    // Confirmar antes de cerrar sesión
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        return;
    }
    
    const token = getAuthToken();
    
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        displayMessage('Sesión cerrada exitosamente. Redirigiendo...', 'success');
    } catch (error) {
        console.error('Error logging out:', error);
    }
    
    // Limpiar datos y redirigir
    localStorage.clear();
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
});

// ===== News Loading =====

async function loadNews(reset = false) {
    if (isLoading) return;
    
    if (reset) {
        currentSkip = 0;
        newsGrid.innerHTML = '';
    }

    isLoading = true;
    loadingIndicator.classList.remove('hidden');

    try {
        const url = `${API_URL}/news?category=${currentCategory}&limit=9&skip=${currentSkip}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error al cargar noticias');
        }

        const data = await response.json();
        
        if (data.news && data.news.length > 0) {
            renderNews(data.news);
            currentSkip += data.news.length;
            hasMore = data.hasMore;
        } else if (reset) {
            newsGrid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><p class="text-xl">No hay noticias en esta categoría</p></div>';
        }

        loadMoreContainer.classList.toggle('hidden', !hasMore);
    } catch (error) {
        console.error('Error loading news:', error);
        displayMessage('Error al cargar noticias', 'error');
    } finally {
        isLoading = false;
        loadingIndicator.classList.add('hidden');
    }
}

function renderNews(newsList) {
    newsList.forEach(news => {
        const card = createNewsCard(news);
        newsGrid.appendChild(card);
    });
}

function createNewsCard(news) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer';
    card.onclick = () => openNewsDetail(news._id);

    const imageHtml = news.imageUrl 
        ? `<img src="${news.imageUrl}" alt="${news.title}" class="w-full h-48 object-cover">`
        : `<div class="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
           </div>`;

    card.innerHTML = `
        ${imageHtml}
        <div class="p-5">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs px-2 py-1 rounded-full ${getCategoryColor(news.category)}">
                    ${news.category}
                </span>
                <span class="text-xs text-gray-500">${formatDate(news.createdAt)}</span>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2 line-clamp-2">${news.title}</h3>
            ${news.summary ? `<p class="text-gray-600 text-sm mb-4 line-clamp-3">${news.summary}</p>` : ''}
            <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center space-x-3">
                    <span class="flex items-center space-x-1">
                        <span>♥</span>
                        <span>${news.likesCount || 0}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                        <span>◉</span>
                        <span>${news.views || 0}</span>
                    </span>
                </div>
                <span class="text-xs">Por ${news.authorName}</span>
            </div>
        </div>
    `;

    return card;
}

// ===== News Detail Modal =====

async function openNewsDetail(newsId) {
    try {
        const response = await fetch(`${API_URL}/news/${newsId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar la noticia');
        }

        const news = await response.json();
        displayNewsDetail(news);
    } catch (error) {
        console.error('Error loading news detail:', error);
        displayMessage('Error al cargar la noticia', 'error');
    }
}

function displayNewsDetail(news) {
    document.getElementById('detail-title').textContent = news.title;
    document.getElementById('detail-author').textContent = `Por ${news.authorName}`;
    document.getElementById('detail-date').textContent = formatDate(news.createdAt);
    document.getElementById('detail-category').textContent = news.category;
    document.getElementById('detail-category').className = `px-2 py-1 rounded-full text-xs ${getCategoryColor(news.category)}`;
    
    if (news.imageUrl) {
        document.getElementById('detail-image').src = news.imageUrl;
        document.getElementById('detail-image-container').classList.remove('hidden');
    } else {
        document.getElementById('detail-image-container').classList.add('hidden');
    }

    if (news.summary) {
        document.getElementById('detail-summary').textContent = news.summary;
        document.getElementById('detail-summary').classList.remove('hidden');
    } else {
        document.getElementById('detail-summary').classList.add('hidden');
    }

    document.getElementById('detail-content').textContent = news.content;
    document.getElementById('detail-like-count').textContent = news.likesCount || 0;
    document.getElementById('detail-views').textContent = news.views || 0;

    const likeBtn = document.getElementById('detail-like-btn');
    const likeIcon = document.getElementById('detail-like-icon');
    
    // Check if user liked this news
    const token = getAuthToken();
    if (token) {
        const userId = localStorage.getItem('userId');
        const liked = news.likes && news.likes.includes(userId);
        likeIcon.textContent = liked ? '♥' : '♡';
        
        likeBtn.onclick = () => toggleLike(news._id);
        likeBtn.classList.remove('cursor-not-allowed', 'opacity-50');
        likeBtn.classList.add('hover:bg-gray-100');
    } else {
        likeIcon.textContent = '♡';
        likeBtn.onclick = () => displayMessage('Debes iniciar sesión para dar like', 'info');
        likeBtn.classList.add('cursor-not-allowed', 'opacity-50');
    }

    currentNewsId = news._id;
    detailModal.classList.remove('hidden');
}

async function toggleLike(newsId) {
    const token = getAuthToken();
    if (!token) {
        displayMessage('Debes iniciar sesión para dar like', 'info');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/news/${newsId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al procesar el like');
        }

        const data = await response.json();
        
        // Update UI
        document.getElementById('detail-like-count').textContent = data.likes;
        document.getElementById('detail-like-icon').textContent = data.liked ? '♥' : '♡';
        
        displayMessage(data.message, 'success');
    } catch (error) {
        console.error('Error toggling like:', error);
        displayMessage('Error al procesar el like', 'error');
    }
}

// ===== Category Filter =====

categoryFilters.forEach(button => {
    button.addEventListener('click', () => {
        categoryFilters.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        currentCategory = button.dataset.category;
        loadNews(true);
    });
});

loadMoreBtn.addEventListener('click', () => loadNews(false));

// ===== Editor Panel =====

toggleEditorPanelBtn.addEventListener('click', () => {
    editorModal.classList.remove('hidden');
    switchEditorTab('create');
});

closeEditorModal.addEventListener('click', () => {
    // Verificar si hay contenido en el formulario de creación
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    
    if (title || content) {
        if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar?')) {
            return;
        }
    }
    
    editorModal.classList.add('hidden');
});

function switchEditorTab(tab) {
    // Remove active class from all tabs
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    
    // Hide all sections
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    
    // Activate selected tab
    if (tab === 'create') {
        tabCreate.classList.add('active');
        sectionCreate.classList.remove('hidden');
    } else if (tab === 'my-news') {
        tabMyNews.classList.add('active');
        sectionMyNews.classList.remove('hidden');
        loadMyNews();
    } else if (tab === 'all-news') {
        tabAllNews.classList.add('active');
        sectionAllNews.classList.remove('hidden');
        loadAllNews();
    }
}

tabCreate.addEventListener('click', () => switchEditorTab('create'));
tabMyNews.addEventListener('click', () => switchEditorTab('my-news'));
tabAllNews.addEventListener('click', () => switchEditorTab('all-news'));

// ===== Create News =====

createNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
        displayMessage('Debes iniciar sesión', 'error');
        return;
    }

    const newsData = {
        title: document.getElementById('news-title').value,
        summary: document.getElementById('news-summary').value,
        content: document.getElementById('news-content').value,
        category: document.getElementById('news-category').value,
        imageUrl: document.getElementById('news-image').value || null,
        published: document.getElementById('news-published').checked
    };

    try {
        const response = await fetch(`${API_URL}/news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newsData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear la noticia');
        }

        const data = await response.json();
        displayMessage(data.message, 'success');
        createNewsForm.reset();
        
        // Cambiar a la pestaña de "Mis Noticias" para ver la noticia creada
        setTimeout(() => {
            switchEditorTab('my-news');
        }, 500);
        
        // Reload news if published
        if (newsData.published) {
            loadNews(true);
            displayMessage('Noticia publicada exitosamente y visible para todos los usuarios', 'success');
        } else {
            displayMessage('Borrador guardado. Puedes editarlo y publicarlo más tarde desde "Mis Noticias"', 'info');
        }
    } catch (error) {
        console.error('Error creating news:', error);
        displayMessage(error.message, 'error');
    }
});

// ===== My News =====

async function loadMyNews() {
    const token = getAuthToken();
    if (!token) return;

    const myNewsList = document.getElementById('my-news-list');
    myNewsList.innerHTML = '<p class="text-center text-gray-500 py-8">Cargando...</p>';

    try {
        const response = await fetch(`${API_URL}/news/my/articles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al cargar tus noticias');
        }

        const data = await response.json();
        renderMyNews(data.news);
    } catch (error) {
        console.error('Error loading my news:', error);
        myNewsList.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar tus noticias</p>';
    }
}

function renderMyNews(newsList) {
    const container = document.getElementById('my-news-list');
    
    if (newsList.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No tienes noticias creadas</p>';
        return;
    }

    container.innerHTML = newsList.map(news => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${news.title}</h3>
                    <div class="flex items-center space-x-3 mt-2 text-sm text-gray-600">
                        <span class="px-2 py-1 rounded-full text-xs ${getCategoryColor(news.category)}">${news.category}</span>
                        <span>${formatDate(news.createdAt)}</span>
                        <span class="px-2 py-1 rounded-full text-xs ${news.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${news.published ? 'Publicado' : 'Borrador'}
                        </span>
                    </div>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>♥ ${news.likesCount || 0}</span>
                        <span>◉ ${news.views || 0}</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="openEditNews('${news._id}')" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                        Editar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

document.getElementById('refresh-my-news').addEventListener('click', loadMyNews);

// ===== All News (Admin) =====

async function loadAllNews() {
    const token = getAuthToken();
    if (!token || getUserRole() !== 'admin') return;

    const allNewsList = document.getElementById('all-news-list');
    allNewsList.innerHTML = '<p class="text-center text-gray-500 py-8">Cargando...</p>';

    try {
        const response = await fetch(`${API_URL}/news/all/manage`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al cargar las noticias');
        }

        const data = await response.json();
        renderAllNews(data.news);
    } catch (error) {
        console.error('Error loading all news:', error);
        allNewsList.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar las noticias</p>';
    }
}

function renderAllNews(newsList) {
    const container = document.getElementById('all-news-list');
    
    if (newsList.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No hay noticias</p>';
        return;
    }

    container.innerHTML = newsList.map(news => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${news.title}</h3>
                    <div class="flex items-center space-x-3 mt-2 text-sm text-gray-600">
                        <span class="px-2 py-1 rounded-full text-xs ${getCategoryColor(news.category)}">${news.category}</span>
                        <span>Por ${news.authorName}</span>
                        <span>${formatDate(news.createdAt)}</span>
                        <span class="px-2 py-1 rounded-full text-xs ${news.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${news.published ? 'Publicado' : 'Borrador'}
                        </span>
                    </div>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>♥ ${news.likesCount || 0}</span>
                        <span>◉ ${news.views || 0}</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="openEditNews('${news._id}')" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                        Editar
                    </button>
                    <button onclick="deleteNews('${news._id}')" class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

document.getElementById('refresh-all-news').addEventListener('click', loadAllNews);

// ===== Edit News =====

async function openEditNews(newsId) {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/news/${newsId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar la noticia');
        }

        const news = await response.json();
        
        document.getElementById('edit-news-id').value = news._id;
        document.getElementById('edit-news-title').value = news.title;
        document.getElementById('edit-news-summary').value = news.summary || '';
        document.getElementById('edit-news-content').value = news.content;
        document.getElementById('edit-news-category').value = news.category;
        document.getElementById('edit-news-image').value = news.imageUrl || '';
        document.getElementById('edit-news-published').checked = news.published;

        editModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading news for edit:', error);
        displayMessage('Error al cargar la noticia', 'error');
    }
}

editNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) return;

    const newsId = document.getElementById('edit-news-id').value;
    const newsData = {
        title: document.getElementById('edit-news-title').value,
        summary: document.getElementById('edit-news-summary').value,
        content: document.getElementById('edit-news-content').value,
        category: document.getElementById('edit-news-category').value,
        imageUrl: document.getElementById('edit-news-image').value || null,
        published: document.getElementById('edit-news-published').checked
    };

    try {
        const response = await fetch(`${API_URL}/news/${newsId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newsData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar la noticia');
        }

        const data = await response.json();
        displayMessage('Noticia actualizada exitosamente', 'success');
        editModal.classList.add('hidden');
        
        // Reload news lists
        loadNews(true);
        if (getUserRole() === 'admin') {
            loadAllNews();
        } else {
            loadMyNews();
        }
        
        // Mostrar mensaje adicional según el estado de publicación
        if (newsData.published) {
            setTimeout(() => {
                displayMessage('La noticia está ahora visible para todos los usuarios', 'info');
            }, 2000);
        }
    } catch (error) {
        console.error('Error updating news:', error);
        displayMessage(error.message, 'error');
    }
});

closeEditModal.addEventListener('click', () => editModal.classList.add('hidden'));
cancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));

// ===== Delete News =====

async function deleteNews(newsId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta noticia?\n\nEsta acción no se puede deshacer y la noticia será eliminada permanentemente.')) {
        return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/news/${newsId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar la noticia');
        }

        const data = await response.json();
        displayMessage('Noticia eliminada exitosamente', 'success');
        
        // Reload news lists
        loadNews(true);
        loadAllNews();
    } catch (error) {
        console.error('Error deleting news:', error);
        displayMessage(error.message, 'error');
    }
}

// Make functions global for inline onclick
window.openEditNews = openEditNews;
window.deleteNews = deleteNews;

// ===== Detail Modal Close =====

closeDetailModal.addEventListener('click', () => detailModal.classList.add('hidden'));
closeDetailModalBtn.addEventListener('click', () => detailModal.classList.add('hidden'));

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadNews(true);
});
