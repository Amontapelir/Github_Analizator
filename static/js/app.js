/* ============================================
   GitHub Profile Analyzer — Вся логика

   Структура:
   1. Цвета языков
   2. Утилиты (escapeHtml, formatNumber, …)
   3. Частицы на canvas (стратифицированная сетка)
   4. Страница авторизации (tilt + ripple)
   5. Страница приложения (поиск, рендер)
   6. Фабрики DOM-узлов из <template>
   7. Анимация счётчиков и полос
   8. История запросов
   9. Точка входа (DOMContentLoaded)
   ============================================ */

/* ------------------------------------------
   1. Цвета языков программирования
   Используются для точек и полос в карточке
   ------------------------------------------ */
const LANG_COLORS = {
    'C': '#555555', 'C++': '#f34b7d', 'C#': '#178600',
    'Python': '#3572A5', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
    'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584',
    'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138',
    'Kotlin': '#A97BFF', 'Dart': '#00B4AB', 'Shell': '#89e051',
    'Assembly': '#6E4C13', 'Makefile': '#427819', 'CMake': '#064F8C',
    'Perl': '#0298c3', 'R': '#198CE7', 'HTML': '#e34c26',
    'CSS': '#563d7c', 'SCSS': '#c6538c', 'Lua': '#000080',
    'Objective-C': '#438eff', 'Scala': '#c22d40', 'Haskell': '#5e5086',
    'Elixir': '#6e4a7e', 'Clojure': '#db5855', 'Erlang': '#B83998',
    'MATLAB': '#e16737', 'Julia': '#a270ba', 'Vim': '#199f4b',
    'Dockerfile': '#384d54', 'TeX': '#3D6117', 'Yacc': '#4B6C4B',
    'Lex': '#DBCA00', 'M4': '#7CAC74', 'Awk': '#c30e9b',
    'Sed': '#64b070', 'Roff': '#ecdebe', 'XSLT': '#3EB347',
    'Jinja': '#a52a22', 'QML': '#44a51c', 'QMake': '#2f6e31',
    'SmPL': '#c8553d', 'SWIG': '#ff9c2e', 'XS': '#7a6dc9',
    'RPC': '#2d56a3', 'Batchfile': '#C1F12E', 'UnrealScript': '#a54c4d',
    'Gherkin': '#5B2063', 'OpenSCAD': '#e5cd45',
    'Objective-C++': '#6866fb', 'Linker Script': '#455e89',
};

/* ------------------------------------------
   2. Утилиты
   ------------------------------------------ */

/** Экранирование спецсимволов для безопасной вставки в textContent */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, (ch) => map[ch]);
}

/** Форматирование числа: 243695 → "243.7K", 1500000 → "1.5M" */
function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
}

/** Дата ISO → "3 сентября 2011 г." */
function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Базовый markdown → HTML.
 * Поддерживает только **жирный** и переносы строк.
 * Сначала экранируем, потом применяем разметку — безопасно.
 */
function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

/** Удобная обёртка: клонировать <template> по id */
function cloneTemplate(id) {
    const tmpl = document.getElementById(id);
    if (!tmpl) return document.createDocumentFragment();
    return tmpl.content.cloneNode(true);
}

