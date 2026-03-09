// ===== UNIVERSAL AUTO SYSTEM =====

const config = {
    folderName: 'articles',      
    itemsPerPage: 15,            
    authorName: 'Prof. James Wilson',
    authorTitle: 'PhD, Senior Tech Editor',
    defaultAuthorImg: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80',
    authorProfileLink: 'author-prof-james.html'
};

let allArticles = [];
let currentPage = 1;
let currentFilter = 'all'; 

const isArticlePage = window.location.pathname.includes(`/${config.folderName}/`);
const basePath = isArticlePage ? '' : `${config.folderName}/`; 
const linkPrefix = isArticlePage ? '' : `${config.folderName}/`; 
const rootPrefix = isArticlePage ? '../' : ''; 

// ===== STYLES INJECTION =====
const style = document.createElement('style');
style.innerHTML = `
.sidebar-card{display:flex;gap:12px;align-items:start;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:15px}
.sidebar-card:last-child{border-bottom:none}
.sidebar-img{width:80px;height:60px;flex-shrink:0;border-radius:4px;overflow:hidden;background:#ddd}
.sidebar-img img{width:100%;height:100%;object-fit:cover}
.sidebar-info{display:flex;flex-direction:column}
.sidebar-info a{color:#fff;font-size:.9rem;font-weight:500;line-height:1.4;margin-bottom:5px;text-decoration:none}
.sidebar-info a:hover{text-decoration:underline;color:#4a6cf7}
.sidebar-date{font-size:.75rem;color:rgba(255,255,255,0.7)}
.mini-avatar{width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;border:1px solid #ddd}
.author-link{cursor:pointer;transition:color .2s;text-decoration:none;color:inherit;font-weight:600}
.author-link:hover{color:#4a6cf7}
.verified-tick{color:#1da1f2;margin-left:4px;font-size:.8em}
.card-author-img{width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:8px;border:1px solid #ddd}
`;
document.head.appendChild(style);

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    highlightActiveMenu();
    updateInnerArticleDate();
    
    await loadArticlesFast(); 
    
    // Render articles for different pages
    const homeContainer = document.getElementById('articles-container');
    if (homeContainer) { currentFilter = 'all'; renderArticles(homeContainer, 'all'); }
    
    const techNewsContainer = document.getElementById('tech-news-page-container');
    if (techNewsContainer) { currentFilter = 'Tech News'; renderArticles(techNewsContainer, 'Tech News'); }
    
    const aiMLContainer = document.getElementById('ai-ml-page-container');
    if (aiMLContainer) { currentFilter = 'AI & ML'; renderArticles(aiMLContainer, 'AI & ML'); }
    
    const programmingContainer = document.getElementById('programming-page-container');
    if (programmingContainer) { currentFilter = 'Programming'; renderArticles(programmingContainer, 'Programming'); }
    
    const webDevContainer = document.getElementById('web-dev-page-container');
    if (webDevContainer) { currentFilter = 'Web Dev'; renderArticles(webDevContainer, 'Web Dev'); }

    const sidebar = document.getElementById('sidebar-articles');
    if (sidebar) updateSidebar(sidebar);
    
    updateAlsoRead();
    injectHeaderAuthorPic(); 
    initCommentSystem();
    injectNotificationBell();
    setupCopyLinkButtons();
    initLiveSearchSystem(); 
    initTopBarFeatures(); 
    
    setTimeout(initNotificationPopup, 4500);
});

