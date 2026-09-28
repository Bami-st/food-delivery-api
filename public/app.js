/* ============================================================
   Food Delivery — browser client
   No framework, no build step. Talks to the REST API in /api/v1.
   ============================================================ */

(function () {
  'use strict';

  const REQUEST_TIMEOUT = 15000;
  const SEARCH_DEBOUNCE = 350;
  const AUTO_LOAD_SCROLL_THRESHOLD = 240;
  const THEME_KEY = 'food-delivery:theme';
  const BASE_URL_KEY = 'food-delivery:baseUrl';

  const RATING_CHOICES = ['3.5', '4', '4.5', '4.8'];
  const LIMIT_CHOICES = ['12', '24', '48'];
  const SORT_CHOICES = ['rating:desc', 'rating:asc', 'name:asc', 'name:desc', 'createdAt:desc', 'createdAt:asc'];
  const OPEN_CHOICES = ['', 'true', 'false'];
  const KNOWN_CUISINES = ['Italian', 'Japanese', 'Mexican', 'American', 'Indian', 'Thai', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Chinese', 'Greek'];
  const KNOWN_CITIES = ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Denver', 'Miami', 'Los Angeles', 'Portland'];

  /* ---------------- DOM ---------------- */

  const el = {
    filters: document.getElementById('filters'),
    search: document.getElementById('searchInput'),
    clearSearch: document.getElementById('btnClearSearch'),
    cuisine: document.getElementById('cuisineSelect'),
    city: document.getElementById('citySelect'),
    rating: document.getElementById('ratingSelect'),
    sort: document.getElementById('sortSelect'),
    limit: document.getElementById('limitSelect'),
    openRadios: Array.from(document.querySelectorAll('input[name="isOpen"]')),
    activeFilters: document.getElementById('activeFilters'),
    chips: document.getElementById('chips'),
    clearAll: document.getElementById('btnClearAll'),
    results: document.getElementById('results'),
    grid: document.getElementById('grid'),
    resultCount: document.getElementById('resultCount'),
    refresh: document.getElementById('btnRefresh'),
    errorState: document.getElementById('errorState'),
    errorTitle: document.getElementById('errorTitle'),
    errorBody: document.getElementById('errorBody'),
    errorMeta: document.getElementById('errorMeta'),
    retry: document.getElementById('btnRetry'),
    emptyState: document.getElementById('emptyState'),
    emptyBody: document.getElementById('emptyBody'),
    resetFilters: document.getElementById('btnResetFilters'),
    loadMoreWrap: document.getElementById('loadMoreWrap'),
    loadMore: document.getElementById('btnLoadMore'),
    loadMoreStatus: document.getElementById('loadMoreStatus'),
    toTop: document.getElementById('btnToTop'),
    themeToggle: document.getElementById('themeToggle'),
    themeGlyph: document.getElementById('themeGlyph'),
    settings: document.getElementById('settingsPanel'),
    settingsForm: document.getElementById('settingsForm'),
    apiBase: document.getElementById('apiBase'),
    settingsResult: document.getElementById('settingsResult'),
    healthCheck: document.getElementById('btnHealthCheck'),
    conn: document.getElementById('connStatus'),
    connText: document.getElementById('connText'),
    footerLink: document.getElementById('footerApiLink'),
    scrim: document.getElementById('scrim'),
    drawer: document.getElementById('drawer'),
    drawerTitle: document.getElementById('drawerTitle'),
    drawerSubtitle: document.getElementById('drawerSubtitle'),
    drawerBody: document.getElementById('drawerBody'),
    closeDrawer: document.getElementById('btnCloseDrawer')
  };

  /* ---------------- helpers ---------------- */

  function h(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        const value = props[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2).toLowerCase(), value);
        else node.setAttribute(key, value);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
    });
    return node;
  }

  function replaceChildren(node, children) {
    node.replaceChildren.apply(node, (children || []).filter(Boolean));
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* private mode, ignore */
    }
  }

  function money(cents) {
    const value = Number(cents);
    if (!Number.isFinite(value)) return '—';
    return '$' + (value / 100).toFixed(2);
  }

  function plural(count, word) {
    return count === 1 ? '1 ' + word : count + ' ' + word + 's';
  }

  function normalizeBaseUrl(value) {
    let url = (value || '').trim();
    if (!url) return '/api/v1';
    if (!/^https?:\/\//i.test(url) && url.charAt(0) !== '/') url = 'http://' + url;
    url = url.replace(/\/+$/, '');
    if (/\/api\/v\d+$/i.test(url)) return url;
    return url + '/api/v1';
  }

  function rootUrl() {
    return state.baseUrl.replace(/\/api\/v\d+$/i, '') || window.location.origin;
  }

  function oneOf(value, allowed, fallback) {
    return allowed.indexOf(value) !== -1 ? value : fallback;
  }

  /* ---------------- state ---------------- */

  const state = {
    baseUrl: '/api/v1',
    search: '',
    cuisine: '',
    city: '',
    minRating: '',
    isOpen: '',
    sort: 'rating',
    order: 'desc',
    limit: '12',
    items: [],
    rendered: 0,
    rebuild: true,
    total: 0,
    nextCursor: null,
    hasMore: false,
    loading: false,
    error: null,
    token: 0,
    controller: null,
    retryAt: 0,
    retryTimer: null,
    drawerId: null,
    cuisines: new Set(),
    cities: new Set(),
    facetSignature: ''
  };

  /* ---------------- errors ---------------- */

  class ApiError extends Error {
    constructor(message, options) {
      super(message);
      this.name = 'ApiError';
      this.status = (options && options.status) || 0;
      this.code = (options && options.code) || null;
      this.kind = (options && options.kind) || 'http';
      this.retryAfter = (options && options.retryAfter) || null;
    }
  }

  function retryAfterSeconds(headers) {
    const raw = headers.get('retry-after');
    if (!raw) return null;
    const seconds = parseInt(raw, 10);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }

  function describeError(err) {
    if (!(err instanceof ApiError)) {
      return { title: 'Something went wrong', body: err && err.message ? err.message : 'Unexpected problem.', meta: '', showRetry: true };
    }
    if (err.status === 429) {
      return {
        title: 'Slow down a moment',
        body: 'The API rate limit was reached. Requests resume automatically when the window resets — no need to refresh.',
        meta: '',
        showRetry: false
      };
    }
    if (err.status === 400) {
      return { title: 'That query was rejected', body: err.message, meta: err.code ? 'API said: ' + err.code : '', showRetry: false };
    }
    if (err.status === 404) {
      return { title: 'Not found', body: err.message, meta: '', showRetry: true };
    }
    if (err.status >= 500) {
      return { title: 'The server had a problem', body: err.message, meta: 'Status ' + err.status, showRetry: true };
    }
    if (err.kind === 'timeout') {
      return { title: 'The server took too long', body: err.message, meta: 'Waited ' + REQUEST_TIMEOUT / 1000 + ' seconds.', showRetry: true };
    }
    return { title: "Can't reach the API", body: err.message, meta: state.baseUrl, showRetry: true };
  }

  /* ---------------- api ---------------- */

  function buildUrl(path, params) {
    const query = params ? params.toString() : '';
    return state.baseUrl + '/' + path + (query ? '?' + query : '');
  }

  async function apiGet(path, params, options) {
    const opts = options || {};
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(function () {
      timedOut = true;
      controller.abort();
    }, opts.timeout || REQUEST_TIMEOUT);

    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', function () { controller.abort(); }, { once: true });
    }

    let response;
    try {
      response = await fetch(buildUrl(path, params), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
    } catch (err) {
      if (timedOut) {
        throw new ApiError('The request timed out before the API responded.', { kind: 'timeout' });
      }
      if ((opts.signal && opts.signal.aborted) || (err && err.name === 'AbortError')) throw err;
      throw new ApiError('No response from the API. Is the server running, and is the base URL correct?', { kind: 'network' });
    } finally {
      window.clearTimeout(timer);
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }

    if (response.ok) return payload;

    const apiError = payload && payload.error ? payload.error : null;
    let message = apiError && apiError.message ? apiError.message : 'The API returned status ' + response.status + '.';
    if (response.status >= 500) message = 'The API hit an unexpected error and logged it on the server.';

    throw new ApiError(message, {
      status: response.status,
      code: apiError ? apiError.code : null,
      retryAfter: response.status === 429 ? retryAfterSeconds(response.headers) : null
    });
  }

  function restaurantParams(cursor) {
    const params = new URLSearchParams();
    params.set('limit', state.limit);
    params.set('sort', state.sort);
    params.set('order', state.order);
    if (state.search) params.set('search', state.search);
    if (state.cuisine) params.set('cuisine', state.cuisine);
    if (state.city) params.set('city', state.city);
    if (state.minRating) params.set('minRating', state.minRating);
    if (state.isOpen) params.set('isOpen', state.isOpen);
    if (cursor) params.set('cursor', cursor);
    return params;
  }

  /* ---------------- data loading ---------------- */

  function setConn(status, text) {
    el.conn.dataset.state = status;
    el.connText.textContent = text;
  }

  function clearRetryTimer() {
    if (state.retryTimer) {
      window.clearInterval(state.retryTimer);
      state.retryTimer = null;
    }
  }

  function startRetryCountdown(seconds) {
    clearRetryTimer();
    state.retryAt = Date.now() + seconds * 1000;
    state.retryTimer = window.setInterval(function () {
      const remaining = Math.ceil((state.retryAt - Date.now()) / 1000);
      if (remaining <= 0) {
        clearRetryTimer();
        state.retryAt = 0;
        state.error = null;
        loadPage({ reset: true });
        return;
      }
      if (state.error) {
        state.error.retryAfter = remaining;
        renderError();
      }
    }, 250);
  }

  async function loadPage(options) {
    const reset = !options || options.reset !== false;
    if (state.loading) return;
    if (!reset && (!state.hasMore || !state.nextCursor)) return;
    if (state.retryAt > Date.now()) return;

    if (reset) {
      state.token += 1;
      if (state.controller) state.controller.abort();
      state.controller = new AbortController();
    }
    const token = state.token;
    const signal = state.controller ? state.controller.signal : undefined;

    state.loading = true;
    state.error = null;
    render();

    try {
      const payload = await apiGet('restaurants', restaurantParams(reset ? null : state.nextCursor), { signal });
      if (token !== state.token) return;

      const data = payload && Array.isArray(payload.data) ? payload.data : [];
      const meta = (payload && payload.meta) || {};
      state.items = reset ? data : state.items.concat(data);
      state.rebuild = reset;
      state.total = Number.isFinite(Number(meta.total)) ? Number(meta.total) : state.items.length;
      state.hasMore = Boolean(meta.hasMore) && Boolean(meta.nextCursor);
      state.nextCursor = meta.nextCursor || null;
      collectFacets(data);
      setConn('ok', 'Connected');
    } catch (err) {
      if (token !== state.token) return;
      if (err && err.name === 'AbortError') return;
      if (err instanceof ApiError && err.status === 429) {
        startRetryCountdown(err.retryAfter || 60);
        state.error = err;
        setConn('error', 'Rate limited');
      } else if (err instanceof ApiError && err.kind === 'network') {
        state.error = err;
        setConn('error', 'Offline');
      } else {
        state.error = err instanceof ApiError ? err : new ApiError(err && err.message ? err.message : 'Unexpected error.');
        setConn('error', 'API error');
      }
    } finally {
      if (token === state.token) {
        state.loading = false;
        render();
      }
    }
  }

  /* ---------------- filters ---------------- */

  function collectFacets(items) {
    items.forEach(function (item) {
      if (item.cuisine) state.cuisines.add(item.cuisine);
      if (item.city) state.cities.add(item.city);
    });
    const signature = Array.from(state.cuisines).sort().join('|') + '#' + Array.from(state.cities).sort().join('|');
    if (signature === state.facetSignature) return;
    state.facetSignature = signature;
    fillFacets(el.cuisine, state.cuisines, KNOWN_CUISINES, state.cuisine, 'All cuisines');
    fillFacets(el.city, state.cities, KNOWN_CITIES, state.city, 'All cities');
  }

  function fillFacets(select, discovered, known, current, emptyLabel) {
    const pool = new Set(known.concat(Array.from(discovered)));
    if (current) pool.add(current);
    const values = Array.from(pool).filter(Boolean).sort((a, b) => a.localeCompare(b));
    replaceChildren(select, [h('option', { value: '', text: emptyLabel })].concat(
      values.map(function (value) { return h('option', { value: value, text: value }); })
    ));
    select.value = current;
  }

  function resetFilters() {
    state.search = '';
    state.cuisine = '';
    state.city = '';
    state.minRating = '';
    state.isOpen = '';
    state.sort = 'rating';
    state.order = 'desc';
    state.limit = '12';
  }

  function activeFilterChips() {
    const chips = [];
    if (state.search) chips.push({ key: 'Search', label: '“' + state.search + '”', field: 'search' });
    if (state.cuisine) chips.push({ key: 'Cuisine', label: state.cuisine, field: 'cuisine' });
    if (state.city) chips.push({ key: 'City', label: state.city, field: 'city' });
    if (state.minRating) chips.push({ key: 'Rating', label: '★ ' + state.minRating + '+', field: 'minRating' });
    if (state.isOpen) chips.push({ key: 'State', label: state.isOpen === 'true' ? 'Open now' : 'Closed', field: 'isOpen' });
    return chips;
  }

  function applyFilters() {
    syncControls();
    syncUrl();
    loadPage({ reset: true });
  }

  /* ---------------- url state ---------------- */

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.search) params.set('q', state.search);
    if (state.cuisine) params.set('cuisine', state.cuisine);
    if (state.city) params.set('city', state.city);
    if (state.minRating) params.set('rating', state.minRating);
    if (state.isOpen) params.set('open', state.isOpen);
    if (state.sort !== 'rating' || state.order !== 'desc') params.set('sort', state.sort + ':' + state.order);
    if (state.limit !== '12') params.set('limit', state.limit);
    if (state.drawerId) params.set('restaurant', state.drawerId);
    if (state.baseUrl !== '/api/v1') params.set('api', state.baseUrl);
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.baseUrl = normalizeBaseUrl(params.get('api') || storageGet(BASE_URL_KEY) || '/api/v1');
    state.search = (params.get('q') || '').slice(0, 120);
    state.cuisine = params.get('cuisine') || '';
    state.city = params.get('city') || '';
    state.minRating = oneOf(params.get('rating'), RATING_CHOICES, '');
    state.isOpen = oneOf(params.get('open'), OPEN_CHOICES, '');
    const sort = oneOf(params.get('sort'), SORT_CHOICES, 'rating:desc');
    state.sort = sort.split(':')[0];
    state.order = sort.split(':')[1];
    state.limit = oneOf(params.get('limit'), LIMIT_CHOICES, '12');
    state.drawerId = params.get('restaurant') || null;
  }

  function syncControls() {
    if (el.search.value !== state.search) el.search.value = state.search;
    el.clearSearch.hidden = !state.search;
    if (el.cuisine.value !== state.cuisine) el.cuisine.value = state.cuisine;
    if (el.city.value !== state.city) el.city.value = state.city;
    el.rating.value = state.minRating;
    el.limit.value = state.limit;
    el.sort.value = state.sort + ':' + state.order;
    el.openRadios.forEach(function (radio) { radio.checked = radio.value === state.isOpen; });
  }

  /* ---------------- rendering ---------------- */

  function render() {
    renderChips();
    renderCount();
    renderResults();
    renderError();
    renderLoadMore();
    renderToTop();
    el.results.setAttribute('aria-busy', state.loading ? 'true' : 'false');
  }

  function renderChips() {
    const chips = activeFilterChips();
    el.activeFilters.hidden = chips.length === 0;
    replaceChildren(el.chips, chips.map(function (chip) {
      return h('span', { class: 'chip' }, [
        h('span', { class: 'chip__key', text: chip.key + ':' }),
        h('span', { text: chip.label }),
        h('button', {
          type: 'button',
          class: 'chip__remove',
          'aria-label': 'Remove ' + chip.key.toLowerCase() + ' filter ' + chip.label,
          text: '✕',
          onClick: function () {
            state[chip.field] = '';
            applyFilters();
          }
        })
      ]);
    }));
  }

  function filterSummary() {
    const parts = [];
    if (state.cuisine) parts.push(state.cuisine);
    if (state.city) parts.push('in ' + state.city);
    if (state.isOpen === 'true') parts.push('open now');
    if (state.isOpen === 'false') parts.push('closed');
    if (state.minRating) parts.push('★ ' + state.minRating + '+');
    return parts.join(' · ');
  }

  function renderCount() {
    if (state.loading && state.items.length === 0) {
      el.resultCount.textContent = 'Loading restaurants…';
      return;
    }
    if (state.items.length === 0) {
      el.resultCount.textContent = state.error ? 'Nothing loaded' : 'No matches';
      return;
    }
    const summary = filterSummary();
    const children = [h('strong', { text: String(state.items.length) })];
    children.push(state.items.length >= state.total
      ? ' ' + plural(state.total, 'restaurant')
      : ' of ' + plural(state.total, 'restaurant') + ' loaded');
    if (summary) children.push(h('span', { class: 'results-bar__summary', text: ' · ' + summary }));
    replaceChildren(el.resultCount, children);
  }

  function renderResults() {
    const showSkeleton = state.loading && state.items.length === 0;
    const showEmpty = !state.loading && !state.error && state.items.length === 0;

    el.emptyState.hidden = !showEmpty;
    if (showEmpty) {
      el.emptyBody.textContent = state.search || state.cuisine || state.city
        ? 'Nothing matches ' + (state.search ? '“' + state.search + '”' : 'these filters') + '. Try a different spelling or clear a filter.'
        : 'No restaurants were returned. Try adjusting your filters.';
    }

    if (showSkeleton) {
      state.rendered = 0;
      replaceChildren(el.grid, Array.from({ length: 6 }, function () {
        return h('div', { class: 'card' }, [
          h('div', { class: 'card__top' }, [h('span', { class: 'skeleton skeleton--chip' }), h('span', { class: 'skeleton skeleton--chip' })]),
          h('span', { class: 'skeleton skeleton--title' }),
          h('span', { class: 'skeleton skeleton--line', style: 'width:85%' }),
          h('span', { class: 'skeleton skeleton--line', style: 'width:55%' })
        ]);
      }));
      return;
    }

    if (showEmpty) {
      state.rendered = 0;
      replaceChildren(el.grid, []);
      return;
    }

    if (state.rebuild || state.items.length < state.rendered) {
      replaceChildren(el.grid, state.items.map(buildCard));
    } else if (state.items.length > state.rendered) {
      const fragment = document.createDocumentFragment();
      state.items.slice(state.rendered).forEach(function (item) { fragment.appendChild(buildCard(item)); });
      el.grid.appendChild(fragment);
    }
    state.rendered = state.items.length;
    state.rebuild = false;
  }

  function buildCard(restaurant) {
    const rating = Number(restaurant.rating);
    const location = [restaurant.address, restaurant.city].filter(Boolean).join(' · ');
    return h('article', { class: 'card', role: 'listitem' }, [
      h('div', { class: 'card__top' }, [
        h('div', { class: 'card__badges' }, [
          h('span', { class: 'badge badge--cuisine', text: restaurant.cuisine || 'Uncategorised' }),
          restaurant.isOpen
            ? h('span', { class: 'badge badge--open' }, [h('span', { 'aria-hidden': 'true', text: '●' }), 'Open now'])
            : h('span', { class: 'badge badge--closed', text: 'Closed' })
        ]),
        h('span', { class: 'rating' }, [
          h('span', { class: 'rating__star', 'aria-hidden': 'true', text: '★' }),
          Number.isFinite(rating) ? rating.toFixed(1) : '—',
          h('span', { class: 'rating__max', text: '/ 5' })
        ])
      ]),
      h('h3', { class: 'card__name', text: restaurant.name || 'Unnamed restaurant' }),
      h('p', { class: 'card__meta', text: location || 'No address on file' }),
      h('div', { class: 'card__footer' }, [
        h('span', { class: 'card__cta' }, ['View menu', h('span', { 'aria-hidden': 'true', text: '→' })]),
        h('span', { class: 'card__id', text: restaurant.id, title: restaurant.id })
      ]),
      h('button', {
        type: 'button',
        class: 'card__link',
        'aria-label': 'View menu for ' + (restaurant.name || 'restaurant') + (restaurant.isOpen ? ', open now' : ', currently closed'),
        onClick: function () { openDrawer(restaurant); }
      })
    ]);
  }

  function renderError() {
    const hasError = Boolean(state.error);
    el.errorState.hidden = !hasError;
    el.errorState.classList.toggle('state--error', hasError);
    el.retry.hidden = true;
    if (!hasError) return;

    const info = describeError(state.error);
    el.errorTitle.textContent = info.title;
    el.errorBody.textContent = info.body;
    el.errorMeta.textContent = state.error.retryAfter
      ? 'Rate limit resets in ' + state.error.retryAfter + 's — retrying automatically.'
      : info.meta;
    el.retry.hidden = !info.showRetry;
  }

  function renderLoadMore() {
    const hasCards = state.items.length > 0;
    el.loadMore.hidden = !hasCards;
    if (!hasCards) {
      el.loadMoreStatus.textContent = '';
      return;
    }

    el.loadMore.hidden = !state.hasMore;
    el.loadMore.disabled = state.loading;
    el.loadMore.textContent = state.loading ? 'Loading…' : 'Load more';

    if (state.error && !state.error.retryAfter) {
      el.loadMoreStatus.textContent = 'Showing what loaded before the error.';
    } else if (state.loading) {
      el.loadMoreStatus.textContent = 'Fetching the next page…';
    } else if (state.hasMore) {
      el.loadMoreStatus.textContent = state.items.length + ' of ' + state.total + ' loaded · scroll for more';
    } else {
      el.loadMoreStatus.textContent = state.total === state.items.length
        ? 'That’s all ' + plural(state.total, 'restaurant') + '.'
        : 'End of results.';
    }
  }

  function renderToTop() {
    el.toTop.hidden = window.scrollY < 600 || !state.items.length;
  }

  /* ---------------- drawer ---------------- */

  let lastFocused = null;

  function openDrawer(restaurant) {
    state.drawerId = restaurant.id;
    if (!lastFocused) lastFocused = document.activeElement;
    syncUrl();

    el.drawerTitle.textContent = restaurant.name || 'Menu';
    el.drawerSubtitle.textContent = [restaurant.cuisine, restaurant.city].filter(Boolean).join(' · ');
    replaceChildren(el.drawerBody, [drawerSkeleton('Loading menu…')]);

    el.scrim.hidden = false;
    el.drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    el.closeDrawer.focus();

    loadMenu(restaurant);
  }

  function drawerSkeleton(label) {
    return h('div', { class: 'drawer__note', role: 'status' }, [
      h('span', { class: 'spinner', 'aria-hidden': 'true' }),
      h('span', { text: label })
    ]);
  }

  async function loadMenu(restaurant) {
    const id = restaurant.id;
    try {
      const params = new URLSearchParams({ limit: '100', sort: 'priceInCents', order: 'asc' });
      const results = await Promise.all([
        apiGet('restaurants/' + encodeURIComponent(id)),
        apiGet('restaurants/' + encodeURIComponent(id) + '/menu', params)
      ]);
      if (state.drawerId !== id) return;
      const detail = (results[0] && results[0].data) || {};
      const menu = (results[1] && results[1].data) || [];
      const meta = (results[1] && results[1].meta) || {};
      replaceChildren(el.drawerBody, drawerContent(detail, menu, meta));
    } catch (err) {
      if (state.drawerId !== id) return;
      const info = describeError(err);
      replaceChildren(el.drawerBody, [
        h('div', { class: 'state state--error' }, [
          h('p', { class: 'state__icon', 'aria-hidden': 'true', text: '⚠️' }),
          h('p', { class: 'state__title', text: info.title }),
          h('p', { class: 'state__body', text: info.body })
        ]),
        h('button', {
          type: 'button',
          class: 'btn btn--primary btn--wide',
          text: 'Try again',
          onClick: function () { loadMenu(restaurant); }
        })
      ]);
    }
  }

  function drawerContent(detail, menu, meta) {
    const rating = Number(detail.rating);
    const counts = detail._count || {};
    const nodes = [];

    nodes.push(h('div', { class: 'drawer__stats' }, [
      statBlock(Number.isFinite(rating) ? rating.toFixed(1) + ' / 5' : '—', 'Rating'),
      statBlock(String(counts.menuItems !== undefined ? counts.menuItems : meta.total), 'Menu items'),
      statBlock(String(counts.orders !== undefined ? counts.orders : 0), 'Orders')
    ]));

    nodes.push(h('p', { class: 'drawer__note' }, [
      h('span', { 'aria-hidden': 'true', text: '📍' }),
      h('span', { text: [detail.address, detail.city].filter(Boolean).join(', ') || 'No address on file' })
    ]));

    if (!menu.length) {
      nodes.push(h('div', { class: 'state' }, [
        h('p', { class: 'state__icon', 'aria-hidden': 'true', text: '🍽️' }),
        h('p', { class: 'state__title', text: 'No menu items yet' }),
        h('p', { class: 'state__body', text: 'This restaurant has not published any dishes.' })
      ]));
      return nodes;
    }

    const groups = new Map();
    menu.forEach(function (item) {
      const key = item.category || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    groups.forEach(function (items, category) {
      nodes.push(h('section', { class: 'menu-group' }, [
        h('h3', { class: 'menu-group__title', text: category }),
        h('div', {}, items.map(menuRow))
      ]));
    });

    nodes.push(h('p', { class: 'drawer__note' }, [
      h('span', { 'aria-hidden': 'true', text: 'ℹ️' }),
      h('span', { text: 'Browsing only — ordering is not enabled in this view.' })
    ]));

    return nodes;
  }

  function statBlock(value, label) {
    return h('div', { class: 'stat' }, [
      h('span', { class: 'stat__value', text: value }),
      h('span', { class: 'stat__label', text: label })
    ]);
  }

  function menuRow(item) {
    return h('article', { class: 'menu-item' }, [
      h('div', {}, [
        h('p', { class: 'menu-item__name' }, [
          h('span', { text: item.name || 'Unnamed dish' }),
          item.isAvailable === false ? h('span', { class: 'soldout', text: 'Sold out' }) : null
        ]),
        h('p', { class: 'menu-item__desc', text: item.description || '' })
      ]),
      h('div', { class: 'menu-item__right' }, [
        h('span', { class: 'menu-item__price', text: money(item.priceInCents) }),
        h('span', { class: 'menu-item__cat', text: item.category || '' })
      ])
    ]);
  }

  function closeDrawerNow() {
    if (el.drawer.hidden) return;
    state.drawerId = null;
    el.drawer.hidden = true;
    el.scrim.hidden = true;
    document.body.style.overflow = '';
    syncUrl();
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  }

  async function openDrawerById(id) {
    if (!id) return;
    const requested = id;
    lastFocused = document.activeElement;
    replaceChildren(el.drawerBody, [drawerSkeleton('Opening…')]);
    el.drawerTitle.textContent = 'Menu';
    el.drawerSubtitle.textContent = '';
    el.scrim.hidden = false;
    el.drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    el.closeDrawer.focus();
    try {
      const payload = await apiGet('restaurants/' + encodeURIComponent(requested));
      if (state.drawerId !== requested) return;
      openDrawer((payload && payload.data) || { id: requested, name: 'Restaurant' });
    } catch (err) {
      if (state.drawerId !== requested) return;
      const info = describeError(err);
      el.drawerTitle.textContent = 'Menu unavailable';
      el.drawerSubtitle.textContent = requested;
      replaceChildren(el.drawerBody, [
        h('div', { class: 'state state--error' }, [
          h('p', { class: 'state__icon', 'aria-hidden': 'true', text: '⚠️' }),
          h('p', { class: 'state__title', text: info.title }),
          h('p', { class: 'state__body', text: info.body })
        ])
      ]);
    }
  }

  function drawerFocusables() {
    return Array.from(el.drawer.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return node.offsetParent !== null || node === document.activeElement; });
  }

  /* ---------------- theme ---------------- */

  function activeTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    el.themeGlyph.textContent = theme === 'light' ? '🌙' : '☀️';
    el.themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
  }

  function toggleTheme() {
    const next = activeTheme() === 'light' ? 'dark' : 'light';
    applyTheme(next);
    storageSet(THEME_KEY, next);
  }

  function followSystemTheme(event) {
    if (storageGet(THEME_KEY)) return;
    applyTheme(event.matches ? 'light' : 'dark');
  }

  /* ---------------- connection settings ---------------- */

  function setSettingsResult(message, kind) {
    el.settingsResult.textContent = message;
    el.settingsResult.dataset.state = kind || '';
  }

  async function checkHealth() {
    setConn('busy', 'Checking…');
    setSettingsResult('Testing ' + rootUrl() + '/health …', '');
    try {
      const response = await fetch(rootUrl() + '/health', { cache: 'no-store' });
      const payload = await response.json().catch(function () { return null; });
      if (!response.ok) throw new Error('status ' + response.status);
      setConn('ok', 'Connected');
      setSettingsResult('Healthy — status ' + (payload && payload.status ? payload.status : 'ok') + '.', 'ok');
    } catch (err) {
      setConn('error', 'Unreachable');
      setSettingsResult('No health response. Check the server and the base URL.', 'error');
    }
  }

  function applyBaseUrl(value) {
    const previous = state.baseUrl;
    state.baseUrl = normalizeBaseUrl(value);
    storageSet(BASE_URL_KEY, state.baseUrl);
    el.apiBase.value = state.baseUrl;
    el.settings.open = false;
    el.footerLink.href = state.baseUrl + '/restaurants?limit=5';
    if (state.baseUrl !== previous) {
      clearRetryTimer();
      state.retryAt = 0;
      state.error = null;
      loadPage({ reset: true });
    }
    checkHealth();
  }

  /* ---------------- events ---------------- */

  let searchTimer = null;

  el.filters.addEventListener('submit', function (event) {
    event.preventDefault();
    window.clearTimeout(searchTimer);
    state.search = el.search.value.trim();
    applyFilters();
  });

  el.search.addEventListener('input', function () {
    el.clearSearch.hidden = !el.search.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      state.search = el.search.value.trim();
      applyFilters();
    }, SEARCH_DEBOUNCE);
  });

  el.clearSearch.addEventListener('click', function () {
    window.clearTimeout(searchTimer);
    state.search = '';
    el.search.value = '';
    el.clearSearch.hidden = true;
    el.search.focus();
    applyFilters();
  });

  el.cuisine.addEventListener('change', function () { state.cuisine = el.cuisine.value; applyFilters(); });
  el.city.addEventListener('change', function () { state.city = el.city.value; applyFilters(); });
  el.rating.addEventListener('change', function () { state.minRating = el.rating.value; applyFilters(); });
  el.limit.addEventListener('change', function () { state.limit = el.limit.value; applyFilters(); });
  el.sort.addEventListener('change', function () {
    const parts = el.sort.value.split(':');
    state.sort = parts[0];
    state.order = parts[1];
    applyFilters();
  });
  el.openRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      state.isOpen = radio.value;
      applyFilters();
    });
  });

  el.clearAll.addEventListener('click', function () { resetFilters(); applyFilters(); });
  el.resetFilters.addEventListener('click', function () { resetFilters(); applyFilters(); });
  el.refresh.addEventListener('click', function () { clearRetryTimer(); state.retryAt = 0; state.error = null; loadPage({ reset: true }); });
  el.retry.addEventListener('click', function () { clearRetryTimer(); state.retryAt = 0; state.error = null; loadPage({ reset: true }); });
  el.loadMore.addEventListener('click', function () { loadPage({ reset: false }); });
  el.toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('scroll', renderToTop, { passive: true });

  el.themeToggle.addEventListener('click', toggleTheme);
  el.settingsForm.addEventListener('submit', function (event) {
    event.preventDefault();
    applyBaseUrl(el.apiBase.value);
  });
  el.healthCheck.addEventListener('click', checkHealth);

  el.closeDrawer.addEventListener('click', closeDrawerNow);
  el.scrim.addEventListener('click', closeDrawerNow);

  document.addEventListener('keydown', function (event) {
    if (el.drawer.hidden) return;
    if (event.key === 'Escape') {
      closeDrawerNow();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = drawerFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('popstate', function () {
    const wasOpen = !el.drawer.hidden;
    readUrl();
    syncControls();
    if (state.drawerId && el.drawer.hidden) openDrawerById(state.drawerId);
    else if (!state.drawerId && wasOpen) closeDrawerNow();
    loadPage({ reset: true });
  });

  /* ---------------- infinite scroll ---------------- */

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (state.loading || !state.hasMore || state.error) return;
        if (window.scrollY < AUTO_LOAD_SCROLL_THRESHOLD) return;
        loadPage({ reset: false });
      });
    }, { rootMargin: '320px 0px' });
    observer.observe(el.loadMoreWrap);
  }

  if (typeof window.matchMedia === 'function') {
    const scheme = window.matchMedia('(prefers-color-scheme: light)');
    if (typeof scheme.addEventListener === 'function') scheme.addEventListener('change', followSystemTheme);
  }

  /* ---------------- boot ---------------- */

  readUrl();
  fillFacets(el.cuisine, new Set(), KNOWN_CUISINES, state.cuisine, 'All cuisines');
  fillFacets(el.city, new Set(), KNOWN_CITIES, state.city, 'All cities');
  state.facetSignature = '#';
  syncControls();
  applyTheme(activeTheme());
  el.apiBase.value = state.baseUrl;
  el.footerLink.href = state.baseUrl + '/restaurants?limit=5';
  render();
  checkHealth();
  loadPage({ reset: true });
  if (state.drawerId) openDrawerById(state.drawerId);
})();
