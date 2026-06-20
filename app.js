const categories = [
    {name: 'arriba',   containerId: 'scrollArriba',    images: [], vertical: false},
    {name: 'chaqueta', containerId: 'scrollChaqueta',  images: [], vertical: true},
    {name: 'vestido',  containerId: 'scrollVestidos',  images: [], vertical: false, folderName: 'vestidos'},
    {name: 'abajo',    containerId: 'scrollAbajo',     images: [], vertical: false},
    {name: 'zapatos',  containerId: 'scrollZapatos',   images: [], vertical: false},
    {name: 'bolso',      containerId: 'scrollBolsos',     images: [], vertical: true, sharedFolder: 'bolsos'},
    {name: 'pulseras',   containerId: 'scrollPulseras',   images: [], vertical: false, sharedFolder: 'accesorios/pulseras'},
    {name: 'pendientes', containerId: 'scrollPendientes', images: [], vertical: false, sharedFolder: 'accesorios/pendientes'},
    {name: 'gafas',      containerId: 'scrollGafas',      images: [], vertical: false, sharedFolder: 'accesorios/gafas de sol'},
];

let currentSeason = 'summer';
let manifest = null;

function setSeason(season) {
    currentSeason = season;
    const isWinter = season === 'winter';
    document.getElementById('season-toggle').className = season;
    document.getElementById('sideChaqueta').style.display = isWinter ? '' : 'none';
    document.getElementById('sideBolsos').style.order = isWinter ? '0' : '3';
    init();
}

async function loadManifest() {
    if (manifest) return;
    const res = await fetch('data/items.manifest.json');
    manifest = await res.json();
}

async function loadCategoryImages(category) {
    await loadManifest();
    let fileNames, folder;
    if (category.sharedFolder) {
        fileNames = manifest.shared?.[category.name] ?? [];
        folder = category.sharedFolder;
    } else {
        fileNames = manifest[currentSeason]?.[category.name] ?? [];
        folder = `${currentSeason}/${category.folderName ?? category.name}`;
    }
    category.images = fileNames.map(name => `assets/${folder}/${name}`);
}

function initScrollPosition(container, category) {
    const imgs = container.querySelectorAll('img.category-image');
    if (!imgs.length || !category.images.length) return;
    const repeats = Math.max(3, Math.ceil(40 / category.images.length));
    const mid = Math.floor(repeats / 2);
    const target = imgs[mid * category.images.length] || imgs[Math.floor(imgs.length / 2)];
    if (!target) return;
    const cr = container.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    if (category.vertical) {
        container.scrollTop += (tr.top + tr.height / 2) - (cr.top + cr.height / 2);
    } else {
        container.scrollLeft += (tr.left + tr.width / 2) - (cr.left + cr.width / 2);
    }
}

function updateActiveImage(container) {
    const imgs = container.querySelectorAll('img.category-image');
    const containerRect = container.getBoundingClientRect();
    const center = containerRect.left + containerRect.width / 2;
    let closest = null, closestDist = Infinity;
    imgs.forEach(img => {
        const rect = img.getBoundingClientRect();
        const dist = Math.abs((rect.left + rect.width / 2) - center);
        if (dist < closestDist) { closestDist = dist; closest = img; }
    });
    imgs.forEach(img => img.classList.remove('active'));
    if (closest) closest.classList.add('active');
}

function updateActiveImageVertical(container) {
    const imgs = container.querySelectorAll('img.category-image');
    const containerRect = container.getBoundingClientRect();
    const center = containerRect.top + containerRect.height / 2;
    let closest = null, closestDist = Infinity;
    imgs.forEach(img => {
        const rect = img.getBoundingClientRect();
        const dist = Math.abs((rect.top + rect.height / 2) - center);
        if (dist < closestDist) { closestDist = dist; closest = img; }
    });
    imgs.forEach(img => img.classList.remove('active'));
    if (closest) closest.classList.add('active');
}

function handleInfiniteScroll(container, vertical) {
    if (vertical) {
        const third = container.scrollHeight / 3;
        if (container.scrollTop < third * 0.5)
            container.scrollTop += third;
        else if (container.scrollTop > third * 2)
            container.scrollTop -= third;
    } else {
        const third = container.scrollWidth / 3;
        if (container.scrollLeft < third * 0.5)
            container.scrollLeft += third;
        else if (container.scrollLeft > third * 2)
            container.scrollLeft -= third;
    }
}

function buildCarousel(category) {
    const container = document.getElementById(category.containerId);
    container.innerHTML = '';
    if(category.images.length === 0) return;
    const repeats = Math.max(3, Math.ceil(40 / category.images.length));
    for(let repeat = 0; repeat < repeats; repeat++) {
        category.images.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = url;
            img.draggable = false;
            img.classList.add('category-image');
            img.dataset.category = category.name;
            img.addEventListener('click', () => {
                const cr = container.getBoundingClientRect();
                const ir = img.getBoundingClientRect();
                if (category.vertical) {
                    const offset = ir.top - cr.top - (cr.height - ir.height) / 2;
                    container.scrollBy({ top: offset, behavior: 'smooth' });
                } else {
                    container.scrollLeft += (ir.left + ir.width / 2) - (cr.left + cr.width / 2);
                    updateActiveImage(container);
                }
            });
            container.appendChild(img);
        });
    }
}