/* ============================================
   3. Canvas — Система частиц
   ============================================
   Частицы распределены РАВНОМЕРНО по экрану через
   стратифицированную (ячеистую) выборку:

   1. Canvas делится на воображаемую сетку из cols × rows ячеек.
      Количество столбцов рассчитывается так, чтобы ячейки были
      примерно квадратными (учитывая соотношение сторон экрана).
   2. Каждая частица привязана к своей ячейке и размещается в
      пределах неё со случайным смещением.
   3. Это гарантирует, что частицы покрывают ВЕСЬ экран, а не
      скапливаются в одной половине (как при чистом Math.random).
   */
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Настройки */
    const PARTICLE_COUNT = 100;   /* общее количество точек */
    const CONNECT_DIST = 130;     /* макс. расстояние для соединяющих линий */
    const MOUSE_DIST = 170;       /* радиус реакции на курсор */
    let particles = [];
    let mouse = { x: -9999, y: -9999 }; /* курсор за экраном = нет реакции */

    /** Подогнать размер canvas под окно */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /*
         * При ресайзе часть частиц может оказаться за новыми
         * границами — перемещаем их обратно в видимую зону.
         */
        particles.forEach(p => {
            if (p.x > canvas.width)  p.x = Math.random() * canvas.width;
            if (p.y > canvas.height) p.y = Math.random() * canvas.height;
        });
    }
    resize();
    window.addEventListener('resize', resize);

    /* Отслеживаем курсор для интерактивных линий */
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    /**
     * Создать одну частицу, привязанную к ячейке сетки.
     *
     * @param {number} index - порядковый номер частицы (0…PARTICLE_COUNT-1)
     *
     * Алгоритм:
     * - Вычисляем количество столбцов сетки. Формула:
     *     cols = ceil(sqrt(N * (W / H)))
     *   где N — число частиц, W/H — отношение ширины к высоте.
     *   Это делает ячейки примерно квадратными.
     * - Строки: rows = ceil(N / cols)
     * - Ячейка (i): столбец = i % cols, строка = floor(i / cols)
     * - Внутри ячейки позиция = левый-верхний угол + случайное смещение
     *   в пределах размеров ячейки (cellW × cellH).
     */
    function createParticle(index) {
        const W = canvas.width;
        const H = Math.max(canvas.height, 1); /* защита от деления на 0 */

        /* Количество столбцов: чем шире экран, тем больше столбцов */
        const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT * (W / H)));
        /* Количество строк: чтобы хватило на все частицы */
        const rows = Math.ceil(PARTICLE_COUNT / cols);

        /* Координаты ячейки */
        const col = index % cols;
        const row = Math.floor(index / cols);

        /* Размеры одной ячейки */
        const cellW = W / cols;
        const cellH = H / rows;

        return {
            /* Позиция внутри ячейки со случайным смещением */
            x: cellW * col + Math.random() * cellW,
            y: cellH * row + Math.random() * cellH,
            /* Скорость — маленькая, для плавного дрейфа */
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            /* Радиус точки */
            r: Math.random() * 1.6 + 0.5,
            /* Прозрачность */
            alpha: Math.random() * 0.45 + 0.15
        };
    }

    /* Создаём все частицы с равномерным распределением */
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle(i));
    }

    /** Главный цикл отрисовки */
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            /* Двигаем частицу */
            p.x += p.vx;
            p.y += p.vy;

            /* Отражение от границ экрана */
            if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            /* Рисуем саму точку */
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.r), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`;
            ctx.fill();

            /* Соединяющие линии между близкими частицами */
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DIST) {
                    /* Чем дальше частицы — тем прозрачнее линия */
                    const opacity = (1 - dist / CONNECT_DIST) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            /* Линии от частиц к курсору мыши */
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mDist < MOUSE_DIST) {
                const opacity = (1 - mDist / MOUSE_DIST) * 0.25;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

/* ============================================
   4. Страница авторизации — Tilt + Ripple
   ============================================ */
function initAuthPage() {
    const card = document.getElementById('login-card');
    if (!card) return;

    /*
     * Tilt-эффект: карточка слегка наклоняется вслед за курсором.
     * Угол наклона зависит от того, насколько далеко курсор от центра.
     */
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        /* Нормализованные координаты: -1 … +1 от центра */
        const rotateX = ((y - cy) / cy) * -6;
        const rotateY = ((x - cx) / cx) * 6;

        card.style.transform =
            `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
    });

    /* Плавный возврат при уходе курсора */
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    });

    /*
     * Ripple-эффект на кнопках авторизации:
     * радиальный градиент следует за курсором через CSS-переменные.
     */
    document.querySelectorAll('.auth-btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            btn.style.setProperty('--ripple-x',
                ((e.clientX - rect.left) / rect.width * 100) + '%');
            btn.style.setProperty('--ripple-y',
                ((e.clientY - rect.top) / rect.height * 100) + '%');
        });
    });
}

/* ============================================
   5. Страница приложения — Поиск + Рендер
   ============================================ */
function initAppPage() {
    const input = document.getElementById('username');
    const searchBtn = document.getElementById('search-btn');
    if (!input || !searchBtn) return;

    /* Клик по кнопке «Поиск» */
    searchBtn.addEventListener('click', fetchInfo);

    /* Enter в поле ввода */
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fetchInfo();
    });
}

/**
 * Основная функция поиска.
 * Показывает лоадер → запрашивает API → рендерит результат → прячет лоадер.
 */
