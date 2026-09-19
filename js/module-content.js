// MODULE EDITOR — reads ?moduleId= from the URL, loads the real module
// (materials + quiz + questions), and wires up real create/edit/delete.

document.addEventListener('DOMContentLoaded', loadModuleEditor);

function getModuleIdFromUrl() {
  return new URLSearchParams(window.location.search).get('moduleId');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let currentModule = null;

async function loadModuleEditor() {
  const moduleId = getModuleIdFromUrl();
  const main = document.querySelector('.dashboard-content');

  if (!moduleId) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">No module was specified. <a href="manage-courses.html">Back to Manage Courses</a></p>`;
    return;
  }

  try {
    const { data: module } = await apiFetch(`/modules/${moduleId}`);
    currentModule = module;

    const { data: course } = await apiFetch(`/courses/${module.courseId}`);

    fixBackLink(module.courseId);
    renderModuleDetails(module, course);
    renderMaterials(module.materials);
    renderQuestions(module.quiz);

    wireModuleDetailsSave();
    wireMaterialModal();
    wireQuestionModal();
  } catch (err) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">Couldn't load this module: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load module.', 'danger');
  }
}

function fixBackLink(courseId) {
  const backLink = document.querySelector('.dashboard-content a[href="manage-course-modules.html"]');
  if (backLink) backLink.href = `manage-course-modules.html?courseId=${courseId}`;
}

function renderModuleDetails(module, course) {
  const titleInput = document.getElementById('module-title-input');
  const descEl = document.querySelector('.settings-section-desc');
  const publishedToggle = document.querySelector('.settings-row input[type="checkbox"]');

  if (titleInput) titleInput.value = module.title;
  if (descEl) descEl.textContent = `${course.title} · Module ${module.order + 1}`;
  if (publishedToggle) publishedToggle.checked = module.published;

  document.title = `Edit Module — ${module.title} — Orbit LMS`;
}

function wireModuleDetailsSave() {
  const saveBtn = document.querySelector('.settings-form-actions .btn-primary');
  const titleInput = document.getElementById('module-title-input');
  const publishedToggle = document.querySelector('.settings-row input[type="checkbox"]');

  saveBtn?.addEventListener('click', async () => {
    try {
      await apiFetch(`/modules/${currentModule.id}`, {
        method: 'PUT',
        body: { title: titleInput.value.trim(), published: publishedToggle.checked },
      });
      showToast('Module saved.', 'success');
      loadModuleEditor();
    } catch (err) {
      showToast(err.message || 'Failed to save module.', 'danger');
    }
  });
}

// --- MATERIALS -----------------------------------------------------------

const MATERIAL_ICONS = {
  DOCUMENT: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75zM9 12h6M9 15.75h6"/></svg>',
  VIDEO_UPLOAD: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-2.36a.75.75 0 011.03.67v6.38a.75.75 0 01-1.03.67L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"/></svg>',
  VIDEO_LINK: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-2.36a.75.75 0 011.03.67v6.38a.75.75 0 01-1.03.67L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"/></svg>',
};

const MATERIAL_TYPE_LABEL = {
  DOCUMENT: 'Document',
  VIDEO_UPLOAD: 'Video (uploaded)',
  VIDEO_LINK: 'Video (link)',
};

