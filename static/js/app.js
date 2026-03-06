/**
 * AI Meeting Assistant - Frontend JavaScript
 * Handles audio upload, API communication, and results rendering
 */

// ====== STATE ======
let currentFile = null;
let analysisResults = null;

// ====== DOM READY ======
document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
  checkApiStatus();
  setupFileInput();
});

// ====== API STATUS CHECK ======
async function checkApiStatus() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  
  dot.className = 'badge-dot checking';
  text.textContent = 'Checking API...';
  
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    
    if (data.status === 'healthy' && data.api_key_configured) {
      dot.className = 'badge-dot online';
      text.textContent = 'API Ready';
    } else {
      dot.className = 'badge-dot offline';
      text.textContent = 'API Key Missing';
    }
  } catch {
    dot.className = 'badge-dot offline';
    text.textContent = 'Server Offline';
  }
}

// ====== FILE INPUT SETUP ======
function setupFileInput() {
  const input = document.getElementById('audioInput');
  input.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });
}

// ====== DRAG AND DROP ======
function initDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    uploadArea.addEventListener(evt, preventDefaults, false);
    document.body.addEventListener(evt, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(evt => {
    uploadArea.addEventListener(evt, () => uploadArea.classList.add('drag-over'));
  });
  
  ['dragleave', 'drop'].forEach(evt => {
    uploadArea.addEventListener(evt, () => uploadArea.classList.remove('drag-over'));
  });
  
  uploadArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelected(files[0]);
  });
  
  // Click to open file browser
  uploadArea.addEventListener('click', (e) => {
    if (e.target.classList.contains('browse-btn') || e.target === uploadArea || e.target.closest('.upload-area') === uploadArea) {
      document.getElementById('audioInput').click();
    }
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ====== FILE HANDLING ======
function handleFileSelected(file) {
  const ALLOWED = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/m4a', 'audio/x-m4a', 'video/mp4', 'video/webm'];
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  
  if (file.size > MAX_SIZE) {
    showError('File is too large. Maximum size is 100MB.');
    return;
  }
  
  currentFile = file;
  
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatBytes(file.size);
  
  document.getElementById('fileInfo').classList.remove('hidden');
  document.getElementById('errorSection').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
}

function removeFile() {
  currentFile = null;
  document.getElementById('audioInput').value = '';
  document.getElementById('fileInfo').classList.add('hidden');
}

// ====== ANALYZE AUDIO ======
async function analyzeAudio() {
  if (!currentFile) return;
  
  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.disabled = true;
  
  // Show processing
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('errorSection').classList.add('hidden');
  document.getElementById('processingSection').classList.remove('hidden');
  
  // Animate processing steps
  animateProcessingSteps();
  
  const formData = new FormData();
  formData.append('audio', currentFile);
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Analysis failed. Please try again.');
    }
    
    // Store results
    analysisResults = data;
    
    // Show results
    document.getElementById('processingSection').classList.add('hidden');
    renderResults(data);
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
  } catch (err) {
    document.getElementById('processingSection').classList.add('hidden');
    showError(err.message);
    document.getElementById('fileInfo').classList.remove('hidden');
  } finally {
    analyzeBtn.disabled = false;
  }
}

// ====== PROCESSING ANIMATION ======
function animateProcessingSteps() {
  const steps = ['step1', 'step2', 'step3'];
  const texts = [
    'Transcribing audio with Whisper...',
    'Analyzing meeting content with AI...',
    'Generating structured insights...'
  ];
  
  steps.forEach(s => {
    document.getElementById(s).classList.remove('active', 'done');
  });
  
  document.getElementById('step1').classList.add('active');
  document.getElementById('processingText').textContent = texts[0];
  
  let i = 1;
  const interval = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(interval);
      return;
    }
    document.getElementById(steps[i-1]).classList.remove('active');
    document.getElementById(steps[i-1]).classList.add('done');
    document.getElementById(steps[i]).classList.add('active');
    document.getElementById('processingText').textContent = texts[i];
    i++;
  }, 3000);
}

