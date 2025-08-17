// ChatGPT Thread Jump - ダークモード対応版
console.log('[CTN] Script started - Dark Mode Compatible');

// Global variables
let panel = null;
let jumpButton = null;
let currentTab = 'keywords';
let currentHighlights = [];
let currentHighlightIndex = -1;
let isResizing = false;

// Utility functions
function debug(...args) {
  console.debug('[CTN]', ...args);
}

function isDarkMode() {
  return document.documentElement.classList.contains('dark') ||
         document.body.classList.contains('dark') ||
         document.documentElement.getAttribute('data-theme') === 'dark' ||
         getComputedStyle(document.documentElement).getPropertyValue('color-scheme').includes('dark');
}

// Storage functions (using localStorage as fallback)
async function saveSettings(settings) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set(settings);
    } else {
      // Fallback to localStorage
      Object.keys(settings).forEach(key => {
        localStorage.setItem('ctn_' + key, JSON.stringify(settings[key]));
      });
    }
    debug('Settings saved:', settings);
  } catch (error) {
    debug('Failed to save settings:', error);
  }
}

async function loadSettings() {
  try {
    let settings;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['panelWidth', 'panelHeight']);
      settings = {
        panelWidth: result.panelWidth || 400,
        panelHeight: result.panelHeight || 500
      };
    } else {
      // Fallback to localStorage
      settings = {
        panelWidth: JSON.parse(localStorage.getItem('ctn_panelWidth')) || 400,
        panelHeight: JSON.parse(localStorage.getItem('ctn_panelHeight')) || 500
      };
    }
    debug('Settings loaded:', settings);
    return settings;
  } catch (error) {
    debug('Failed to load settings:', error);
    return { panelWidth: 400, panelHeight: 500 };
  }
}

// Create jump button with enhanced dark mode support
function createJumpButton() {
  console.log('[CTN] Creating button');
  
  jumpButton = document.createElement('button');
  jumpButton.className = 'ctn-jump-button';
  jumpButton.title = 'Thread Jump';
  jumpButton.innerHTML = '📋';
  
  jumpButton.addEventListener('click', function(e) {
    e.stopPropagation();
    togglePanel();
  });
  
  document.body.appendChild(jumpButton);
  console.log('[CTN] Button created');
}

// Message extraction functions
function getMessageElements() {
  const messages = [];
  const messageElements = document.querySelectorAll('[data-message-id]');
  
  debug('Found message elements:', messageElements.length);
  
  messageElements.forEach(function(el, index) {
    try {
      const messageId = el.getAttribute('data-message-id');
      if (!messageId) return;
      
      let role = el.getAttribute('data-message-author-role');
      
      if (!role) {
        // Enhanced role detection for ChatGPT
        const userIndicators = el.querySelector('[data-testid="conversation-turn-user"]') || 
                              el.querySelector('.font-semibold') ||
                              el.querySelector('img[alt*="User"]');
        const assistantIndicators = el.querySelector('[data-testid="conversation-turn-assistant"]') ||
                                   el.querySelector('svg[data-icon="openai"]') ||
                                   el.querySelector('.gizmo-bot-avatar');
        
        if (userIndicators) {
          role = 'user';
        } else if (assistantIndicators) {
          role = 'assistant';
        } else {
          // Fallback to alternating pattern
          const textContent = el.textContent.trim();
          if (textContent.length > 0) {
            role = index % 2 === 0 ? 'user' : 'assistant';
          }
        }
      }
      
      if (!role) return;
      
      const textContent = extractTextContent(el);
      if (textContent.trim().length === 0) return;
      
      const snippet = textContent.slice(0, 140).trim();
      const finalSnippet = snippet + (textContent.length > 140 ? '...' : '');
      
      messages.push({
        element: el,
        messageId: messageId,
        role: role,
        text: textContent.toLowerCase(),
        snippet: finalSnippet
      });
    } catch (error) {
      debug('Error processing message element:', error);
    }
  });
  
  debug('Processed messages:', messages.length);
  return messages;
}

function extractTextContent(element) {
  const clone = element.cloneNode(true);
  
  // Remove UI elements and extension-specific content
  const uiSelectors = [
    '.ctn-panel',
    '.ctn-jump-button',
    'button[aria-label]',
    '[role="button"]',
    '.copy-button',
    '.regenerate-button',
    '.feedback-button',
    '[data-testid*="button"]'
  ];
  
  uiSelectors.forEach(function(selector) {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(function(el) {
      el.remove();
    });
  });
  
  return clone.textContent || '';
}

