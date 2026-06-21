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
const centerContainerIds = new Set(['scrollArriba', 'scrollAbajo', 'scrollZapatos', 'scrollVestidos']);

function isCenterCategory(category) {
    return centerContainerIds.has(category.containerId);
}

function repeatCount(category) {
    return Math.max(3, Math.ceil(40 / category.images.length));
}

function centerCopyIndex(category, itemIndex) {
    const repeats = repeatCount(category);
    return Math.floor(repeats / 2) * category.images.length + itemIndex;
}

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
    const res = await fetch('data/items.manifest.json?v=items-3');
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
    if (isCenterCategory(category)) {
        const repeats = repeatCount(category);
        setCenterCarouselIndex(category, Math.floor(repeats / 2) * category.images.length, false);
        return;
    }

    const imgs = container.querySelectorAll('img.category-image');
    if (!imgs.length || !category.images.length) return;
    const repeats = repeatCount(category);
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

function setCenterCarouselIndex(category, index, animate = true, normalize = true) {
    if (!category.images.length) return;
    const container = document.getElementById(category.containerId);
    const track = container.querySelector('.carousel-track');
    if (!track) return;

    const repeats = repeatCount(category);
    const total = repeats * category.images.length;
    const normalizedItem = ((index % category.images.length) + category.images.length) % category.images.length;
    if (normalize && (index < category.images.length || index >= total - category.images.length)) {
        index = centerCopyIndex(category, normalizedItem);
    }

    const target = track.querySelector(`[data-index="${index}"]`);
    if (!target) return;

    const offset = (container.clientWidth / 2) - (target.offsetLeft + target.offsetWidth / 2);
    track.style.transition = animate ? 'transform 0.28s ease' : 'none';
    track.style.transform = `translate3d(${offset}px, 0, 0)`;

    category.activeIndex = index;
    category.trackOffset = offset;
    updateActiveImage(container);

    if (!animate) {
        requestAnimationFrame(() => {
            track.style.transition = 'transform 0.28s ease';
            updateActiveImage(container);
        });
    } else {
        window.setTimeout(() => updateActiveImage(container), 300);
    }
}

function moveCenterCarouselBy(category, delta) {
    if (!category?.images.length || !delta) return;
    const currentItem = ((category.activeIndex || 0) % category.images.length + category.images.length) % category.images.length;

    if (delta > 0 && currentItem === category.images.length - 1) {
        setCenterCarouselIndex(category, centerCopyIndex(category, currentItem), false);
        requestAnimationFrame(() => {
            setCenterCarouselIndex(category, centerCopyIndex(category, currentItem) + 1, true, false);
            window.setTimeout(() => setCenterCarouselIndex(category, centerCopyIndex(category, 0), false), 320);
        });
        return;
    }

    if (delta < 0 && currentItem === 0) {
        setCenterCarouselIndex(category, centerCopyIndex(category, currentItem), false);
        requestAnimationFrame(() => {
            setCenterCarouselIndex(category, centerCopyIndex(category, currentItem) - 1, true, false);
            window.setTimeout(() => setCenterCarouselIndex(category, centerCopyIndex(category, category.images.length - 1), false), 320);
        });
        return;
    }

    setCenterCarouselIndex(category, (category.activeIndex || 0) + delta);
}

function centerCarouselStepSize(category) {
    const container = document.getElementById(category.containerId);
    const imgs = container?.querySelectorAll('img.category-image');
    if (!imgs?.length) return 90;
    if (imgs.length > 1) return Math.abs(imgs[1].offsetLeft - imgs[0].offsetLeft) || imgs[0].offsetWidth;
    return imgs[0].offsetWidth;
}

function dragDeltaToSteps(category, deltaX) {
    const distance = Math.abs(deltaX);
    if (distance <= 28) return 0;
    return Math.max(1, Math.round(distance / centerCarouselStepSize(category)));
}

