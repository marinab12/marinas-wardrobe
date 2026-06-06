const categories = [
    {name: 'arriba',   containerId: 'scrollArriba',    images: [], vertical: false},
    {name: 'chaqueta', containerId: 'scrollChaqueta',  images: [], vertical: true},
    {name: 'vestido',  containerId: 'scrollVestidos',  images: [], vertical: false, folderName: 'vestidos'},
    {name: 'abajo',    containerId: 'scrollAbajo',     images: [], vertical: false},
    {name: 'zapatos',  containerId: 'scrollZapatos',   images: [], vertical: false},
    {name: 'bolso',    containerId: 'scrollBolsos',    images: [], vertical: true,  sharedFolder: 'bolsos'},
    {name: 'accesorio',containerId: 'scrollAccesorio', images: [], vertical: true, folderName: 'accesorios'},
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
    if (category.vertical) {
        const pos = target.offsetTop - (container.clientHeight - target.clientHeight) / 2;
        container.scrollTo({ top: Math.max(0, pos), behavior: 'instant' });
    } else {
        const pos = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
        container.scrollTo({ left: Math.max(0, pos), behavior: 'instant' });
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
            container.scrollTo({ top: container.scrollTop + third, behavior: 'instant' });
        else if (container.scrollTop > third * 2)
            container.scrollTo({ top: container.scrollTop - third, behavior: 'instant' });
    } else {
        const third = container.scrollWidth / 3;
        if (container.scrollLeft < third * 0.5)
            container.scrollTo({ left: container.scrollLeft + third, behavior: 'instant' });
        else if (container.scrollLeft > third * 2)
            container.scrollTo({ left: container.scrollLeft - third, behavior: 'instant' });
    }
}

function addTouchScroll(container, vertical) {
    let startX = 0, startY = 0, startScroll = 0, tracking = false, axis = null;

    container.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startScroll = vertical ? container.scrollTop : container.scrollLeft;
        tracking = true;
        axis = null;
    }, { passive: true });

    container.addEventListener('touchmove', e => {
        if (!tracking) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        // determine axis on first significant move
        if (!axis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            axis = (vertical ? Math.abs(dy) > Math.abs(dx) : Math.abs(dx) > Math.abs(dy))
                ? 'main' : 'cross';
        }
        if (axis !== 'main') return;

        e.preventDefault();
        if (vertical) container.scrollTop = startScroll - dy;
        else container.scrollLeft = startScroll - dx;
    }, { passive: false });

    container.addEventListener('touchend', () => {
        if (!tracking || axis !== 'main') { tracking = false; return; }
        tracking = false;
        const imgs = container.querySelectorAll('img.category-image');
        if (!imgs.length) return;
        const imgSize = vertical ? imgs[0].offsetHeight : imgs[0].offsetWidth + 10;
        const scroll = vertical ? container.scrollTop : container.scrollLeft;
        const nearest = Math.round(scroll / imgSize) * imgSize;
        if (vertical) container.scrollTo({ top: nearest, behavior: 'smooth' });
        else container.scrollTo({ left: nearest, behavior: 'smooth' });
    }, { passive: true });
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
            img.classList.add('category-image');
            img.dataset.category = category.name;
            img.addEventListener('click', () => {
                const containerRect = container.getBoundingClientRect();
                const imgRect = img.getBoundingClientRect();
                if (category.vertical) {
                    const offset = imgRect.top - containerRect.top - (containerRect.height - imgRect.height) / 2;
                    container.scrollBy({ top: offset, behavior: 'smooth' });
                } else {
                    const offset = imgRect.left - containerRect.left - (containerRect.width - imgRect.width) / 2;
                    container.scrollBy({ left: offset, behavior: 'smooth' });
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
            const offset = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
            container.scrollTo({ left: offset, behavior: 'smooth' });
        }
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
        addTouchScroll(container, cat.vertical);
        container.addEventListener('scroll', () => {
            handleInfiniteScroll(container, cat.vertical);
            if(cat.vertical) updateActiveImageVertical(container);
            else updateActiveImage(container);
        });
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
}

window.onload = init;