// Enhanced scroll functions
function findScrollableRoot(target) {
  debug('Finding scrollable root for:', target);
  
  const candidates = [
    document.querySelector('#__next main'),
    document.querySelector('main[role="main"]'),
    document.querySelector('main'),
    document.querySelector('.chat-container'),
    document.scrollingElement,
    document.documentElement,
    document.body
  ];
  
  let parent = target.parentElement;
  while (parent && parent !== document.body) {
    candidates.unshift(parent);
    parent = parent.parentElement;
  }
  
  for (const candidate of candidates) {
    if (!candidate) continue;
    
    try {
      const style = getComputedStyle(candidate);
      const overflowY = style.overflowY;
      
      if (candidate.scrollHeight > candidate.clientHeight && 
          (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')) {
        
        const originalScrollTop = candidate.scrollTop;
        candidate.scrollTop += 1;
        const canScroll = candidate.scrollTop !== originalScrollTop;
        candidate.scrollTop = originalScrollTop;
        
        if (canScroll) {
          debug('Found scrollable root:', candidate);
          return candidate;
        }
      }
    } catch (error) {
      debug('Error testing scroll candidate:', error);
    }
  }
  
  debug('Using window as fallback scroll root');
  return window;
}

function scrollToElement(element) {
  debug('Scrolling to element:', element);
  
  const scrollRoot = findScrollableRoot(element);
  const targetRect = element.getBoundingClientRect();
  
  if (scrollRoot === window) {
    const offsetTop = targetRect.top + window.pageYOffset;
    const windowCenter = window.innerHeight / 2;
    const scrollPosition = offsetTop - windowCenter;
    
    window.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  } else {
    const containerRect = scrollRoot.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top;
    const scrollCenter = scrollRoot.clientHeight / 2;
    const newScrollTop = scrollRoot.scrollTop + relativeTop - scrollCenter;
    
    scrollRoot.scrollTo({
      top: Math.max(0, newScrollTop),
      behavior: 'smooth'
    });
  }
}

// Toggle panel
function togglePanel() {
  debug('Toggle panel called. Current display:', panel ? panel.style.display : 'null');
  
  if (panel && panel.style.display !== 'none' && panel.style.visibility !== 'hidden') {
    closePanel();
  } else {
    openPanel();
  }
}

// Open panel
async function openPanel() {
  if (!panel) {
    await createPanel();
  }
  
  // 表示設定を明示的に行う
  panel.style.display = 'flex';
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  
  // Update dark mode class
  if (isDarkMode()) {
    panel.classList.add('dark');
  } else {
    panel.classList.remove('dark');
  }
  
  debug('Panel opened');
  
  // Focus search input
  const searchInput = panel.querySelector('.ctn-search-input');
  if (searchInput) {
    requestAnimationFrame(function() {
      searchInput.focus();
    });
  }
  
  // Add outside click listener
  requestAnimationFrame(function() {
    document.addEventListener('mousedown', handleOutsideClick);
  });
}

// Close panel
function closePanel() {
  if (panel) {
    panel.style.display = 'none';
    panel.style.visibility = 'hidden';
    document.removeEventListener('mousedown', handleOutsideClick);
    debug('Panel closed');
  }
}

// Handle outside click
function handleOutsideClick(e) {
  if (!panel || !jumpButton) return;
  
  // パネルが非表示の場合は処理しない
  if (panel.style.display === 'none' || panel.style.visibility === 'hidden') {
    return;
  }
  
  if (!panel.contains(e.target) && !jumpButton.contains(e.target)) {
    closePanel();
  }
}

// Create panel with CSS classes
async function createPanel() {
  const settings = await loadSettings();
  
  panel = document.createElement('div');
  panel.className = 'ctn-panel';
  if (isDarkMode()) {
    panel.classList.add('dark');
  }
  
  // 初期サイズを設定（!importantを上書きできるように）
  panel.style.setProperty('width', settings.panelWidth + 'px', 'important');
  panel.style.setProperty('height', settings.panelHeight + 'px', 'important');
  panel.style.setProperty('display', 'flex', 'important');
  panel.style.setProperty('visibility', 'visible', 'important');
  
  debug('Creating panel with size:', settings.panelWidth, settings.panelHeight);
  
  // Create header
  const header = document.createElement('div');
  header.className = 'ctn-panel-header';
  
  // Create tabs
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'ctn-tabs';
  
  const tabData = [
    { id: 'keywords', text: 'All', active: true },
    { id: 'user', text: 'My Posts', active: false },
    { id: 'assistant', text: 'AI', active: false }
  ];
  
  tabData.forEach(function(tabInfo) {
    const tab = document.createElement('button');
    tab.className = 'ctn-tab' + (tabInfo.active ? ' active' : '');
    tab.setAttribute('data-tab', tabInfo.id);
    tab.textContent = tabInfo.text;
    
    tab.addEventListener('click', function(e) {
      e.stopPropagation();
      switchTab(tabInfo.id);
    });
    
    tabsContainer.appendChild(tab);
  });
  
  // Create search container
  const searchContainer = document.createElement('div');
  searchContainer.className = 'ctn-search-container';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ctn-search-input';
  searchInput.placeholder = 'Filter all messages...';
  
  searchInput.addEventListener('input', function() {
    updatePanelContent();
  });
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      updatePanelContent();
    }
  });
  
  searchContainer.appendChild(searchInput);
  
  header.appendChild(tabsContainer);
  header.appendChild(searchContainer);
  
  // Create body
  const body = document.createElement('div');
  body.className = 'ctn-panel-body';
  
  const snippetList = document.createElement('div');
  snippetList.className = 'ctn-snippet-list';
  body.appendChild(snippetList);
  
  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'ctn-resize-handle';
  setupResizeHandle(resizeHandle);
  
  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(resizeHandle);
  
  document.body.appendChild(panel);
  
  // Prevent panel clicks from closing
  panel.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  panel.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  debug('Panel created and added to DOM');
  updatePanelContent();
}