function playRandom() {
    categories.forEach(cat => {
        if (cat.images.length === 0) return;
        const container = document.getElementById(cat.containerId);
        const imgs = container.querySelectorAll('img.category-image');
        if (imgs.length === 0) return;

        const repeats = Math.max(3, Math.ceil(40 / cat.images.length));
        const mid = Math.floor(repeats / 2);
        const pick = Math.floor(Math.random() * cat.images.length);
        const target = imgs[mid * cat.images.length + pick];
        if (!target) return;

        if (cat.vertical) {
            const offset = target.offsetTop - (container.clientHeight - target.clientHeight) / 2;
            container.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
            const cr = container.getBoundingClientRect();
            const tr = target.getBoundingClientRect();
            container.scrollLeft += (tr.left + tr.width / 2) - (cr.left + cr.width / 2);
            updateActiveImage(container);
        }
    });
}

function setupCenterTouchScroll() {
    ['scrollArriba', 'scrollAbajo', 'scrollZapatos', 'scrollVestidos'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        if (container.dataset.touchScrollReady === 'true') return;
        container.dataset.touchScrollReady = 'true';
        const category = categories.find(cat => cat.containerId === id);
        let startX = 0, startY = 0, startLeft = 0, isHorizontal = null;
        let settleTimer = null;

        const snapToClosest = () => {
            container.classList.remove('is-dragging');
            const cr = container.getBoundingClientRect();
            const cx = cr.left + cr.width / 2;
            const imgs = container.querySelectorAll('img.category-image');
            let closest = null, closestDist = Infinity;
            imgs.forEach(img => {
                const r = img.getBoundingClientRect();
                const d = Math.abs((r.left + r.width / 2) - cx);
                if (d < closestDist) { closestDist = d; closest = img; }
            });
            if (closest) {
                const r = closest.getBoundingClientRect();
                container.scrollBy({
                    left: (r.left + r.width / 2) - cx,
                    behavior: 'smooth'
                });
                updateActiveImage(container);
            }
        };

        const settle = () => {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(snapToClosest, 80);
        };

        container.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLeft = container.scrollLeft;
            isHorizontal = null;
            clearTimeout(settleTimer);
        }, { passive: true });

        container.addEventListener('touchmove', e => {
            if (e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            if (isHorizontal === null) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                isHorizontal = Math.abs(dx) >= Math.abs(dy);
            }

            if (!isHorizontal) return;
            e.preventDefault();
            container.classList.add('is-dragging');
            container.scrollLeft = startLeft - dx;

            if (category) {
                const third = container.scrollWidth / 3;
                if (container.scrollLeft < third * 0.5) {
                    container.scrollLeft += third;
                    startLeft += third;
                } else if (container.scrollLeft > third * 2) {
                    container.scrollLeft -= third;
                    startLeft -= third;
                }
            }

            updateActiveImage(container);
        }, { passive: false });

        container.addEventListener('touchend', settle, { passive: true });
        container.addEventListener('touchcancel', settle, { passive: true });
    });
}

function setOutfitMode(mode) {
    const isSeparado = mode === 'separado';
    document.getElementById('wrapperArriba').style.display = isSeparado ? '' : 'none';
    document.getElementById('wrapperAbajo').style.display = isSeparado ? '' : 'none';
    document.getElementById('wrapperVestidos').style.display = isSeparado ? 'none' : '';
    document.getElementById('outfit-toggle').className = mode;
    if (isSeparado) {
        requestAnimationFrame(() => {
            ['scrollArriba', 'scrollAbajo'].forEach(id => {
                const c = document.getElementById(id);
                const cat = categories.find(ct => ct.containerId === id);
                if (cat) initScrollPosition(c, cat);
                updateActiveImage(c);
            });
        });
    } else {
        const container = document.getElementById('scrollVestidos');
        const cat = categories.find(ct => ct.containerId === 'scrollVestidos');
        requestAnimationFrame(() => {
            if (cat) initScrollPosition(container, cat);
            updateActiveImage(container);
        });
    }
}

async function init() {
    document.getElementById('btnSummer').onclick = () => setSeason('summer');
    document.getElementById('btnWinter').onclick = () => setSeason('winter');
    document.getElementById('btnSeparado').onclick = () => setOutfitMode('separado');
    document.getElementById('btnVestido').onclick = () => setOutfitMode('vestido');
    document.getElementById('btnRandom').onclick = playRandom;

    // Build all carousels first
    for(const cat of categories) {
        await loadCategoryImages(cat);
        buildCarousel(cat);
        const container = document.getElementById(cat.containerId);
        container.onscroll = () => {
            handleInfiniteScroll(container, cat.vertical);
            if(cat.vertical) updateActiveImageVertical(container);
            else updateActiveImage(container);
        };
    }

    // Wait for layout to be computed before setting scroll positions
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    for(const cat of categories) {
        const container = document.getElementById(cat.containerId);
        initScrollPosition(container, cat);
        if(cat.vertical) updateActiveImageVertical(container);
        else updateActiveImage(container);
    }

    setupCenterTouchScroll();
}

window.onload = init;
