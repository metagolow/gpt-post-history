// ChatGPT Thread Jump - Minimal CSP Safe Version
console.log('[CTN] Script started');

// Global variables
let panel = null;
let jumpButton = null;
let currentTab = 'keywords';

// Create jump button
function createJumpButton() {
  console.log('[CTN] Creating button');
  
  jumpButton = document.createElement('button');
  jumpButton.className = 'ctn-jump-button';
  jumpButton.title = 'Thread Jump';
  jumpButton.innerHTML = '📋';
  
  // Set styles directly
  jumpButton.style.position = 'fixed';
  jumpButton.style.bottom = '120px';
  jumpButton.style.right = '20px';
  jumpButton.style.width = '50px';
  jumpButton.style.height = '50px';
  jumpButton.style.background = '#2563eb';
  jumpButton.style.border = 'none';
  jumpButton.style.borderRadius = '25px';
  jumpButton.style.fontSize = '24px';
  jumpButton.style.color = 'white';
  jumpButton.style.cursor = 'pointer';
  jumpButton.style.zIndex = '2147483647';
  jumpButton.style.display = 'flex';
  jumpButton.style.alignItems = 'center';
  jumpButton.style.justifyContent = 'center';
  
  jumpButton.addEventListener('click', function(e) {
    e.stopPropagation();
    togglePanel();
  });
  
  document.body.appendChild(jumpButton);
  console.log('[CTN] Button created');
}

// Toggle panel
function togglePanel() {
  if (panel && panel.style.display !== 'none') {
    closePanel();
  } else {
    openPanel();
  }
}

// Open panel
function openPanel() {
  if (!panel) {
    createPanel();
  }
  panel.style.display = 'flex';
  
  // Focus search input
  const searchInput = panel.querySelector('.ctn-search-input');
  if (searchInput) {
    searchInput.focus();
  }
  
  // Add outside click listener
  document.addEventListener('mousedown', handleOutsideClick);
}

// Close panel
function closePanel() {
  if (panel) {
    panel.style.display = 'none';
    document.removeEventListener('mousedown', handleOutsideClick);
  }
}

// Handle outside click
function handleOutsideClick(e) {
  if (!panel || !jumpButton) return;
  
  if (!panel.contains(e.target) && !jumpButton.contains(e.target)) {
    closePanel();
  }
}

// Create panel
function createPanel() {
  panel = document.createElement('div');
  panel.className = 'ctn-panel';
  
  // Set panel styles
  panel.style.position = 'fixed';
  panel.style.bottom = '180px';
  panel.style.right = '20px';
  panel.style.width = '400px';
  panel.style.height = '500px';
  panel.style.background = 'white';
  panel.style.border = '1px solid #d1d5db';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
  panel.style.zIndex = '2147483647';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.overflow = 'hidden';
  panel.style.resize = 'both';
  panel.style.minWidth = '300px';
  panel.style.minHeight = '300px';
  panel.style.maxWidth = '80vw';
  panel.style.maxHeight = '80vh';
  
  // Create header
  const header = document.createElement('div');
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid #e5e7eb';
  header.style.background = '#f9fafb';
  
  // Create tabs
  const tabsContainer = document.createElement('div');
  tabsContainer.style.display = 'flex';
  tabsContainer.style.gap = '4px';
  tabsContainer.style.marginBottom = '12px';
  
  const tabData = [
    { id: 'keywords', text: 'All', active: true },
    { id: 'user', text: 'My Posts', active: false },
    { id: 'assistant', text: 'AI', active: false }
  ];
  
  tabData.forEach(function(tabInfo) {
    const tab = document.createElement('button');
    tab.textContent = tabInfo.text;
    tab.setAttribute('data-tab', tabInfo.id);
    
    // Tab styles
    tab.style.padding = '4px 8px';
    tab.style.border = '1px solid #d1d5db';
    tab.style.borderRadius = '4px';
    tab.style.cursor = 'pointer';
    tab.style.fontSize = '11px';
    tab.style.fontWeight = '500';
    tab.style.whiteSpace = 'nowrap';
    
    if (tabInfo.active) {
      tab.style.background = '#10a37f';
      tab.style.color = 'white';
      tab.style.borderColor = '#10a37f';
    } else {
      tab.style.background = 'white';
      tab.style.color = 'black';
    }
    
    tab.addEventListener('click', function(e) {
      e.stopPropagation();
      switchTab(tabInfo.id);
    });
    
    tabsContainer.appendChild(tab);
  });
  
  // Create search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ctn-search-input';
  searchInput.placeholder = 'Filter all messages...';
  searchInput.style.width = '100%';
  searchInput.style.padding = '8px 12px';
  searchInput.style.border = '1px solid #d1d5db';
  searchInput.style.borderRadius = '6px';
  searchInput.style.fontSize = '14px';
  searchInput.style.outline = 'none';
  
  searchInput.addEventListener('input', function() {
    updatePanelContent();
  });
  
  header.appendChild(tabsContainer);
  header.appendChild(searchInput);
  
  // Create body
  const body = document.createElement('div');
  body.style.flex = '1';
  body.style.overflowY = 'auto';
  body.style.padding = '12px';
  
  const snippetList = document.createElement('div');
  snippetList.className = 'ctn-snippet-list';
  snippetList.style.display = 'flex';
  snippetList.style.flexDirection = 'column';
  snippetList.style.gap = '8px';
  
  body.appendChild(snippetList);
  
  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'ctn-resize-handle';
  resizeHandle.style.position = 'absolute';
  resizeHandle.style.bottom = '0';
  resizeHandle.style.right = '0';
  resizeHandle.style.width = '20px';
  resizeHandle.style.height = '20px';
  resizeHandle.style.cursor = 'se-resize';
  resizeHandle.style.background = 'linear-gradient(-45deg, transparent 0%, transparent 25%, #ccc 25%, #ccc 30%, transparent 30%, transparent 50%, #ccc 50%, #ccc 55%, transparent 55%, transparent 75%, #ccc 75%, #ccc 80%, transparent 80%)';
  resizeHandle.style.borderBottomRightRadius = '12px';
  
  // Add resize functionality
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  resizeHandle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  });
  
  function handleResize(e) {
    if (!isResizing) return;
    
    const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, startWidth + e.clientX - startX));
    const newHeight = Math.max(300, Math.min(window.innerHeight * 0.8, startHeight + e.clientY - startY));
    
    panel.style.width = newWidth + 'px';
    panel.style.height = newHeight + 'px';
    
    // Keep panel on screen
    const rect = panel.getBoundingClientRect();
    if (rect.left < 0) {
      panel.style.right = '20px';
      panel.style.left = 'auto';
    }
    if (rect.top < 0) {
      panel.style.bottom = '180px';
      panel.style.top = 'auto';
    }
  }
  
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }
  
  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(resizeHandle);
  
  document.body.appendChild(panel);
  
  // Prevent panel clicks from closing
  panel.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  updatePanelContent();
}