// Setup resize handle with improved usability
function setupResizeHandle(resizeHandle) {
  let startX, startY, startWidth, startHeight;
  let mouseMoveThreshold = 0; // マウス移動の閾値をなくす
  let isMouseDown = false;
  
  // リサイズハンドルとパネルの右下端の両方でリサイズを開始できるようにする
  function addResizeListeners(element) {
    element.addEventListener('mousedown', startResize);
  }
  
  function startResize(e) {
    // 右クリックは無視
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    debug('Resize started');
    isMouseDown = true;
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    
    // パネルにリサイズ中のクラスを追加
    panel.classList.add('resizing');
    
    // グローバルイベントリスナーを追加
    document.addEventListener('mousemove', handleResize, { passive: false });
    document.addEventListener('mouseup', stopResize);
    
    // リサイズ中の視覚的フィードバック
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    panel.style.pointerEvents = 'auto';
    
    // 他のすべての要素の pointer-events を無効化
    document.querySelectorAll('*').forEach(el => {
      if (!el.closest('.ctn-panel')) {
        el.style.pointerEvents = 'none';
      }
    });
  }
  
  function handleResize(e) {
    if (!isResizing || !isMouseDown) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // より滑らかなリサイズ（小さな動きでも反応）
    const newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, startWidth + deltaX));
    const newHeight = Math.max(300, Math.min(window.innerHeight * 0.9, startHeight + deltaY));
    
    // リアルタイムでサイズを更新
    panel.style.setProperty('width', newWidth + 'px', 'important');
    panel.style.setProperty('height', newHeight + 'px', 'important');
    
    debug('Resizing to:', newWidth, newHeight);
    
    // パネルが画面外に出ないように調整
    const rect = panel.getBoundingClientRect();
    if (rect.left < 10) {
      panel.style.setProperty('right', '20px', 'important');
      panel.style.removeProperty('left');
    }
    if (rect.top < 10) {
      panel.style.setProperty('bottom', '180px', 'important');
      panel.style.removeProperty('top');
    }
  }
  
  function stopResize(e) {
    if (!isResizing) return;
    
    debug('Resize stopped');
    isMouseDown = false;
    isResizing = false;
    
    // クラスを削除
    panel.classList.remove('resizing');
    
    // イベントリスナーを削除
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    // スタイルを復元
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    
    // すべての要素のpointer-eventsを復元
    document.querySelectorAll('*').forEach(el => {
      el.style.pointerEvents = '';
    });
    
    // 設定を保存
    const rect = panel.getBoundingClientRect();
    saveSettings({
      panelWidth: Math.round(rect.width),
      panelHeight: Math.round(rect.height)
    });
    
    debug('Final size saved:', Math.round(rect.width), Math.round(rect.height));
  }
  
  // リサイズハンドル自体にリスナーを追加
  addResizeListeners(resizeHandle);
  
  // パネルの右下エリアにもリサイズ機能を追加
  panel.addEventListener('mousedown', function(e) {
    const rect = panel.getBoundingClientRect();
    const isInResizeArea = (
      e.clientX > rect.right - 40 && 
      e.clientY > rect.bottom - 40
    );
    
    if (isInResizeArea) {
      startResize(e);
    }
  });
  
  // より良いホバー効果
  resizeHandle.addEventListener('mouseenter', function() {
    document.body.style.cursor = 'se-resize';
  });
  
  resizeHandle.addEventListener('mouseleave', function() {
    if (!isResizing) {
      document.body.style.cursor = '';
    }
  });
}