// ====== RENDER RESULTS ======
function renderResults(data) {
  const { transcript, analysis } = data;
  
  // Stats
  const wordCount = transcript ? transcript.trim().split(/\s+/).length : 0;
  document.getElementById('statWords').textContent = wordCount.toLocaleString();
  document.getElementById('statActions').textContent = analysis.action_items?.length || 0;
  document.getElementById('statTasks').textContent = analysis.tasks?.length || 0;
  document.getElementById('statDecisions').textContent = analysis.key_decisions?.length || 0;
  
  // Summary
  document.getElementById('summaryText').textContent = analysis.summary || 'No summary available.';
  
  // Action Items
  const actionList = document.getElementById('actionItemsList');
  const actionCount = document.getElementById('actionCount');
  actionCount.textContent = analysis.action_items?.length || 0;
  
  if (analysis.action_items?.length) {
    actionList.innerHTML = analysis.action_items.map(item => `
      <div class="action-item">
        <p class="item-title">✓ ${escapeHtml(item.item)}</p>
        <div class="item-meta">
          <span class="meta-tag">👤 ${escapeHtml(item.owner || 'TBD')}</span>
          <span class="meta-tag">📅 ${escapeHtml(item.deadline || 'Not specified')}</span>
        </div>
      </div>
    `).join('');
  } else {
    actionList.innerHTML = '<p class="empty-state">No action items identified</p>';
  }
  
  // Tasks
  const taskList = document.getElementById('tasksList');
  const taskCount = document.getElementById('taskCount');
  taskCount.textContent = analysis.tasks?.length || 0;
  
  if (analysis.tasks?.length) {
    taskList.innerHTML = analysis.tasks.map(task => `
      <div class="task-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <p class="item-title">📌 ${escapeHtml(task.task)}</p>
          <span class="priority-badge ${(task.priority || 'medium').toLowerCase()}">${escapeHtml(task.priority || 'Medium')}</span>
        </div>
        ${task.notes && task.notes !== 'N/A' ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ''}
      </div>
    `).join('');
  } else {
    taskList.innerHTML = '<p class="empty-state">No tasks identified</p>';
  }
  
  // Key Decisions
  const decisionList = document.getElementById('decisionsList');
  const decisionCount = document.getElementById('decisionCount');
  decisionCount.textContent = analysis.key_decisions?.length || 0;
  
  if (analysis.key_decisions?.length) {
    decisionList.innerHTML = analysis.key_decisions.map(d => `
      <div class="decision-item">
        <p class="item-title">🎯 ${escapeHtml(d.decision)}</p>
        ${d.rationale && d.rationale !== 'Not discussed' ? `<p class="decision-detail">💡 <em>Rationale:</em> ${escapeHtml(d.rationale)}</p>` : ''}
        ${d.impact ? `<p class="decision-detail">📈 <em>Impact:</em> ${escapeHtml(d.impact)}</p>` : ''}
      </div>
    `).join('');
  } else {
    decisionList.innerHTML = '<p class="empty-state">No key decisions identified</p>';
  }
  
  // Transcript
  document.getElementById('transcriptText').textContent = transcript || 'Transcript not available.';
}

// ====== TRANSCRIPT ACCORDION ======
function toggleTranscript() {
  const body = document.getElementById('transcriptBody');
  const arrow = document.getElementById('accordionArrow');
  
  if (body.classList.contains('hidden')) {
    body.classList.remove('hidden');
    arrow.textContent = '▲';
  } else {
    body.classList.add('hidden');
    arrow.textContent = '▼';
  }
}

// ====== COPY & DOWNLOAD ======
function copyResults() {
  if (!analysisResults) return;
  
  const { transcript, analysis } = analysisResults;
  
  let text = `AI MEETING ASSISTANT - ANALYSIS RESULTS
==========================================

📝 SUMMARY
${analysis.summary}

✅ ACTION ITEMS (${analysis.action_items?.length || 0})
${analysis.action_items?.map((a, i) => `${i+1}. ${a.item}\n   Owner: ${a.owner} | Deadline: ${a.deadline}`).join('\n') || 'None identified'}

📌 TASKS (${analysis.tasks?.length || 0})
${analysis.tasks?.map((t, i) => `${i+1}. [${t.priority}] ${t.task}${t.notes ? '\n   Note: '+t.notes : ''}`).join('\n') || 'None identified'}

🎯 KEY DECISIONS (${analysis.key_decisions?.length || 0})
${analysis.key_decisions?.map((d, i) => `${i+1}. ${d.decision}${d.rationale !== 'Not discussed' ? '\n   Rationale: '+d.rationale : ''}`).join('\n') || 'None identified'}

📄 TRANSCRIPT
${transcript}
  `;
  
  navigator.clipboard.writeText(text.trim()).then(() => {
    const btn = document.querySelector('.action-btn');
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function downloadResults() {
  if (!analysisResults) return;
  
  const { transcript, analysis } = analysisResults;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  const content = {
    generated_at: new Date().toISOString(),
    summary: analysis.summary,
    action_items: analysis.action_items,
    tasks: analysis.tasks,
    key_decisions: analysis.key_decisions,
    transcript: transcript
  };
  
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-analysis-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ====== RESET ======
function resetApp() {
  currentFile = null;
  analysisResults = null;
  document.getElementById('audioInput').value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('errorSection').classList.add('hidden');
  document.getElementById('processingSection').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== HELPERS ======
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorSection').classList.remove('hidden');
  document.getElementById('processingSection').classList.add('hidden');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text || '')));
  return div.innerHTML;
}