// Switch tab
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab styles
  const tabs = panel.querySelectorAll('[data-tab]');
  tabs.forEach(function(tab) {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.style.background = '#10a37f';
      tab.style.color = 'white';
      tab.style.borderColor = '#10a37f';
    } else {
      tab.style.background = 'white';
      tab.style.color = 'black';
      tab.style.borderColor = '#d1d5db';
    }
  });
  
  // Update placeholder
  const searchInput = panel.querySelector('.ctn-search-input');
  if (tabName === 'keywords') {
    searchInput.placeholder = 'Filter all messages...';
  } else if (tabName === 'user') {
    searchInput.placeholder = 'Filter my posts...';
  } else if (tabName === 'assistant') {
    searchInput.placeholder = 'Filter AI answers...';
  }
  
  updatePanelContent();
}

// Get messages
function getMessageElements() {
  const messages = [];
  const messageElements = document.querySelectorAll('[data-message-id]');
  
  messageElements.forEach(function(el, index) {
    const messageId = el.getAttribute('data-message-id');
    if (!messageId) return;
    
    let role = el.getAttribute('data-message-author-role');
    
    if (!role) {
      // Simple role detection
      if (index % 2 === 0) {
        role = 'user';
      } else {
        role = 'assistant';
      }
    }
    
    const textContent = el.textContent || '';
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
  });
  
  return messages;
}

// Update panel content
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
    noResults.textContent = searchTerm ? 'No messages found' : 'No messages found';
    noResults.style.textAlign = 'center';
    noResults.style.color = '#6b7280';
    noResults.style.fontStyle = 'italic';
    noResults.style.padding = '32px';
    snippetList.appendChild(noResults);
    return;
  }
  
  filteredMessages.forEach(function(message) {
    const item = document.createElement('div');
    item.style.padding = '12px';
    item.style.border = '1px solid #e5e7eb';
    item.style.borderRadius = '8px';
    item.style.cursor = 'pointer';
    item.style.background = 'white';
    item.style.fontSize = '13px';
    item.style.lineHeight = '1.4';
    
    // Hover effect
    item.addEventListener('mouseenter', function() {
      item.style.background = '#f3f4f6';
      item.style.borderColor = '#10a37f';
    });
    
    item.addEventListener('mouseleave', function() {
      item.style.background = 'white';
      item.style.borderColor = '#e5e7eb';
    });
    
    // Create label
    const label = document.createElement('span');
    label.textContent = message.role === 'user' ? '[You]' : '[AI]';
    label.style.display = 'inline-block';
    label.style.padding = '2px 6px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.style.marginRight = '8px';
    label.style.marginBottom = '4px';
    
    if (message.role === 'user') {
      label.style.background = '#dbeafe';
      label.style.color = '#1e40af';
    } else {
      label.style.background = '#dcfce7';
      label.style.color = '#166534';
    }
    
    // Create text
    const text = document.createElement('span');
    text.textContent = message.snippet;
    text.style.display = 'block';
    
    item.appendChild(label);
    item.appendChild(text);
    
    // Click handler
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Scroll to element
      message.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Close panel
      closePanel();
    });
    
    snippetList.appendChild(item);
  });
}

// Initialize
function initialize() {
  console.log('[CTN] Initializing');
  createJumpButton();
  console.log('[CTN] Initialized');
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[CTN] Setup complete');