// Switch tab
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab styles
  const tabs = panel.querySelectorAll('.ctn-tab');
  tabs.forEach(function(tab) {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update placeholder
  const searchInput = panel.querySelector('.ctn-search-input');
  const placeholders = {
    keywords: 'Filter all messages...',
    user: 'Filter my posts...',
    assistant: 'Filter AI answers...'
  };
  searchInput.placeholder = placeholders[tabName] || '';
  
  updatePanelContent();
}

// Update panel content with improved text visibility
function updatePanelContent() {
  const snippetList = panel.querySelector('.ctn-snippet-list');
  const searchInput = panel.querySelector('.ctn-search-input');
  
  if (!snippetList || !searchInput) return;
  
  // Clear previous content
  snippetList.innerHTML = '';
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const messages = getMessageElements();
  let filteredMessages = messages;
  
  // Filter by tab
  if (currentTab === 'user') {
    filteredMessages = messages.filter(function(msg) {
      return msg.role === 'user';
    });
  } else if (currentTab === 'assistant') {
    filteredMessages = messages.filter(function(msg) {
      return msg.role === 'assistant';
    });
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredMessages = filteredMessages.filter(function(msg) {
      return msg.text.indexOf(searchTerm) !== -1;
    });
  }
  
  // Show results
  if (filteredMessages.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'ctn-no-results';
    noResults.textContent = searchTerm ? 'No messages found' : 'No messages found';
    snippetList.appendChild(noResults);
    return;
  }
  
  filteredMessages.forEach(function(message) {
    const item = document.createElement('div');
    item.className = 'ctn-snippet-item';
    
    // Create label
    const label = document.createElement('span');
    label.className = 'ctn-snippet-label ' + message.role;
    label.textContent = '[' + (message.role === 'user' ? 'You' : 'AI') + ']';
    
    // Create text element with enhanced visibility
    const text = document.createElement('span');
    text.className = 'ctn-snippet-text';
    
    // Apply search highlighting if needed
    if (searchTerm) {
      const lowerSnippet = message.snippet.toLowerCase();
      const index = lowerSnippet.indexOf(searchTerm);
      if (index !== -1) {
        const before = message.snippet.substring(0, index);
        const match = message.snippet.substring(index, index + searchTerm.length);
        const after = message.snippet.substring(index + searchTerm.length);
        
        const beforeText = document.createTextNode(before);
        const highlightElement = document.createElement('mark');
        highlightElement.className = 'ctn-search-highlight';
        highlightElement.textContent = match;
        const afterText = document.createTextNode(after);
        
        text.appendChild(beforeText);
        text.appendChild(highlightElement);
        text.appendChild(afterText);
      } else {
        text.textContent = message.snippet;
      }
    } else {
      text.textContent = message.snippet;
    }
    
    item.appendChild(label);
    item.appendChild(text);
    
    // Click handler
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Scroll to element
      scrollToElement(message.element);
      
      // Close panel
      closePanel();
    });
    
    snippetList.appendChild(item);
  });
}

// Setup theme observer to handle dark mode changes
function setupThemeObserver() {
  const observer = new MutationObserver(function() {
    if (panel) {
      if (isDarkMode()) {
        panel.classList.add('dark');
      } else {
        panel.classList.remove('dark');
      }
    }
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });
  
  return observer;
}

// Setup content observer for dynamic updates
function setupContentObserver() {
  const observer = new MutationObserver(function(mutations) {
    let shouldUpdate = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && (node.matches('[data-message-id]') || node.querySelector('[data-message-id]'))) {
              shouldUpdate = true;
            }
          }
        });
      }
    });
    
    if (shouldUpdate && panel && panel.style.display !== 'none') {
      updatePanelContent();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}

// Keyboard handler
function handleKeyboard(e) {
  if (e.key === 'Escape' && panel && panel.style.display !== 'none') {
    e.preventDefault();
    closePanel();
  }
}

// Cleanup function
function cleanup() {
  if (panel) {
    panel.remove();
    panel = null;
  }
  
  if (jumpButton) {
    jumpButton.remove();
    jumpButton = null;
  }
  
  document.removeEventListener('keydown', handleKeyboard);
  document.removeEventListener('mousedown', handleOutsideClick);
}

// Initialize
function initialize() {
  console.log('[CTN] Initializing with dark mode support');
  
  cleanup();
  createJumpButton();
  
  // Setup event listeners
  document.addEventListener('keydown', handleKeyboard);
  
  // Setup observers
  setupContentObserver();
  setupThemeObserver();
  
  console.log('[CTN] Initialized successfully');
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[CTN] Setup complete with dark mode support');