function centerClickedItem(category, target) {
    const img = target?.closest?.('img.category-image');
    if (!category || !img?.dataset.index) return false;
    setCenterCarouselIndex(category, Number(img.dataset.index));
    return true;
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
    const repeats = repeatCount(category);
    const parent = isCenterCategory(category) ? document.createElement('div') : container;

    if (isCenterCategory(category)) {
        parent.className = 'carousel-track';
        container.appendChild(parent);
    }

    for(let repeat = 0; repeat < repeats; repeat++) {
        category.images.forEach((url, itemIndex) => {
            const absoluteIndex = repeat * category.images.length + itemIndex;
            const img = document.createElement('img');
            img.src = url;
            img.alt = url;
            img.draggable = false;
            img.classList.add('category-image');
            img.dataset.category = category.name;
            img.dataset.index = absoluteIndex;
            img.addEventListener('click', () => {
                if (isCenterCategory(category)) {
                    setCenterCarouselIndex(category, absoluteIndex);
                    return;
                }

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
            parent.appendChild(img);
        });
    }
}

function playRandom() {
    categories.forEach(cat => {
        if (cat.images.length === 0) return;
        const container = document.getElementById(cat.containerId);
        const imgs = container.querySelectorAll('img.category-image');
        if (imgs.length === 0) return;

        const repeats = repeatCount(cat);
        const mid = Math.floor(repeats / 2);
        const pick = Math.floor(Math.random() * cat.images.length);
        const target = imgs[mid * cat.images.length + pick];
        if (!target) return;

        if (isCenterCategory(cat)) {
            setCenterCarouselIndex(cat, mid * cat.images.length + pick);
            return;
        }

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
        let startX = 0, startY = 0, isHorizontal = null;
        let pointerStartX = 0, pointerStartY = 0, pointerDragging = false;
        let wheelTimer = null;

        container.addEventListener('wheel', e => {
            if (!category) return;
            const dominantDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(dominantDelta) < 8) return;
            e.preventDefault();
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(() => {
                moveCenterCarouselBy(category, dominantDelta > 0 ? 1 : -1);
            }, 35);
        }, { passive: false });

        container.addEventListener('pointerdown', e => {
            if (e.pointerType === 'touch') return;
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
            pointerDragging = true;
            container.classList.add('is-dragging');
            container.setPointerCapture?.(e.pointerId);
        });

        container.addEventListener('pointermove', e => {
            if (!pointerDragging || e.pointerType === 'touch') return;
            const track = container.querySelector('.carousel-track');
            if (!track || !category) return;
            const dx = e.clientX - pointerStartX;
            const dy = e.clientY - pointerStartY;
            if (Math.abs(dx) < Math.abs(dy)) return;
            e.preventDefault();
            track.style.transition = 'none';
            track.style.transform = `translate3d(${(category.trackOffset || 0) + dx}px, 0, 0)`;
        });

        container.addEventListener('pointerup', e => {
            if (!pointerDragging || e.pointerType === 'touch') return;
            pointerDragging = false;
            container.classList.remove('is-dragging');
            const dx = e.clientX - pointerStartX;
            const steps = dragDeltaToSteps(category, dx);
            if (steps === 0) centerClickedItem(category, e.target);
            else moveCenterCarouselBy(category, dx < 0 ? steps : -steps);
            container.releasePointerCapture?.(e.pointerId);
        });

        container.addEventListener('pointercancel', e => {
            if (!pointerDragging || e.pointerType === 'touch') return;
            pointerDragging = false;
            container.classList.remove('is-dragging');
            setCenterCarouselIndex(category, category.activeIndex || 0);
            container.releasePointerCapture?.(e.pointerId);
        });

        container.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHorizontal = null;
        }, { passive: true });

        container.addEventListener('touchmove', e => {
            const track = container.querySelector('.carousel-track');
            if (!track || !category) return;
            if (e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            if (isHorizontal === null) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                isHorizontal = Math.abs(dx) >= Math.abs(dy);
            }

            if (!isHorizontal) return;
            e.preventDefault();
            track.style.transition = 'none';
            track.style.transform = `translate3d(${(category.trackOffset || 0) + dx}px, 0, 0)`;
        }, { passive: false });

        container.addEventListener('touchend', e => {
            if (!category) return;
            const dx = e.changedTouches[0].clientX - startX;
            const steps = dragDeltaToSteps(category, dx);
            if (isHorizontal === true && steps !== 0) {
                moveCenterCarouselBy(category, dx < 0 ? steps : -steps);
                return;
            }

            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            centerClickedItem(category, target);
        }, { passive: true });

        container.addEventListener('touchcancel', () => {
            if (category) setCenterCarouselIndex(category, category.activeIndex || 0);
        }, { passive: true });
    });
}

function setupAccessoryTouchScroll() {
    ['scrollPulseras', 'scrollPendientes', 'scrollGafas'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        if (container.dataset.accessoryTouchReady === 'true') return;
        container.dataset.accessoryTouchReady = 'true';

        let startX = 0, startY = 0, startLeft = 0, isHorizontal = null;

        container.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLeft = container.scrollLeft;
            isHorizontal = null;
        }, { passive: true });

        container.addEventListener('touchmove', e => {
            if (e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            if (isHorizontal === null) {
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
                isHorizontal = Math.abs(dx) >= Math.abs(dy);
            }

            if (!isHorizontal) return;
            e.preventDefault();
            container.scrollLeft = startLeft - dx;
            handleInfiniteScroll(container, false);
            updateActiveImage(container);
        }, { passive: false });

        container.addEventListener('touchend', () => {
            if (isHorizontal === true) updateActiveImage(container);
        }, { passive: true });
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
            });
        });
    } else {
        const container = document.getElementById('scrollVestidos');
        const cat = categories.find(ct => ct.containerId === 'scrollVestidos');
        requestAnimationFrame(() => {
            if (cat) initScrollPosition(container, cat);
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
        if (!isCenterCategory(cat)) {
            container.onscroll = () => {
                handleInfiniteScroll(container, cat.vertical);
                if(cat.vertical) updateActiveImageVertical(container);
                else updateActiveImage(container);
            };
        }
    }

    // Wait for layout to be computed before setting scroll positions
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    for(const cat of categories) {
        const container = document.getElementById(cat.containerId);
        initScrollPosition(container, cat);
        if(cat.vertical) updateActiveImageVertical(container);
        else if (!isCenterCategory(cat)) updateActiveImage(container);
    }

    setupCenterTouchScroll();
    setupAccessoryTouchScroll();
}

window.onload = init;
