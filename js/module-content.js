// MODULE CONTENT EDITOR — materials

function initMaterialCrud() {
  const modal = document.getElementById('material-modal');
  if (!modal) return;

  const form = document.getElementById('material-form');
  const titleField = document.getElementById('material-modal-title');
  const nameInput = document.getElementById('material-name-input');
  const typeInput = document.getElementById('material-type-input');
  const fileInput = document.getElementById('material-file-input');
  const fileNameLabel = document.getElementById('material-file-name');
  const urlInput = document.getElementById('material-url-input');
  const list = document.getElementById('materials-list');

  let editingRow = null;

  function updateTypeFields() {
    document.querySelectorAll('.material-type-field').forEach(el => {
      el.classList.toggle('active', el.dataset.type === typeInput.value);
    });
  }

  typeInput?.addEventListener('change', updateTypeFields);

  fileInput?.addEventListener('change', () => {
    fileNameLabel.textContent = fileInput.files[0]?.name || 'No file selected';
  });

  document.getElementById('add-material-btn')?.addEventListener('click', () => {
    editingRow = null;
    titleField.textContent = 'Add Material';
    form.reset();
    fileNameLabel.textContent = 'No file selected';
    typeInput.value = 'document';
    updateTypeFields();
    openModal(modal);
  });

  function wireRowButtons() {
    document.querySelectorAll('.edit-material-btn').forEach(btn => {
      btn.onclick = () => {
        editingRow = btn.closest('.material-row');
        titleField.textContent = 'Edit Material';
        nameInput.value = editingRow.querySelector('.material-title')?.textContent.trim() || '';
        typeInput.value = editingRow.dataset.type || 'document';
        updateTypeFields();
        openModal(modal);
      };
    });

    document.querySelectorAll('.delete-material-btn').forEach(btn => {
      btn.onclick = () => {
        const row = btn.closest('.material-row');
        const name = row.querySelector('.material-title')?.textContent.trim();
        if (confirm(`Delete material "${name}"? This cannot be undone.`)) {
          row.remove();
          showToast(`Material "${name}" deleted.`, 'danger');
        }
      };
    });
  }

  wireRowButtons();
  updateTypeFields();

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = typeInput.value;
    const isVideo = type === 'video-link';
    const iconClass = type === 'document' ? 'document' : 'video';
    const metaText = type === 'document'
      ? (fileInput.files[0]?.name || 'No file uploaded')
      : type === 'video-upload'
        ? (fileInput.files[0]?.name || 'No file uploaded')
        : (urlInput.value || 'No URL set');
    const typeLabel = type === 'document' ? 'Document' : type === 'video-upload' ? 'Video (uploaded)' : 'Video (link)';

    if (editingRow) {
      editingRow.dataset.type = type;
      editingRow.querySelector('.material-icon').className = `material-icon ${iconClass}`;
      editingRow.querySelector('.material-title').textContent = nameInput.value;
      editingRow.querySelector('.material-meta').textContent = `${typeLabel} · ${metaText}`;
      showToast('Material updated.', 'success');
    } else if (list) {
      const row = document.createElement('div');
      row.className = 'material-row';
      row.dataset.type = type;
      row.innerHTML = `
        <span class="material-icon ${iconClass}">
          ${iconClass === 'document'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75zM9 12h6M9 15.75h6"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-2.36a.75.75 0 011.03.67v6.38a.75.75 0 01-1.03.67L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"/></svg>'}
        </span>
        <div class="material-info">
          <div class="material-title"></div>
          <div class="material-meta"></div>
        </div>
        <div class="material-actions">
          <button type="button" class="icon-btn edit-material-btn" aria-label="Edit material">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
          </button>
          <button type="button" class="icon-btn danger delete-material-btn" aria-label="Delete material">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
          </button>
        </div>
      `;
      row.querySelector('.material-title').textContent = nameInput.value;
      row.querySelector('.material-meta').textContent = `${typeLabel} · ${metaText}`;
      list.appendChild(row);
      wireRowButtons();
      showToast('Material added. (Demo only — file is not actually uploaded.)', 'success');
    }

    closeModal(modal);
  });
}

// MODULE CONTENT EDITOR — quiz questions

function initQuestionCrud() {
  const modal = document.getElementById('question-modal');
  if (!modal) return;

  const form = document.getElementById('question-form');
  const titleField = document.getElementById('question-modal-title');
  const questionInput = document.getElementById('question-text-input');
  const optionInputs = [
    document.getElementById('option-a-input'),
    document.getElementById('option-b-input'),
    document.getElementById('option-c-input'),
    document.getElementById('option-d-input'),
  ];
  const list = document.getElementById('questions-list');

  let editingRow = null;

  document.getElementById('add-question-btn')?.addEventListener('click', () => {
    editingRow = null;
    titleField.textContent = 'Add Quiz Question';
    form.reset();
    openModal(modal);
  });

  function wireRowButtons() {
    document.querySelectorAll('.delete-question-btn').forEach(btn => {
      btn.onclick = () => {
        const row = btn.closest('.question-manage-row');
        if (confirm('Delete this question? This cannot be undone.')) {
          row.remove();
          showToast('Question deleted.', 'danger');
        }
      };
    });
  }

  wireRowButtons();

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const correctRadio = form.querySelector('input[name="correct-option"]:checked');
    if (!correctRadio) {
      showToast('Mark one option as the correct answer.', 'danger');
      return;
    }

    const correctIndex = Number(correctRadio.value);
    const options = optionInputs.map(input => input.value);

    if (options.some(v => !v.trim())) {
      showToast('Fill in all four options.', 'danger');
      return;
    }

    if (list) {
      const row = document.createElement('div');
      row.className = 'question-manage-row';

      const optionsHtml = options.map((text, i) => `
        <div class="question-manage-option ${i === correctIndex ? 'is-correct' : ''}">
          ${i === correctIndex
            ? '<svg class="question-manage-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
            : '<span class="question-manage-option-icon"></span>'}
          <span></span>
        </div>
      `).join('');

      row.innerHTML = `
        <div class="question-manage-head">
          <span class="question-manage-text"></span>
          <button type="button" class="icon-btn danger delete-question-btn" aria-label="Delete question">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
          </button>
        </div>
        <div class="question-manage-options">${optionsHtml}</div>
      `;

      row.querySelector('.question-manage-text').textContent = questionInput.value;
      row.querySelectorAll('.question-manage-option span:last-child').forEach((span, i) => {
        span.textContent = options[i];
      });

      list.appendChild(row);
      wireRowButtons();
      showToast('Question added.', 'success');
    }

    closeModal(modal);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMaterialCrud();
  initQuestionCrud();
});