function renderMaterials(materials) {
  const list = document.getElementById('materials-list');
  if (!list) return;

  if (!materials.length) {
    list.innerHTML = `<p style="color:var(--color-gray-500);font-size:var(--text-sm);">No materials yet.</p>`;
    return;
  }

  list.innerHTML = materials.map(m => `
    <div class="material-row" data-material-id="${m.id}" data-type="${m.type}">
      <span class="material-icon ${m.type === 'DOCUMENT' ? 'document' : 'video'}">${MATERIAL_ICONS[m.type]}</span>
      <div class="material-info">
        <div class="material-title">${escapeHtml(m.title)}</div>
        <div class="material-meta">${MATERIAL_TYPE_LABEL[m.type]} · ${escapeHtml(m.url || 'No file/link set')}</div>
      </div>
      <div class="material-actions">
        <button type="button" class="icon-btn edit-material-btn" data-material-id="${m.id}" aria-label="Edit material">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
        </button>
        <button type="button" class="icon-btn danger delete-material-btn" data-material-id="${m.id}" aria-label="Delete material">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  wireMaterialRowButtons();
}

function updateMaterialTypeFields() {
  const typeInput = document.getElementById('material-type-input');
  document.querySelectorAll('.material-type-field').forEach(el => {
    el.classList.toggle('active', el.dataset.type === typeInput.value);
  });
}

function wireMaterialModal() {
  const modal = document.getElementById('material-modal');
  const form = document.getElementById('material-form');
  const titleField = document.getElementById('material-modal-title');
  const nameInput = document.getElementById('material-name-input');
  const typeInput = document.getElementById('material-type-input');
  const urlInput = document.getElementById('material-url-input');
  const fileInputDoc = document.getElementById('material-file-input-doc');
  const fileInputVideo = document.getElementById('material-file-input');

  let editingMaterialId = null;

  typeInput?.addEventListener('change', updateMaterialTypeFields);

  document.getElementById('add-material-btn')?.addEventListener('click', () => {
    editingMaterialId = null;
    titleField.textContent = 'Add Material';
    form.reset();
    typeInput.value = 'document';
    updateMaterialTypeFields();
    openModal(modal);
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const type = typeInput.value;
    const backendType = type === 'document' ? 'DOCUMENT' : type === 'video-upload' ? 'VIDEO_UPLOAD' : 'VIDEO_LINK';

    let url = null;
    if (type === 'video-link') {
      url = urlInput.value.trim() || null;
    } else {
      // No real file upload endpoint yet — record the chosen filename as a
      // placeholder so it's visible in the list, rather than pretending to
      // upload something that isn't actually stored anywhere.
      const file = type === 'document' ? fileInputDoc.files[0] : fileInputVideo.files[0];
      url = file ? `(selected file: ${file.name} — not yet uploaded)` : null;
    }

    try {
      if (editingMaterialId) {
        await apiFetch(`/materials/${editingMaterialId}`, {
          method: 'PUT',
          body: { title: nameInput.value.trim(), type: backendType, url },
        });
        showToast('Material updated.', 'success');
      } else {
        await apiFetch(`/modules/${currentModule.id}/materials`, {
          method: 'POST',
          body: { title: nameInput.value.trim(), type: backendType, url, order: currentModule.materials.length },
        });
        showToast('Material added.', 'success');
      }
      closeModal(modal);
      loadModuleEditor();
    } catch (err) {
      showToast(err.message || 'Failed to save material.', 'danger');
    }
  };

  function wireEditButtons() {
    document.querySelectorAll('.edit-material-btn').forEach(btn => {
      btn.onclick = () => {
        const material = currentModule.materials.find(m => m.id === btn.dataset.materialId);
        if (!material) return;
        editingMaterialId = material.id;
        titleField.textContent = 'Edit Material';
        nameInput.value = material.title;
        typeInput.value = material.type === 'DOCUMENT' ? 'document' : material.type === 'VIDEO_UPLOAD' ? 'video-upload' : 'video-link';
        updateMaterialTypeFields();
        if (material.type === 'VIDEO_LINK') urlInput.value = material.url || '';
        openModal(modal);
      };
    });
  }

  window.__wireMaterialEditButtons = wireEditButtons;
}

function wireMaterialRowButtons() {
  window.__wireMaterialEditButtons?.();

  document.querySelectorAll('.delete-material-btn').forEach(btn => {
    btn.onclick = async () => {
      const material = currentModule.materials.find(m => m.id === btn.dataset.materialId);
      if (!material) return;
      if (!confirm(`Delete material "${material.title}"? This cannot be undone.`)) return;

      try {
        await apiFetch(`/materials/${material.id}`, { method: 'DELETE' });
        showToast('Material deleted.', 'danger');
        loadModuleEditor();
      } catch (err) {
        showToast(err.message || 'Failed to delete material.', 'danger');
      }
    };
  });
}

// --- QUIZ QUESTIONS --------------------------------------------------------

function renderQuestions(quiz) {
  const list = document.getElementById('questions-list');
  if (!list) return;

  if (!quiz) {
    list.innerHTML = `<p style="color:var(--color-gray-500);font-size:var(--text-sm);">No quiz yet for this module — click "Add Question" to create one and start adding questions.</p>`;
    return;
  }

  if (!quiz.questions.length) {
    list.innerHTML = `<p style="color:var(--color-gray-500);font-size:var(--text-sm);">This quiz has no questions yet.</p>`;
    return;
  }

  list.innerHTML = quiz.questions.map(q => `
    <div class="question-manage-row" data-question-id="${q.id}">
      <div class="question-manage-head">
        <span class="question-manage-text">${escapeHtml(q.text)}</span>
        <button type="button" class="icon-btn danger delete-question-btn" data-question-id="${q.id}" aria-label="Delete question">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
        </button>
      </div>
      <div class="question-manage-options">
        ${q.options.map(o => `
          <div class="question-manage-option ${o.isCorrect ? 'is-correct' : ''}">
            ${o.isCorrect
              ? '<svg class="question-manage-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
              : '<span class="question-manage-option-icon"></span>'}
            <span>${escapeHtml(o.text)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  wireQuestionDeleteButtons();
}

function wireQuestionDeleteButtons() {
  document.querySelectorAll('.delete-question-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this question? This cannot be undone.')) return;
      try {
        await apiFetch(`/questions/${btn.dataset.questionId}`, { method: 'DELETE' });
        showToast('Question deleted.', 'danger');
        loadModuleEditor();
      } catch (err) {
        showToast(err.message || 'Failed to delete question.', 'danger');
      }
    };
  });
}

function wireQuestionModal() {
  const modal = document.getElementById('question-modal');
  const form = document.getElementById('question-form');
  const questionInput = document.getElementById('question-text-input');
  const optionInputs = ['option-a-input', 'option-b-input', 'option-c-input', 'option-d-input'].map(id => document.getElementById(id));

  document.getElementById('add-question-btn')?.addEventListener('click', async () => {
    form.reset();

    // A module can exist without a quiz yet — create one automatically the
    // first time someone adds a question, rather than requiring a separate step.
    if (!currentModule.quiz) {
      try {
        const { data: quiz } = await apiFetch(`/modules/${currentModule.id}/quiz`, {
          method: 'POST',
          body: { title: `Mini Quiz: ${currentModule.title}` },
        });
        currentModule.quiz = { ...quiz, questions: [] };
      } catch (err) {
        showToast(err.message || 'Failed to create quiz.', 'danger');
        return;
      }
    }

    openModal(modal);
  });

  form.onsubmit = async (e) => {
    e.preventDefault();

    const correctRadio = form.querySelector('input[name="correct-option"]:checked');
    if (!correctRadio) {
      showToast('Mark one option as the correct answer.', 'danger');
      return;
    }

    const correctIndex = Number(correctRadio.value);
    const options = optionInputs.map((input, i) => ({ text: input.value.trim(), isCorrect: i === correctIndex }));

    if (options.some(o => !o.text)) {
      showToast('Fill in all four options.', 'danger');
      return;
    }

    try {
      await apiFetch(`/quizzes/${currentModule.quiz.id}/questions`, {
        method: 'POST',
        body: { text: questionInput.value.trim(), options },
      });
      showToast('Question added.', 'success');
      closeModal(modal);
      loadModuleEditor();
    } catch (err) {
      showToast(err.message || 'Failed to save question.', 'danger');
    }
  };
}