// ===== TOP BAR FEATURES =====
function initTopBarFeatures() {
    const dateDisplay = document.getElementById('current-date-display');
    if(dateDisplay) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        dateDisplay.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('en-US', options)}`;
    }

    const tickerContainer = document.getElementById('hot-news-ticker');
    if(tickerContainer && allArticles.length > 0) {
        const latestNews = allArticles.slice(0, 5);
        tickerContainer.innerHTML = latestNews.map(art => 
            `<a href="${linkPrefix}${art.filename}"><i class="fas fa-code" style="color:#4a6cf7; margin-right:5px;"></i>${art.title}</a>`
        ).join('');
    }

    // Dark Mode Toggle - FIXED VERSION
    const darkBtn = document.getElementById('dark-mode-toggle');
    if(darkBtn) {
        // Check initial theme
        if(localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkBtn.innerHTML = '<i class="fas fa-sun" style="color:#ffcc00;"></i>';
        } else {
            darkBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // Toggle on click
        darkBtn.addEventListener('click', () => {
            if(document.documentElement.getAttribute('data-theme') === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                darkBtn.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                darkBtn.innerHTML = '<i class="fas fa-sun" style="color:#ffcc00;"></i>';
            }
        });
    }
}

// ===== GET TODAY DATE =====
function getTodayDate() {
    const d = new Date();
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
}

// ===== UPDATE INNER ARTICLE DATE =====
function updateInnerArticleDate() {
    if (isArticlePage) {
        const dateElement = document.querySelector('.publish-date .date');
        if (dateElement) dateElement.innerText = getTodayDate();
    }
}

// ===== LOAD ARTICLES =====
async function loadArticlesFast() {
    try {
        const response = await fetch(basePath + 'data.json?v=' + new Date().getTime());
        if (response.ok) {
            allArticles = await response.json();
            allArticles.sort((a, b) => b.id - a.id); 
        }
    } catch (e) {
        console.error("Error loading articles:", e);
    }
}

// ===== RENDER ARTICLES =====
function renderArticles(container, filter) {
    container.innerHTML = '';
    let displayList = allArticles;
    if (filter !== 'all') displayList = allArticles.filter(art => art.category.includes(filter));
    
    const totalItems = displayList.length;
    const totalPages = Math.ceil(totalItems / config.itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * config.itemsPerPage;
    const end = start + config.itemsPerPage;
    const paginatedItems = displayList.slice(start, end);

    if (paginatedItems.length === 0) { 
        container.innerHTML = '<div style="padding:40px; text-align:center; grid-column:1/-1;"><h3>No articles found</h3></div>'; 
        return; 
    }

    const articlesHTML = paginatedItems.map(art => {
        let imgSrc = art.image.startsWith('http') ? art.image : `${linkPrefix}${art.image}`;
        return `
            <article class="news-card">
                <div class="article-image" onclick="window.location.href='${linkPrefix}${art.filename}'" style="cursor:pointer">
                    <img src="${imgSrc}" alt="${art.title}" loading="lazy">
                </div>
                <div class="news-content">
                    <span class="article-category">${art.category}</span>
                    <h3 class="news-title" onclick="window.location.href='${linkPrefix}${art.filename}'" style="cursor:pointer">${art.title}</h3>
                    <p class="news-excerpt">${art.excerpt || 'Click here to read the full tech guide...'}</p>
                    <div class="news-meta">
                        <a href="${rootPrefix}${config.authorProfileLink}" style="display:flex; align-items:center; gap:5px; text-decoration:none; color:inherit;" class="author-hover">
                            <img src="${art.authorImg || config.defaultAuthorImg}" class="card-author-img" alt="${art.author}" loading="lazy">
                            <span class="author-link">${art.author || config.authorName} <i class="fas fa-check-circle verified-tick"></i></span>
                        </a>
                        <span class="separator">|</span>
                        <span class="date">${art.date || getTodayDate()}</span>
                    </div>
                </div>
            </article>`;
    }).join('');

    container.innerHTML = articlesHTML;
    if (totalPages > 1) renderPaginationControls(container, totalPages);
}

// ===== PAGINATION =====
function renderPaginationControls(container, totalPages) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    
    if (currentPage > 1) {
        paginationDiv.appendChild(createPageBtn('< Prev', () => changePage(currentPage - 1, container)));
    }
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = createPageBtn(i, () => changePage(i, container));
        if (i === currentPage) btn.classList.add('active');
        paginationDiv.appendChild(btn);
    }
    
    if (currentPage < totalPages) {
        paginationDiv.appendChild(createPageBtn('Next >', () => changePage(currentPage + 1, container)));
    }
    
    container.appendChild(paginationDiv);
}

function createPageBtn(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.innerText = text;
    btn.onclick = onClick;
    return btn;
}

function changePage(newPage, container) {
    currentPage = newPage;
    renderArticles(container, currentFilter);
    const yOffset = -100; 
    const y = container.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({top: y, behavior: 'smooth'});
}

// ===== LIVE SEARCH =====
function initLiveSearchSystem() {
    const overlay = document.createElement('div');
    overlay.id = 'search-full-overlay';
    overlay.innerHTML = `
        <div class="search-modal">
            <div class="search-header">
                <i class="fas fa-search" style="color:#4a6cf7"></i>
                <input type="text" id="main-search-input" placeholder="Search tech articles...">
                <i class="fas fa-times close-search-btn"></i>
            </div>
            <div id="search-results-list"></div>
        </div>`;
    document.body.appendChild(overlay);

    const searchTrigger = document.querySelector('.search-icon') || document.querySelector('.fa-search');
    const searchInput = document.getElementById('main-search-input');
    const resultsList = document.getElementById('search-results-list');
    const closeBtn = document.querySelector('.close-search-btn');

    if(searchTrigger) {
        searchTrigger.addEventListener('click', (e) => { 
            e.preventDefault(); 
            overlay.style.display = 'flex'; 
            searchInput.focus(); 
        });
    }

    const closeAction = () => { 
        overlay.style.display = 'none'; 
        searchInput.value = ''; 
        resultsList.innerHTML = ''; 
    };
    
    closeBtn.onclick = closeAction;
    overlay.onclick = (e) => { if(e.target === overlay) closeAction(); };

    searchInput.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        resultsList.innerHTML = '';
        if(val.length < 1) return;

        const filtered = allArticles.filter(a => 
            a.title.toLowerCase().includes(val) || 
            a.category.toLowerCase().includes(val)
        );
        
        if(filtered.length === 0) { 
            resultsList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No results found.</p>'; 
            return; 
        }

        resultsList.innerHTML = filtered.map(art => {
            let imgSrc = art.image.startsWith('http') ? art.image : `${linkPrefix}${art.image}`;
            return `
            <div class="search-result-item" onclick="window.location.href='${linkPrefix}${art.filename}'">
                <img src="${imgSrc}" loading="lazy" alt="Thumbnail">
                <div class="search-result-info">
                    <h4>${art.title}</h4>
                    <p>${art.category} • ${art.date || getTodayDate()}</p>
                </div>
            </div>`;
        }).join('');
    });
}

// ===== UPDATE SIDEBAR =====
function updateSidebar(sidebar) {
    sidebar.innerHTML = '';
    const currentFile = window.location.pathname.split('/').pop();
    const recent = allArticles.filter(art => art.filename !== currentFile).slice(0, 5);
    
    if (recent.length === 0) { 
        sidebar.innerHTML = '<p style="color:rgba(255,255,255,0.7); padding:10px;">More articles coming soon.</p>'; 
        return; 
    }
    
    sidebar.innerHTML = recent.map(art => {
        let imgSrc = art.image.startsWith('http') ? art.image : `${linkPrefix}${art.image}`;
        return `
        <div class="sidebar-card">
            <div class="sidebar-img"><img src="${imgSrc}" loading="lazy" alt="Thumbnail"></div>
            <div class="sidebar-info">
                <a href="${linkPrefix}${art.filename}">${art.title}</a>
                <span class="sidebar-date"><i class="far fa-clock"></i> ${art.date || getTodayDate()}</span>
            </div>
        </div>`;
    }).join('');
}

// ===== NOTIFICATION POPUP =====
function initNotificationPopup() {
    if (localStorage.getItem('notify_status')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'notify-popup-overlay';
    overlay.innerHTML = `
        <div class="notify-popup">
            <div class="notify-icon"><i class="fas fa-bell"></i></div>
            <h3>Get Tech Learning Updates</h3>
            <p>Never miss a tech tutorial! Allow notifications for daily learning tips.</p>
            <div class="notify-btns">
                <button class="btn-deny">Not Now</button>
                <button class="btn-allow">Allow</button>
            </div>
        </div>`;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.btn-deny').onclick = () => { 
        localStorage.setItem('notify_status', 'denied'); 
        overlay.remove(); 
    };
    
    overlay.querySelector('.btn-allow').onclick = () => {
        localStorage.setItem('notify_status', 'allowed');
        localStorage.setItem('site_subscribed', 'true');
        overlay.remove();
        alert("Thanks for subscribing!");
    };
}

// ===== NOTIFICATION BELL =====
function injectNotificationBell() {
    const isSubscribed = localStorage.getItem('site_subscribed');
    const bell = document.createElement('div');
    bell.className = 'notification-bell';
    bell.setAttribute('aria-label', 'Toggle Notifications');
    bell.innerHTML = '<i class="fas fa-bell"></i>' + 
        (!isSubscribed ? '<div class="badge"></div>' : '');
    
    const toast = document.createElement('div'); 
    toast.className = 'sub-toast';
    
    document.body.append(toast, bell);

    bell.addEventListener('click', () => {
        if(!localStorage.getItem('site_subscribed')) {
            localStorage.setItem('site_subscribed', 'true');
            localStorage.setItem('notify_status', 'allowed');
            bell.querySelector('.badge')?.remove();
            toast.innerText = "Notifications turned on! 💻";
        } else {
            toast.innerText = "Already subscribed! ✅";
        }
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    });
}

// ===== COPY LINK =====
function setupCopyLinkButtons() {
    document.body.addEventListener('click', function(e) {
        if (e.target.closest('.btn-copy')) {
            e.preventDefault();
            navigator.clipboard.writeText(window.location.href);
            alert("Link Copied!");
        }
    });
}

// ===== AUTHOR HEADER =====
function injectHeaderAuthorPic() {
    if (!isArticlePage) return;
    
    const headerImg = document.getElementById('header-author-img');
    const headerName = document.getElementById('header-author-name');
    
    if (headerImg) {
        headerImg.src = config.defaultAuthorImg;
        headerImg.style.cursor = 'pointer';
        headerImg.onclick = () => window.location.href = `${rootPrefix}${config.authorProfileLink}`;
    }
    
    if (headerName) {
        headerName.innerHTML = `<a href="${rootPrefix}${config.authorProfileLink}" style="color:inherit; text-decoration:none;">${config.authorName}</a> <i class="fas fa-check-circle verified-tick"></i>`;
    }
}

// ===== ALSO READ =====
function updateAlsoRead() {
    const boxes = document.querySelectorAll('.also-read');
    if (boxes.length === 0) return;
    
    const currentFile = window.location.pathname.split('/').pop();
    const recommendations = allArticles.filter(a => a.filename !== currentFile);
    
    boxes.forEach((box, index) => {
        if (index < recommendations.length) {
            const art = recommendations[index];
            box.innerHTML = `<h3><i class="fas fa-book-reader"></i> Also Read</h3><a href="${linkPrefix}${art.filename}">${art.title}</a>`;
        }
    });
}

// ===== HIGHLIGHT ACTIVE MENU =====
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').split('/').pop() === currentPage) {
            link.classList.add('active');
        }
    });
}

// ===== COMMENTS SYSTEM =====
function initCommentSystem() {
    const commentForm = document.getElementById('comment-form');
    if (!commentForm) return;
    
    loadComments();
    
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('comment-name').value;
        const msg = document.getElementById('comment-msg').value;
        
        const newComment = { 
            name, 
            date: getTodayDate(), 
            text: msg 
        };
        
        const articleKey = 'comments_' + window.location.pathname.split('/').pop();
        let savedComments = JSON.parse(localStorage.getItem(articleKey)) || [];
        savedComments.push(newComment);
        localStorage.setItem(articleKey, JSON.stringify(savedComments));
        
        renderSingleComment(newComment);
        commentForm.reset();
    });
}

function loadComments() {
    const articleKey = 'comments_' + window.location.pathname.split('/').pop();
    const savedComments = JSON.parse(localStorage.getItem(articleKey)) || [];
    savedComments.forEach(comment => renderSingleComment(comment));
}

function renderSingleComment(comment) {
    const displayArea = document.getElementById('comments-display-area');
    if(!displayArea) return;
    
    const html = `<div class="single-comment" style="display:flex; gap:15px; margin-bottom:20px; background:#f9f9f9; padding:15px; border-radius:8px;">
        <div style="width:40px; height:40px; background:#ddd; border-radius:50%; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-user"></i>
        </div>
        <div>
            <div style="font-weight:bold;">${comment.name} <span style="font-size:0.8rem; color:#888; font-weight:normal; margin-left:10px;">${comment.date}</span></div>
            <p style="margin-top:5px; font-size:0.95rem;">${comment.text}</p>
        </div>
    </div>`;
    
    displayArea.insertAdjacentHTML('beforeend', html);
}

// ===== SCROLL TO TOP =====
document.addEventListener('DOMContentLoaded', () => {
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.id = 'scroll-to-top';
    scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollTopBtn.title = "Go to top";
    scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollTopBtn);

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const progress = document.getElementById('reading-progress');
                if (progress) {
                    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const scrolled = (winScroll / height) * 100;
                    progress.style.width = scrolled + "%";
                }

                if (window.scrollY > 300) {
                    scrollTopBtn.classList.add('show');
                } else {
                    scrollTopBtn.classList.remove('show');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
});