async function fetchInfo() {
    const input = document.getElementById('username');
    const username = input.value.trim();
    if (!username) {
        input.focus();
        return;
    }

    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');

    loader.classList.remove('hidden');
    resultDiv.replaceChildren(); /* очищаем предыдущий результат */

    try {
        const res = await fetch(`/user?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        /* renderResult возвращает DocumentFragment — вставляем в DOM */
        resultDiv.replaceChildren(renderResult(data));
        addToHistory(username);

        /* Запускаем анимации ПОСЛЕ того, как элементы в DOM */
        setTimeout(animateCounters, 120);
        setTimeout(animateBars, 200);
    } catch {
        resultDiv.replaceChildren(
            cloneTemplate('tmpl-error')
        );
        resultDiv.querySelector('[data-field="error-text"]').textContent =
            'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.';
    } finally {
        loader.classList.add('hidden');
    }
}

/* ------------------------------------------
   Маршрутизатор рендера
   Определяет тип данных и вызывает нужную фабрику.
   ------------------------------------------ */
function renderResult(data) {
    /* Ошибка от API */
    if (data && data.error) {
        const frag = cloneTemplate('tmpl-error');
        frag.querySelector('[data-field="error-text"]').textContent = data.error;
        return frag;
    }

    /* Полный анализ: { data: { languages, ... }, resume } */
    if (data && data.data && (data.data.languages || data.resume)) {
        return buildAnalysisCard(data);
    }

    /* Профиль GitHub API с аватаром */
    if (data && data.login && data.avatar_url) {
        return buildProfileCard(data);
    }

    /* Упрощённый анализ: { login, total_stars, top_languages, ... } */
    if (data && data.login && data.total_stars !== undefined) {
        return buildSimpleCard(data);
    }

    /* Fallback — сырой JSON */
    const frag = cloneTemplate('tmpl-json');
    frag.querySelector('[data-field="json-content"]').textContent =
        JSON.stringify(data, null, 2);
    return frag;
}

/* ============================================
   6. Фабрики DOM-узлов
   Каждая функция клонирует <template>, находит
   элементы по data-field / data-section / data-container
   и заполняет их данными. НИ ОДНОЙ строки HTML в JS.
   ============================================ */

/**
 * Основная карточка анализа (torvalds-формат).
 * Ожидает: { data: { username, all_repos, total_stars, followers,
 *            activ, languages: {C: 123, ...}, created_at, ... },
 *           resume: "..." }
 */
function buildAnalysisCard(data) {
    const frag = cloneTemplate('tmpl-analysis');
    const d = data.data || {};
    const resume = data.resume || '';

    /* Username */
    frag.querySelector('[data-field="username"]').textContent =
        '@' + (d.username || d.login || '');

    /* Статистика — записываем в data-target для анимации счётчиков */
    frag.querySelector('[data-field="repos"]').dataset.target =
        d.all_repos || d.public_repos || 0;
    frag.querySelector('[data-field="stars"]').dataset.target =
        d.total_stars || 0;
    frag.querySelector('[data-field="followers"]').dataset.target =
        d.followers || 0;
    frag.querySelector('[data-field="activity"]').dataset.target =
        d.activ || 0;

    /* ---------- Языки ---------- */
    const langs = d.languages || {};
    const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);

    if (totalBytes > 0) {
        /* Показываем секцию */
        frag.querySelector('[data-section="languages"]').style.display = '';
        const container = frag.querySelector('[data-container="lang-bars"]');

        /* Сортируем по убыванию байтов */
        const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 8);

        /* Создаём строку для каждого из топ-8 языков */
        top.forEach(([name, bytes], idx) => {
            container.appendChild(createLangRow(name, bytes, totalBytes, idx));
        });

        /* «Другие» — всё, что не вошло в топ-8 */
        const otherBytes = sorted.slice(8).reduce((a, b) => a + b[1], 0);
        if (otherBytes > 0) {
            container.appendChild(
                createLangRow('Другие', otherBytes, totalBytes, top.length, '#555555')
            );
        }
    }

    /* ---------- Резюме ---------- */
    if (resume) {
        frag.querySelector('[data-section="resume"]').style.display = '';
        frag.querySelector('[data-field="resume"]').innerHTML = renderMarkdown(resume);
    }

    /* ---------- Мета-бейджи ---------- */
    const badgesContainer = frag.querySelector('[data-container="badges"]');
    const badgeFragments = [];

    if (d.mean_count_stars) {
        badgeFragments.push(createIconBadge('★', 'Среднее: ' + formatNumber(d.mean_count_stars)));
    }
    if (d.total_forks !== undefined) {
        badgeFragments.push(createIconBadge('⑂', 'Форки: ' + formatNumber(d.total_forks)));
    }
    if (d.total_readmes !== undefined) {
        badgeFragments.push(createIconBadge('📄', 'README: ' + d.total_readmes));
    }
    if (d.created_at) {
        badgeFragments.push(createIconBadge('📅', formatDate(d.created_at)));
    }

    if (badgeFragments.length) {
        badgesContainer.style.display = '';
        badgeFragments.forEach(b => badgesContainer.appendChild(b));
    }

    /* Сырой JSON */
    frag.querySelector('[data-field="raw-json"]').textContent =
        JSON.stringify(data, null, 2);

    return frag;
}

/**
 * Профиль с аватаром (сырой ответ GitHub API).
 * Ожидает: { login, avatar_url, name, bio, html_url, public_repos,
 *            followers, following, public_gists, location, company, ... }
 */
function buildProfileCard(data) {
    const frag = cloneTemplate('tmpl-profile');

    /* Аватар */
    const avatar = frag.querySelector('[data-field="avatar"]');
    avatar.src = data.avatar_url;
    avatar.alt = data.login;

    /* Имя и ссылка */
    frag.querySelector('[data-field="name"]').textContent = data.name || data.login;
    const loginLink = frag.querySelector('[data-field="login-link"]');
    loginLink.textContent = '@' + data.login;
    loginLink.href = data.html_url || '#';

    /* Bio — показываем только если есть */
    if (data.bio) {
        const bio = frag.querySelector('[data-field="bio"]');
        bio.textContent = data.bio;
        bio.style.display = '';
    }

    /* Статистика */
    frag.querySelector('[data-field="repos"]').dataset.target = data.public_repos || 0;
    frag.querySelector('[data-field="followers"]').dataset.target = data.followers || 0;
    frag.querySelector('[data-field="following"]').dataset.target = data.following || 0;
    frag.querySelector('[data-field="gists"]').dataset.target = data.public_gists || 0;

    /* Условные детали — показываем только заполненные */
    if (data.location) {
        frag.querySelector('[data-detail="location"]').style.display = '';
        frag.querySelector('[data-field="location-text"]').textContent = data.location;
    }
    if (data.company) {
        frag.querySelector('[data-detail="company"]').style.display = '';
        frag.querySelector('[data-field="company-text"]').textContent = data.company;
    }
    if (data.email) {
        frag.querySelector('[data-detail="email"]').style.display = '';
        const link = frag.querySelector('[data-field="email-link"]');
        link.href = 'mailto:' + data.email;
        link.textContent = data.email;
    }
    if (data.blog) {
        frag.querySelector('[data-detail="blog"]').style.display = '';
        const link = frag.querySelector('[data-field="blog-link"]');
        const url = data.blog.startsWith('http') ? data.blog : 'https://' + data.blog;
        link.href = url;
        link.textContent = data.blog;
    }
    if (data.created_at) {
        frag.querySelector('[data-detail="created"]').style.display = '';
        frag.querySelector('[data-field="created-text"]').textContent = formatDate(data.created_at);
    }

    /* Сырой JSON */
    frag.querySelector('[data-field="raw-json"]').textContent =
        JSON.stringify(data, null, 2);

    return frag;
}

/**
 * Упрощённая карточка (без аватара, с бейджами языков).
 * Ожидает: { login, public_repos, total_stars, followers,
 *            top_languages: ['C', 'Rust', ...], resume }
 */
function buildSimpleCard(data) {
    const frag = cloneTemplate('tmpl-simple');

    /* Username */
    frag.querySelector('[data-field="username"]').textContent =
        '@' + (data.login || '');

    /* Статистика */
    frag.querySelector('[data-field="repos"]').dataset.target = data.public_repos || 0;
    frag.querySelector('[data-field="stars"]').dataset.target = data.total_stars || 0;
    frag.querySelector('[data-field="followers"]').dataset.target = data.followers || 0;

    /* Топ-языки как цветные бейджи */
    const topLangs = data.top_languages || [];
    if (topLangs.length) {
        frag.querySelector('[data-section="top-langs"]').style.display = '';
        const container = frag.querySelector('[data-container="top-langs"]');

        topLangs.forEach(lang => {
            container.appendChild(createLangBadge(lang));
        });
    }

    /* Резюме */
    if (data.resume) {
        frag.querySelector('[data-section="resume"]').style.display = '';
        frag.querySelector('[data-field="resume"]').innerHTML = renderMarkdown(data.resume);
    }

    /* Сырой JSON */
    frag.querySelector('[data-field="raw-json"]').textContent =
        JSON.stringify(data, null, 2);

    return frag;
}

/* ------------------------------------------
   Вспомогательные фабрики мелких компонентов
   ------------------------------------------ */

/**
 * Создать строку одного языка для секции «Языки».
 * Клонирует tmpl-lang-row и заполняет цвет, имя, процент.
 *
 * @param {string} name  — название языка
 * @param {number} bytes — количество байтов
 * @param {number} total — сумма всех байтов
 * @param {number} idx   — индекс для каскадной задержки анимации
 * @param {string} [forcedColor] — если передан, игнорирует LANG_COLORS
 */
function createLangRow(name, bytes, total, idx, forcedColor) {
    const row = cloneTemplate('tmpl-lang-row');
    const pct = total > 0 ? ((bytes / total) * 100).toFixed(1) : '0.0';
    const color = forcedColor || LANG_COLORS[name] || '#666666';

    row.querySelector('.lang-dot').style.background = color;
    row.querySelector('.lang-name-text').textContent = name;

    const bar = row.querySelector('.lang-bar-fill');
    bar.style.background = color;
    bar.style.animationDelay = (idx * 0.07) + 's';
    bar.dataset.width = pct; /* для animateBars() */

    row.querySelector('.lang-pct').textContent = pct + '%';

    return row;
}

/** Бейдж с текстовой иконкой (★ Среднее: 22.2K) */
function createIconBadge(icon, text) {
    const badge = cloneTemplate('tmpl-badge-icon');
    badge.querySelector('.meta-icon').textContent = icon;
    badge.querySelector('.meta-badge-text').textContent = text;
    return badge;
}

/** Бейдж с цветной точкой языка (● C) */
function createLangBadge(langName) {
    const badge = cloneTemplate('tmpl-badge-lang');
    badge.querySelector('.lang-dot-sm').style.background =
        LANG_COLORS[langName] || '#666666';
    badge.querySelector('.meta-badge-text').textContent = langName;
    return badge;
}

/* ============================================
   7. Анимация счётчиков и полос
   Запускаются ПОСЛЕ вставки элементов в DOM,
   поэтому document.querySelectorAll их найдёт.
   ============================================ */

/**
 * Анимация числовых счётчиков: 0 → target с easing.
 * Ищет все [.a-stat-value[data-target], .stat-value[data-target]]
 */
function animateCounters() {
    document.querySelectorAll(
        '.a-stat-value[data-target], .stat-value[data-target]'
    ).forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target) || target === 0) {
            el.textContent = '0';
            return;
        }

        const duration = 1200;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            /* easeOutExpo — быстрый старт, плавное замедление */
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = formatNumber(Math.floor(eased * target));

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = formatNumber(target);
            }
        }
        requestAnimationFrame(tick);
    });
}

/**
 * Анимация полос языков: ширина 0 → целевое значение.
 * Ищет все .lang-bar-fill[data-width] и устанавливает width.
 */
function animateBars() {
    document.querySelectorAll('.lang-bar-fill[data-width]').forEach((el) => {
        el.style.width = el.dataset.width + '%';
    });
}

/* ============================================
   8. История запросов
   ============================================ */

/** Добавить username в начало списка истории (макс. 10) */
function addToHistory(username) {
    const container = document.getElementById('history-list');
    if (!container) return;

    /* Убираем дубликат, если он уже есть */
    container.querySelectorAll('.history-tag').forEach((tag) => {
        if (tag.textContent === username) tag.remove();
    });

    const tag = document.createElement('button');
    tag.className = 'history-tag';
    tag.textContent = username;
    tag.addEventListener('click', () => useUsername(username));
    container.prepend(tag);

    /* Ограничиваем историю 10 элементами */
    while (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

/** Вставить имя в поле ввода и запустить поиск */
function useUsername(name) {
    const input = document.getElementById('username');
    if (input) {
        input.value = name;
        fetchInfo();
    }
}

/* ============================================
   9. Точка входа
   Определяет, на какой странице мы находимся,
   по наличию ключевых DOM-элементов.
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    /* Частицы есть на обеих страницах */
    initParticles();

    /* Если есть карточка входа — мы на auth.html */
    if (document.getElementById('login-card')) {
        initAuthPage();
    }

    /* Если есть кнопка поиска — мы на index.html */
    if (document.getElementById('search-btn')) {
        initAppPage();
    }
});