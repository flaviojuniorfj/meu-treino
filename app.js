/* =========================================================
   MEU TREINO - Flavão Edition  v3
   Todas as melhorias implementadas
   ========================================================= */

// ============ DEFAULT WORKOUT ============
const DEFAULT_WORKOUT_FLAVAO = [
    { day:"SEGUNDA", focus:"Peito + tríceps", exercises:[
        { name:"Supino reto máquina, halteres ou smith", series:"3", reps:"8–12", rest:"90–120s" },
        { name:"Supino inclinado com halteres ou smith", series:"3", reps:"10–12", rest:"90s" },
        { name:"Crucifixo máquina (peck deck) ou articulada", series:"3", reps:"12–15", rest:"60–90s" },
        { name:"Tríceps na polia", series:"3", reps:"10–15", rest:"60–90s" },
        { name:"Tríceps acima da cabeça na polia", series:"3", reps:"10–12", rest:"60–90s" }
    ]},
    { day:"TERÇA", focus:"Costas + bíceps", exercises:[
        { name:"Puxada frontal", series:"3", reps:"8–12", rest:"90–120s" },
        { name:"Remada sentada pegada neutra", series:"3", reps:"10–12", rest:"90s" },
        { name:"Pulldown com braços estendidos", series:"3", reps:"12–15", rest:"60–90s" },
        { name:"Rosca direta com halteres alternada", series:"3", reps:"10–12", rest:"60–90s" },
        { name:"Rosca martelo com halteres alternada", series:"3", reps:"10–12", rest:"60–90s" }
    ]},
    { day:"QUARTA", focus:"Pernas A - ênfase quadríceps", exercises:[
        { name:"Leg press 45º", series:"3", reps:"10–12", rest:"90–120s" },
        { name:"Cadeira extensora", series:"3", reps:"12–15", rest:"60–90s" },
        { name:"Mesa flexora", series:"3", reps:"10–12", rest:"60–90s" },
        { name:"Panturrilha na máquina", series:"3", reps:"12–15", rest:"60–90s" },
        { name:"Abdominal máquina ou no chão", series:"4", reps:"12–15", rest:"60s" }
    ]},
    { day:"QUINTA", focus:"Peito + ombros", exercises:[
        { name:"Supino inclinado no smith ou livre", series:"3", reps:"8–12", rest:"90–120s" },
        { name:"Supino reto máquina ou halteres", series:"3", reps:"10–12", rest:"90s" },
        { name:"Elevação lateral halteres", series:"3", reps:"12–15", rest:"60–90s" },
        { name:"Desenvolvimento máquina, halteres ou smith (leve)", series:"2", reps:"10–12", rest:"90s" }
    ]},
    { day:"SEXTA", focus:"Pernas B + costas", exercises:[
        { name:"Mesa flexora", series:"2", reps:"10–12", rest:"90s" },
        { name:"Elevação pélvica", series:"2", reps:"10–12", rest:"90–120s" },
        { name:"Leg press 45º (leve/moderado)", series:"2", reps:"10–12", rest:"90s" },
        { name:"Puxada frontal pegada supinada ou neutra", series:"3", reps:"10–12", rest:"90s" },
        { name:"Remada sentada", series:"3", reps:"10–12", rest:"90s" },
        { name:"Panturrilha na máquina", series:"3", reps:"12–15", rest:"60–90s" }
    ]},
    { day:"SÁBADO", focus:"Descanso / Recuperação Ativa", isRest:true,
      restInfo:"Dia focado em regeneração muscular. Priorize hidratação, proteínas e sono." },
    { day:"DOMINGO", focus:"Descanso Total", isRest:true,
      restInfo:"Dia off. Prepare a rotina da próxima semana e mantenha a alimentação alinhada." }
];

// ============ STATE ============
let currentWorkout = [];
let completedState = {};
let weightHistory = [];
let loadHistory = {};
let trainingHistory = [];
let loadGoals = {};
let sessionNotes = {};
let activeDayIndex = 0;
let editingDayBackup = null;
let editingExerciseName = null;

// Timer
let restTimerInterval = null;
let restTimerEnd = null;

// ============ INIT ============
window.addEventListener('load', () => {
    migrate();
    loadAll();
    const today = new Date().getDay();
    const dayMap = [6,0,1,2,3,4,5];
    activeDayIndex = dayMap[today] ?? 0;
    if (activeDayIndex >= currentWorkout.length) activeDayIndex = 0;

    renderDayTabs();
    renderCurrentDay();
    renderWeeklySummary();
    checkUnfinishedDay();
    registerServiceWorker();
});

// ============ MIGRATION ============
function migrate() {
    const v = parseInt(localStorage.getItem('meu_treino_version') || '1');
    if (v < 3) {
        // v3 adicionou loadGoals, trainingHistory, sessionNotes
        if (!localStorage.getItem('meu_treino_load_goals')) localStorage.setItem('meu_treino_load_goals', '{}');
        if (!localStorage.getItem('meu_treino_training_history')) localStorage.setItem('meu_treino_training_history', '[]');
        if (!localStorage.getItem('meu_treino_session_notes')) localStorage.setItem('meu_treino_session_notes', '{}');
        localStorage.setItem('meu_treino_version', '3');
    }
}

// ============ SERVICE WORKER ============
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW falhou:', err));
    }
}

// ============ STORAGE ============
function safeParse(json, fb) { try { return JSON.parse(json) || fb; } catch(e){ return fb; } }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            showToast('Armazenamento cheio! Faça um backup e limpe dados antigos.', true);
        } else {
            showToast('Erro ao salvar dados.', true);
        }
        return false;
    }
}

function loadAll() {
    const w = localStorage.getItem('meu_treino_workout_data');
    currentWorkout = w ? safeParse(w, DEFAULT_WORKOUT_FLAVAO) : clone(DEFAULT_WORKOUT_FLAVAO);
    const c = localStorage.getItem('meu_treino_completed_state');
    completedState = c ? safeParse(c, {}) : {};
    const wh = localStorage.getItem('meu_treino_weight_history');
    weightHistory = wh ? safeParse(wh, []) : [];
    const lh = localStorage.getItem('meu_treino_load_history');
    loadHistory = lh ? safeParse(lh, {}) : {};
    const th = localStorage.getItem('meu_treino_training_history');
    trainingHistory = th ? safeParse(th, []) : [];
    const lg = localStorage.getItem('meu_treino_load_goals');
    loadGoals = lg ? safeParse(lg, {}) : {};
    const sn = localStorage.getItem('meu_treino_session_notes');
    sessionNotes = sn ? safeParse(sn, {}) : {};

    updateWeightDisplay();
}
function saveWorkoutData() { safeSet('meu_treino_workout_data', currentWorkout); }
function saveCompletedState() { safeSet('meu_treino_completed_state', completedState); }
function saveWeightData() { safeSet('meu_treino_weight_history', weightHistory); updateWeightDisplay(); }
function saveLoadData() { safeSet('meu_treino_load_history', loadHistory); }
function saveTrainingHistory() { safeSet('meu_treino_training_history', trainingHistory); }
function saveLoadGoals() { safeSet('meu_treino_load_goals', loadGoals); }
function saveSessionNotes() { safeSet('meu_treino_session_notes', sessionNotes); }

// ============ RENDER ============
function renderDayTabs() {
    const c = document.getElementById('day-tabs');
    c.innerHTML = '';
    currentWorkout.forEach((d, idx) => {
        const btn = document.createElement('button');
        const active = idx === activeDayIndex;
        btn.className = `px-3.5 py-2 rounded-xl whitespace-nowrap transition font-semibold flex items-center gap-1.5 ${
            active ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                   : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`;
        btn.onclick = () => { activeDayIndex = idx; renderDayTabs(); renderCurrentDay(); renderWeeklySummary(); };
        const short = (d.day || '').substring(0,3).toUpperCase();
        let html = `<span>${short}</span>`;
        if (!d.isRest && isDayFullyCompleted(idx)) {
            html += `<i class="fa-solid fa-circle-check text-xs ${active?'text-white':'text-brand-500'}"></i>`;
        }
        btn.innerHTML = html;
        c.appendChild(btn);
    });
}

function renderCurrentDay() {
    const day = currentWorkout[activeDayIndex];
    if (!day) return;
    document.getElementById('day-title').innerText = day.day;
    document.getElementById('day-focus').innerText = `Foco: ${day.focus || '—'}`;

    const list = document.getElementById('exercise-list');
    const rest = document.getElementById('rest-day-container');
    list.innerHTML = '';

    if (day.isRest || !day.exercises || !day.exercises.length) {
        list.classList.add('hidden');
        rest.classList.remove('hidden');
        document.getElementById('rest-day-text').innerText = day.restInfo || 'Dia de descanso.';
        updateProgressBar(0, 0);
        return;
    }
    list.classList.remove('hidden');
    rest.classList.add('hidden');

    let done = 0;
    day.exercises.forEach((ex, exIdx) => {
        const key = `${activeDayIndex}_${exIdx}`;
        const checked = !!completedState[key];
        if (checked) done++;

        const lastLoad = getLastLoad(ex.name);
        const goal = loadGoals[ex.name];
        const progression = getProgressionSuggestion(ex.name);

        let badges = '';
        if (lastLoad) {
            badges += `<span class="bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30 font-mono"><i class="fa-solid fa-fire-flame-curved mr-1"></i>${lastLoad.load}kg <span class="text-[10px] opacity-70">${lastLoad.date}</span></span>`;
        } else {
            badges += `<span class="bg-slate-800/60 text-slate-500 px-2 py-0.5 rounded-md border border-slate-700/50 italic">sem carga reg.</span>`;
        }
        if (goal) {
            const pct = Math.min(100, Math.round((lastLoad?.load || 0) / goal * 100));
            badges += `<span class="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 font-mono"><i class="fa-solid fa-bullseye mr-1"></i>${pct}% meta</span>`;
        }
        if (progression) {
            badges += `<span class="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-mono text-[10px]"><i class="fa-solid fa-arrow-trend-up mr-1"></i>Sugerido: ${progression.suggested}kg</span>`;
        }

        const card = document.createElement('div');
        card.className = `bg-slate-900 border ${checked ? 'border-brand-500/40 bg-brand-500/5' : 'border-slate-800'} rounded-2xl p-4 transition duration-200 shadow-sm`;
        const ytQuery = encodeURIComponent(`como fazer ${ex.name} execucao correta`);

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <label class="flex items-start gap-3 cursor-pointer flex-1">
                    <div class="relative mt-0.5">
                        <input type="checkbox" class="checkbox-custom sr-only" ${checked?'checked':''} onchange="toggleExercise('${key}')">
                        <div class="w-6 h-6 rounded-lg border-2 border-slate-700 bg-slate-950 flex items-center justify-center transition">
                            <i class="fa-solid fa-check text-xs text-slate-950 hidden font-bold"></i>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <h4 class="font-bold text-sm sm:text-base leading-snug ${checked?'line-through text-slate-400':'text-slate-100'}">${escapeHtml(ex.name)}</h4>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                            <span class="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/50"><b class="text-brand-400">${ex.series}</b> séries</span>
                            <span class="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/50"><b class="text-brand-400">${ex.reps}</b> reps</span>
                            <span class="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/50"><i class="fa-regular fa-clock mr-1"></i>${ex.rest}</span>
                            ${badges}
                        </div>
                    </div>
                </label>
                <div class="flex flex-col gap-1 flex-shrink-0">
                    <button onclick="startRestTimer(${parseRest(ex.rest)})" title="Iniciar descanso (${parseRest(ex.rest)}s)" class="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/20">
                        <i class="fa-solid fa-stopwatch text-lg"></i>
                    </button>
                    <button onclick="openLoadModal('${escapeAttr(ex.name)}')" title="Registrar carga" class="p-2 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded-xl transition border border-transparent hover:border-brand-500/20">
                        <i class="fa-solid fa-dumbbell text-lg"></i>
                    </button>
                    <a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" rel="noopener noreferrer" title="Ver no YouTube" class="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex-shrink-0 border border-transparent hover:border-rose-500/20">
                        <i class="fa-brands fa-youtube text-lg"></i>
                    </a>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
    updateProgressBar(done, day.exercises.length);
}

function toggleExercise(key) {
    const wasChecked = !!completedState[key];
    completedState[key] = !wasChecked;
    saveCompletedState();
    renderCurrentDay();
    renderDayTabs();
    renderWeeklySummary();

    // Se completou tudo, registra a sessão
    if (!wasChecked && isDayFullyCompleted(activeDayIndex)) {
        recordTrainingSession(activeDayIndex);
    }
}

function isDayFullyCompleted(idx) {
    const d = currentWorkout[idx];
    if (!d || d.isRest || !d.exercises) return false;
    return d.exercises.every((_,i) => !!completedState[`${idx}_${i}`]);
}
function updateProgressBar(done, total) {
    const pct = total > 0 ? Math.round(done/total*100) : 0;
    document.getElementById('progress-bar-fill').style.width = pct+'%';
    document.getElementById('progress-percentage').innerText = pct+'%';
    document.getElementById('progress-count').innerText = `${done}/${total} exercícios`;
}
function resetCurrentDay() {
    const d = currentWorkout[activeDayIndex];
    if (!d || !d.exercises) return;
    d.exercises.forEach((_,i)=> delete completedState[`${activeDayIndex}_${i}`]);
    saveCompletedState();
    renderCurrentDay(); renderDayTabs(); renderWeeklySummary();
    showToast("Exercícios do dia desmarcados");
}
function clearAllProgress() {
    if (!confirm('Desmarcar TODOS os dias de todos os treinos? Isso não apaga histórico, apenas o "checado" atual.')) return;
    completedState = {}; saveCompletedState();
    renderCurrentDay(); renderDayTabs(); renderWeeklySummary();
    toggleSettingsMenu();
    showToast("Progresso reiniciado!");
}

// ============ WEEKLY SUMMARY ============
function renderWeeklySummary() {
    const c = document.getElementById('weekly-summary');
    const counter = document.getElementById('weekly-summary-count');
    let doneCount = 0, totalActive = 0;

    c.innerHTML = currentWorkout.map((d, idx) => {
        if (d.isRest) {
            return `<div class="aspect-square rounded-lg bg-slate-800/30 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600 font-semibold">${(d.day||'').substring(0,3)}</div>`;
        }
        totalActive++;
        const full = isDayFullyCompleted(idx);
        if (full) doneCount++;
        const active = idx === activeDayIndex;
        const cls = full
            ? 'bg-brand-500/30 border-brand-500/60 text-brand-300'
            : 'bg-slate-800/50 border-slate-800 text-slate-500';
        return `<div onclick="goToDay(${idx})" class="aspect-square rounded-lg ${cls} ${active?'ring-1 ring-brand-400':''} border flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:opacity-80 transition">${(d.day||'').substring(0,3)}</div>`;
    }).join('');

    if (counter) counter.innerText = `${doneCount}/${totalActive} treinos`;
}
function goToDay(idx) {
    activeDayIndex = idx;
    renderDayTabs(); renderCurrentDay(); renderWeeklySummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ UNFINISHED DAY BANNER ============
function checkUnfinishedDay() {
    const banner = document.getElementById('unfinished-banner');
    const todayIdx = activeDayIndex;
    if (todayIdx > 0) {
        const prev = todayIdx - 1;
        const prevDay = currentWorkout[prev];
        if (prevDay && !prevDay.isRest && prevDay.exercises?.length) {
            const done = prevDay.exercises.filter((_, i) => completedState[`${prev}_${i}`]).length;
            const total = prevDay.exercises.length;
            if (done > 0 && done < total) {
                document.getElementById('unfinished-banner-title').innerText = `${prevDay.day} incompleto`;
                document.getElementById('unfinished-banner-text').innerText = `${done}/${total} exercícios concluídos`;
                banner.classList.remove('hidden');
                banner.dataset.targetDay = prev;
                return;
            }
        }
    }
    banner.classList.add('hidden');
}
function goToUnfinishedDay() {
    const t = parseInt(document.getElementById('unfinished-banner').dataset.targetDay);
    goToDay(t);
    document.getElementById('unfinished-banner').classList.add('hidden');
}

// ============ REST TIMER ============
function parseRest(rest) {
    const m = String(rest).match(/(\d+)/);
    return m ? parseInt(m[1]) : 60;
}
function startRestTimer(seconds) {
    stopRestTimer();
    restTimerEnd = Date.now() + seconds * 1000;
    document.getElementById('rest-timer').classList.remove('hidden');
    document.getElementById('timer-circle').classList.add('timer-ring');
    updateRestTimerDisplay();
    restTimerInterval = setInterval(() => {
        updateRestTimerDisplay();
        const remaining = Math.ceil((restTimerEnd - Date.now()) / 1000);
        if (remaining <= 0) {
            stopRestTimer();
            playBeep();
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
            showToast('Descanso concluído! 💪');
        }
    }, 200);
}
function updateRestTimerDisplay() {
    const remaining = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    document.getElementById('rest-timer-display').innerText = `${m}:${String(s).padStart(2,'0')}`;
}
function stopRestTimer() {
    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerInterval = null;
    restTimerEnd = null;
    document.getElementById('rest-timer').classList.add('hidden');
    document.getElementById('timer-circle').classList.remove('timer-ring');
}
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
}

// ============ EDITAR DIA ============
function openEditDayModal() {
    const d = currentWorkout[activeDayIndex];
    if (!d) return;
    editingDayBackup = clone(d);
    document.getElementById('edit-day-name').value = d.day || '';
    document.getElementById('edit-day-focus').value = d.focus || '';
    const list = document.getElementById('edit-exercises-list');
    list.innerHTML = '';
    const exs = d.exercises || [];
    if (d.isRest) { d.isRest = false; d.exercises = d.exercises || []; }
    if (!d.exercises.length) addEditExerciseRow('', '3', '10–12', '60–90s');
    else d.exercises.forEach(ex => addEditExerciseRow(ex.name, ex.series, ex.reps, ex.rest));
    document.getElementById('edit-day-modal').classList.remove('hidden');
}

function addEditExerciseRow(name, series, reps, rest) {
    const list = document.getElementById('edit-exercises-list');
    const row = document.createElement('div');
    row.className = 'bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5';
    row.draggable = true;
    row.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fa-solid fa-grip-vertical text-slate-600 cursor-move drag-handle"></i>
            <input type="text" placeholder="Nome do exercício" value="${escapeAttr(name)}" class="edit-ex-name flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500">
            <button type="button" onclick="this.closest('div.bg-slate-950').remove()" class="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"><i class="fa-solid fa-trash-can text-sm"></i></button>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
            <input type="text" placeholder="Séries" value="${escapeAttr(series)}" class="edit-ex-series bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500">
            <input type="text" placeholder="Reps" value="${escapeAttr(reps)}" class="edit-ex-reps bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500">
            <input type="text" placeholder="Descanso" value="${escapeAttr(rest)}" class="edit-ex-rest bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500">
        </div>
    `;
    list.appendChild(row);
    setupDragFor(row, list);
}

function setupDragFor(row, list) {
    row.addEventListener('dragstart', e => {
        row.classList.add('opacity-50');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        row._dragSrc = true;
    });
    row.addEventListener('dragend', () => {
        row.classList.remove('opacity-50');
        row._dragSrc = false;
    });
    row.addEventListener('dragover', e => {
        e.preventDefault();
        const after = getDragAfterElement(list, e.clientY);
        if (after == null) list.appendChild(row);
        else list.insertBefore(row, after);
    });
}
function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll(':scope > div:not(.opacity-50)')];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function addExerciseToEditList() {
    addEditExerciseRow('', '3', '10–12', '60–90s');
}

function closeEditDayModal() {
    if (editingDayBackup) {
        currentWorkout[activeDayIndex] = editingDayBackup;
        editingDayBackup = null;
    }
    document.getElementById('edit-day-modal').classList.add('hidden');
}

function saveEditedDay() {
    const newName = document.getElementById('edit-day-name').value.trim().toUpperCase();
    const newFocus = document.getElementById('edit-day-focus').value.trim();
    const rows = document.querySelectorAll('#edit-exercises-list > div.bg-slate-950');
    const exercises = [];
    rows.forEach(r => {
        const n = r.querySelector('.edit-ex-name').value.trim();
        const s = r.querySelector('.edit-ex-series').value.trim();
        const rp = r.querySelector('.edit-ex-reps').value.trim();
        const re = r.querySelector('.edit-ex-rest').value.trim();
        if (n) exercises.push({ name: n, series: s || '3', reps: rp || '10–12', rest: re || '60–90s' });
    });
    if (!newName) { showToast("Nome do dia é obrigatório", true); return; }
    if (!exercises.length) { showToast("Adicione ao menos 1 exercício", true); return; }

    currentWorkout[activeDayIndex] = { day: newName, focus: newFocus || 'Geral', exercises };
    saveWorkoutData();
    editingDayBackup = null;

    Object.keys(completedState).forEach(k => {
        if (k.startsWith(activeDayIndex + '_')) delete completedState[k];
    });
    saveCompletedState();

    document.getElementById('edit-day-modal').classList.add('hidden');
    renderDayTabs(); renderCurrentDay(); renderWeeklySummary();
    showToast("Dia atualizado!");
}

// ============ CARGA POR EXERCÍCIO ============
function openLoadModal(exName) {
    editingExerciseName = exName;
    document.getElementById('load-modal-exercise-name').innerText = exName;
    document.getElementById('load-input').value = '';
    document.getElementById('load-note-input').value = '';
    const goal = loadGoals[exName];
    document.getElementById('load-goal-input').value = goal || '';
    document.getElementById('load-goal-progress').classList.add('hidden');
    renderLoadHistory();
    document.getElementById('load-modal').classList.remove('hidden');
}
function closeLoadModal() {
    document.getElementById('load-modal').classList.add('hidden');
    editingExerciseName = null;
}
function getLastLoad(exName) {
    const arr = loadHistory[exName];
    if (!arr || !arr.length) return null;
    return arr[0];
}
function saveLoad() {
    const val = parseFloat(document.getElementById('load-input').value);
    const note = document.getElementById('load-note-input').value.trim();
    const goalVal = parseFloat(document.getElementById('load-goal-input').value);
    if (isNaN(val) || val <= 0) { showToast("Digite uma carga válida", true); return; }
    if (!editingExerciseName) return;

    const today = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    if (!loadHistory[editingExerciseName]) loadHistory[editingExerciseName] = [];
    loadHistory[editingExerciseName].unshift({ date: today, load: val, note });
    saveLoadData();

    if (!isNaN(goalVal) && goalVal > 0) {
        loadGoals[editingExerciseName] = goalVal;
    } else {
        delete loadGoals[editingExerciseName];
    }
    saveLoadGoals();

    closeLoadModal();
    renderCurrentDay();
    showToast(`Carga de ${val}kg registrada!`);
}
function renderLoadHistory() {
    const c = document.getElementById('load-history-list');
    if (!editingExerciseName || !loadHistory[editingExerciseName]?.length) {
        c.innerHTML = `<p class="text-center py-2 text-slate-500">Nenhuma carga registrada ainda</p>`;
        return;
    }
    const goal = loadGoals[editingExerciseName];
    c.innerHTML = loadHistory[editingExerciseName].map((item, idx) => {
        let goalHtml = '';
        if (goal) {
            const pct = Math.min(100, Math.round(item.load / goal * 100));
            goalHtml = `<span class="text-[10px] text-purple-400 font-mono">${pct}% meta</span>`;
        }
        return `
            <div class="flex justify-between items-center py-1 border-b border-slate-800 gap-2">
                <span class="flex-1">${item.date} ${item.note ? `<span class="text-slate-500 italic">— ${escapeHtml(item.note)}</span>` : ''}</span>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${goalHtml}
                    <span class="font-mono font-bold text-cyan-300">${item.load} kg</span>
                    <button onclick="deleteLoadEntry('${escapeAttr(editingExerciseName)}', ${idx})" class="text-rose-400 hover:text-rose-300 p-1"><i class="fa-solid fa-xmark text-xs"></i></button>
                </div>
            </div>
        `;
    }).join('');
}
function deleteLoadEntry(exName, idx) {
    if (!loadHistory[exName]) return;
    loadHistory[exName].splice(idx, 1);
    if (!loadHistory[exName].length) delete loadHistory[exName];
    saveLoadData();
    renderLoadHistory();
    renderCurrentDay();
}

// ============ PROGRESSÃO AUTOMÁTICA ============
function getProgressionSuggestion(exName) {
    const arr = loadHistory[exName];
    if (!arr || arr.length < 3) return null;
    const last3 = arr.slice(0, 3);
    const same = last3.every(l => l.load === last3[0].load);
    if (same) {
        const increment = last3[0].load < 20 ? 2.5 : last3[0].load < 50 ? 2.5 : 5;
        return { suggested: (last3[0].load + increment).toFixed(1) };
    }
    return null;
}

// ============ HISTÓRICO GERAL DE CARGAS ============
function openLoadHistoryModal() {
    renderLoadHistoryOverview();
    document.getElementById('load-history-modal').classList.remove('hidden');
}
function closeLoadHistoryModal() {
    document.getElementById('load-history-modal').classList.add('hidden');
}
function renderLoadHistoryOverview() {
    const c = document.getElementById('load-history-container');
    const names = Object.keys(loadHistory).filter(n => loadHistory[n]?.length).sort();
    if (!names.length) {
        c.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Nenhuma carga registrada ainda.</p>`;
        return;
    }
    c.innerHTML = names.map(name => {
        const arr = loadHistory[name];
        const last = arr[0];
        const prev = arr[1];
        const goal = loadGoals[name];
        let deltaHtml = '';
        if (prev) {
            const diff = (last.load - prev.load).toFixed(1);
            const d = parseFloat(diff);
            if (d > 0) deltaHtml = `<span class="text-brand-400 text-[10px]"><i class="fa-solid fa-arrow-up"></i> +${diff}kg</span>`;
            else if (d < 0) deltaHtml = `<span class="text-rose-400 text-[10px]"><i class="fa-solid fa-arrow-down"></i> ${diff}kg</span>`;
            else deltaHtml = `<span class="text-slate-500 text-[10px]">=</span>`;
        }
        let goalHtml = '';
        if (goal) {
            const pct = Math.min(100, Math.round(last.load / goal * 100));
            goalHtml = `<div class="mt-1.5">
                <div class="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div class="bg-purple-500 h-1 rounded-full" style="width:${pct}%"></div>
                </div>
                <span class="text-[10px] text-purple-400">Meta: ${goal}kg (${pct}%)</span>
            </div>`;
        }
        const histHtml = arr.slice(0, 5).map(a => `
            <div class="flex justify-between text-[11px] text-slate-400 py-0.5">
                <span>${a.date}</span>
                <span class="font-mono">${a.load} kg</span>
            </div>
        `).join('');
        return `
            <details class="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <summary class="cursor-pointer flex justify-between items-center gap-2">
                    <span class="text-sm font-semibold text-slate-200 flex-1">${escapeHtml(name)}</span>
                    <span class="flex items-center gap-1.5">
                        <span class="text-cyan-300 font-mono text-sm font-bold">${last.load}kg</span>
                        ${deltaHtml}
                    </span>
                </summary>
                <div class="mt-2 pt-2 border-t border-slate-800">
                    ${goalHtml}
                    ${histHtml}
                </div>
            </details>
        `;
    }).join('');
}

// ============ HISTÓRICO DE TREINOS ============
function recordTrainingSession(dayIdx) {
    const day = currentWorkout[dayIdx];
    if (!day || day.isRest) return;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Evita duplicar sessão no mesmo dia
    const existing = trainingHistory.find(t => t.date === dateStr && t.dayName === day.day);
    if (existing) return;

    const lastLoads = {};
    (day.exercises || []).forEach(ex => {
        const l = getLastLoad(ex.name);
        if (l) lastLoads[ex.name] = l.load;
    });

    trainingHistory.unshift({
        date: dateStr,
        dayName: day.day,
        focus: day.focus,
        exerciseCount: day.exercises.length,
        loads: lastLoads
    });
    // Mantém só 200 últimas
    if (trainingHistory.length > 200) trainingHistory = trainingHistory.slice(0, 200);
    saveTrainingHistory();
    showToast(`🎉 Treino de ${day.day} registrado!`);
}

function openTrainingHistoryModal() {
    const stats = computeStats();
    document.getElementById('stat-streak').innerText = stats.streak;
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-month').innerText = stats.month;

    const c = document.getElementById('training-history-container');
    if (!trainingHistory.length) {
        c.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Nenhum treino registrado. Complete um dia inteiro para começar!</p>`;
    } else {
        c.innerHTML = trainingHistory.slice(0, 50).map(t => `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div class="flex-1">
                    <p class="text-sm font-semibold text-slate-200">${escapeHtml(t.dayName)} <span class="text-xs text-slate-500 font-normal">${t.date}</span></p>
                    <p class="text-[11px] text-slate-400">${escapeHtml(t.focus || '')} • ${t.exerciseCount} exercícios</p>
                </div>
                <i class="fa-solid fa-circle-check text-brand-500"></i>
            </div>
        `).join('');
    }
    document.getElementById('training-history-modal').classList.remove('hidden');
}
function closeTrainingHistoryModal() {
    document.getElementById('training-history-modal').classList.add('hidden');
}

function computeStats() {
    const total = trainingHistory.length;
    const now = new Date();
    const month = trainingHistory.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, month, streak: computeStreak() };
}
function computeStreak() {
    if (!trainingHistory.length) return 0;
    const dates = [...new Set(trainingHistory.map(t => t.date))].sort().reverse();
    let streak = 0;
    let cur = new Date();
    cur.setHours(0,0,0,0);
    const fmt = d => d.toISOString().split('T')[0];
    let todayStr = fmt(cur);
    if (!dates.includes(todayStr)) {
        cur.setDate(cur.getDate() - 1);
        todayStr = fmt(cur);
    }
    for (let i = 0; i < 365; i++) {
        const s = fmt(cur);
        if (dates.includes(s)) {
            streak++;
            cur.setDate(cur.getDate() - 1);
        } else break;
    }
    return streak;
}

// ============ PESO CORPORAL ============
function openWeightModal() {
    document.getElementById('weight-modal').classList.remove('hidden');
    renderWeightHistory();
    renderWeightChart();
}
function closeWeightModal() { document.getElementById('weight-modal').classList.add('hidden'); }
function saveWeight() {
    const v = parseFloat(document.getElementById('weight-input').value);
    if (isNaN(v) || v <= 0) { showToast("Peso inválido", true); return; }
    const today = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    weightHistory.unshift({ date: today, weight: v });
    saveWeightData();
    document.getElementById('weight-input').value = '';
    renderWeightHistory();
    renderWeightChart();
    showToast("Peso salvo!");
}
function renderWeightHistory() {
    const c = document.getElementById('weight-history-list');
    if (!weightHistory.length) {
        c.innerHTML = `<p class="text-center py-2 text-slate-500">Nenhum histórico</p>`;
        return;
    }
    c.innerHTML = weightHistory.map((item, idx) => `
        <div class="flex justify-between items-center py-1 border-b border-slate-800">
            <span>${item.date}</span>
            <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-slate-200">${item.weight} kg</span>
                <button onclick="deleteWeight(${idx})" class="text-rose-400 hover:text-rose-300 p-1"><i class="fa-solid fa-xmark text-xs"></i></button>
            </div>
        </div>
    `).join('');
}
function deleteWeight(idx) {
    weightHistory.splice(idx, 1);
    saveWeightData();
    renderWeightHistory();
    renderWeightChart();
}
function renderWeightChart() {
    const c = document.getElementById('weight-chart');
    if (weightHistory.length < 2) {
        c.innerHTML = `<p class="text-center text-slate-600 text-xs pt-8">Registre ao menos 2 pesos para ver o gráfico</p>`;
        return;
    }
    const data = [...weightHistory].reverse(); // oldest first
    const weights = data.map(d => d.weight);
    const min = Math.min(...weights) - 1;
    const max = Math.max(...weights) + 1;
    const range = max - min || 1;
    const W = 100, H = 100;
    const padX = 4, padY = 8;
    const pts = data.map((d, i) => {
        const x = padX + (i / (data.length - 1)) * (W - padX * 2);
        const y = padY + (1 - (d.weight - min) / range) * (H - padY * 2);
        return [x, y];
    });
    const polyline = pts.map(p => p.join(',')).join(' ');
    const last = data[data.length - 1].weight;
    const first = data[0].weight;
    const diff = (last - first).toFixed(1);
    const color = diff > 0 ? '#f43f5e' : diff < 0 ? '#22c55e' : '#94a3b8';

    c.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
            <polyline fill="none" stroke="${color}" stroke-width="1.5" points="${polyline}" vector-effect="non-scaling-stroke"/>
            ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="1.2" fill="${color}" vector-effect="non-scaling-stroke" />`).join('')}
        </svg>
    `;
}
function updateWeightDisplay() {
    const el = document.getElementById('header-weight-display');
    el.innerText = weightHistory.length ? `${weightHistory[0].weight} kg` : `-- kg`;
}

// ============ BUSCA GLOBAL ============
function handleGlobalSearch(q) {
    const results = document.getElementById('search-results');
    q = q.trim().toLowerCase();
    if (!q) { results.classList.add('hidden'); return; }

    const matches = [];
    currentWorkout.forEach((day, di) => {
        (day.exercises || []).forEach((ex, ei) => {
            if (ex.name.toLowerCase().includes(q)) {
                matches.push({ day, di, ei, ex });
            }
        });
    });

    if (!matches.length) {
        results.innerHTML = `<p class="text-center text-slate-500 py-3 text-sm">Nada encontrado para "${escapeHtml(q)}"</p>`;
    } else {
        results.innerHTML = matches.slice(0, 20).map(m => {
            const lastLoad = getLastLoad(m.ex.name);
            const loadStr = lastLoad ? `${lastLoad.load}kg` : 'sem carga';
            return `
                <div class="flex items-center justify-between gap-2 py-1.5 border-b border-slate-800 last:border-0">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-slate-200 truncate">${escapeHtml(m.ex.name)}</p>
                        <p class="text-[11px] text-slate-500">${escapeHtml(m.day.day)} • ${m.ex.series}x${m.ex.reps} • <span class="text-cyan-400">${loadStr}</span></p>
                    </div>
                    <button onclick="goToDay(${m.di})" class="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded border border-brand-500/30">Ir</button>
                </div>
            `;
        }).join('');
    }
    results.classList.remove('hidden');
}

// ============ BACKUP COMPLETO ============
function backupAllData() {
    const data = {
        version: 3,
        exportedAt: new Date().toISOString(),
        workout: currentWorkout,
        completed: completedState,
        weight: weightHistory,
        loads: loadHistory,
        trainingHistory,
        loadGoals,
        sessionNotes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `meu-treino-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup salvo!');
}
function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('Isso substituirá todos os dados atuais pelo backup. Continuar?')) {
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.workout) currentWorkout = data.workout;
            if (data.completed) completedState = data.completed;
            if (data.weight) weightHistory = data.weight;
            if (data.loads) loadHistory = data.loads;
            if (data.trainingHistory) trainingHistory = data.trainingHistory;
            if (data.loadGoals) loadGoals = data.loadGoals;
            if (data.sessionNotes) sessionNotes = data.sessionNotes;

            saveWorkoutData();
            saveCompletedState();
            saveWeightData();
            saveLoadData();
            saveTrainingHistory();
            saveLoadGoals();
            saveSessionNotes();

            activeDayIndex = 0;
            renderDayTabs(); renderCurrentDay(); renderWeeklySummary();
            showToast('Backup restaurado!');
        } catch (err) {
            showToast('Arquivo inválido.', true);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// ============ IMPORT/EXPORT XLSX ============
function handleXlsxImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type:'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
            if (!rows.length) { showToast("Planilha vazia!", true); return; }
            parseAndApplyWorkoutData(rows);
            showToast("Treino importado!");
        } catch (err) {
            console.error(err);
            showToast("Erro ao processar .xlsx", true);
        } finally { event.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
}

function parseAndApplyWorkoutData(rows) {
    const map = {};
    rows.forEach(row => {
        const dayRaw = (row['Dia']||row['DIA']||row['dia']||'').toString().trim();
        const focus = (row['Foco muscular']||row['FOCO']||row['Foco']||'').toString().trim();
        const exName = (row['Exercício']||row['EXERCÍCIO']||row['Exercicio']||'').toString().trim();
        const s = (row['Séries']||row['SÉRIES']||'').toString().trim();
        const r = (row['Repetições']||row['REPETIÇÕES']||'').toString().trim();
        const re = (row['Descanso']||row['DESCANSO']||'').toString().trim();
        if (!dayRaw) return;
        const k = dayRaw.toUpperCase();
        if (!map[k]) map[k] = { day:k, focus: focus||'Geral', exercises:[] };
        else if (focus && !map[k].focus) map[k].focus = focus;
        if (exName && !exName.toLowerCase().includes('descanso')) {
            map[k].exercises.push({ name:exName, series:s||'3', reps:r||'10–12', rest:re||'60–90s' });
        }
    });
    const newW = Object.values(map).map(d => d.exercises.length ? d : {
        day:d.day, focus:d.focus||'Descanso', isRest:true, restInfo:'Dia sem exercícios programados.'
    });
    if (newW.length) {
        currentWorkout = newW;
        saveWorkoutData();
        completedState = {}; saveCompletedState();
        activeDayIndex = 0;
        renderDayTabs(); renderCurrentDay(); renderWeeklySummary();
    }
}

function exportToXlsx() {
    const out = [];
    currentWorkout.forEach((dayObj, dayIdx) => {
        if (dayObj.isRest || !dayObj.exercises?.length) {
            out.push({ 'Dia':dayObj.day, 'Foco muscular':dayObj.focus||'Descanso',
                'Exercício':'Descanso / Recuperação', 'Séries':'-', 'Repetições':'-',
                'Descanso':'-', 'Última Carga (kg)':'-', 'Meta (kg)':'-', 'Concluído ✓':'-' });
        } else {
            dayObj.exercises.forEach((ex, exIdx) => {
                const done = !!completedState[`${dayIdx}_${exIdx}`];
                const last = getLastLoad(ex.name);
                out.push({
                    'Dia':dayObj.day, 'Foco muscular':dayObj.focus, 'Exercício':ex.name,
                    'Séries':ex.series, 'Repetições':ex.reps, 'Descanso':ex.rest,
                    'Última Carga (kg)': last ? last.load : '',
                    'Meta (kg)': loadGoals[ex.name] || '',
                    'Concluído ✓': done ? 'SIM' : 'NÃO'
                });
            });
        }
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Treino');
    XLSX.writeFile(wb, 'Meu_Treino_Atual.xlsx');
    showToast("XLSX exportado!");
}

function restoreDefaultWorkout() {
    if (!confirm('Substituir treino atual pelos padrões do Flavão? Progresso e histórico de cargas serão mantidos.')) return;
    currentWorkout = clone(DEFAULT_WORKOUT_FLAVAO);
    saveWorkoutData();
    completedState = {}; saveCompletedState();
    activeDayIndex = 0;
    renderDayTabs(); renderCurrentDay(); renderWeeklySummary();
    toggleSettingsMenu();
    showToast("Treino padrão restaurado!");
}

// ============ UTILS ============
function toggleSettingsMenu() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}
function showToast(text, isError=false) {
    const t = document.getElementById('toast-message');
    const txt = document.getElementById('toast-text');
    const icon = document.getElementById('toast-icon');
    txt.innerText = text;
    icon.className = isError
        ? "fa-solid fa-circle-exclamation text-rose-500 text-base"
        : "fa-solid fa-circle-check text-brand-500 text-base";
    t.classList.remove('opacity-0','pointer-events-none','translate-y-4');
    t.classList.add('opacity-100','translate-y-0');
    clearTimeout(window._toastTO);
    window._toastTO = setTimeout(() => {
        t.classList.remove('opacity-100','translate-y-0');
        t.classList.add('opacity-0','pointer-events-none','translate-y-4');
    }, 3000);
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

// ============ BAIXAR MODELO DE PLANILHA ============
function downloadTemplateXlsx() {
    // Linhas de exemplo que demonstram o formato esperado
    const modelRows = [
        { 'Dia':'SEGUNDA', 'Foco muscular':'Peito + tríceps', 'Exercício':'Supino reto máquina, halteres ou smith', 'Séries':'3', 'Repetições':'8–12', 'Descanso':'90–120s' },
        { 'Dia':'SEGUNDA', 'Foco muscular':'Peito + tríceps', 'Exercício':'Supino inclinado com halteres ou smith', 'Séries':'3', 'Repetições':'10–12', 'Descanso':'90s' },
        { 'Dia':'SEGUNDA', 'Foco muscular':'Peito + tríceps', 'Exercício':'Crucifixo máquina (peck deck) ou articulada', 'Séries':'3', 'Repetições':'12–15', 'Descanso':'60–90s' },
        { 'Dia':'TERÇA',   'Foco muscular':'Costas + bíceps', 'Exercício':'Puxada frontal', 'Séries':'3', 'Repetições':'8–12', 'Descanso':'90–120s' },
        { 'Dia':'TERÇA',   'Foco muscular':'Costas + bíceps', 'Exercício':'Remada sentada pegada neutra', 'Séries':'3', 'Repetições':'10–12', 'Descanso':'90s' },
        { 'Dia':'QUARTA',  'Foco muscular':'Pernas - quadríceps', 'Exercício':'Leg press 45º', 'Séries':'3', 'Repetições':'10–12', 'Descanso':'90–120s' },
        { 'Dia':'QUARTA',  'Foco muscular':'Pernas - quadríceps', 'Exercício':'Cadeira extensora', 'Séries':'3', 'Repetições':'12–15', 'Descanso':'60–90s' },
        { 'Dia':'SÁBADO',  'Foco muscular':'Descanso', 'Exercício':'', 'Séries':'', 'Repetições':'', 'Descanso':'' },
        { 'Dia':'DOMINGO', 'Foco muscular':'Descanso', 'Exercício':'', 'Séries':'', 'Repetições':'', 'Descanso':'' }
    ];

    // Folha 1: Exemplo
    const wsModel = XLSX.utils.json_to_sheet(modelRows);

    // Ajustar largura das colunas para ficar legível
    wsModel['!cols'] = [
        { wch: 12 },  // Dia
        { wch: 24 },  // Foco muscular
        { wch: 45 },  // Exercício
        { wch: 8 },   // Séries
        { wch: 12 },  // Repetições
        { wch: 14 }   // Descanso
    ];

    // Folha 2: Instruções
    const instructions = [
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': 'COMO USAR ESTA PLANILHA' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': '1. Preencha a aba "Modelo" (ou crie a sua própria).' },
        { 'Instruções de Preenchimento': '2. Mantenha os nomes das colunas EXATAMENTE como estão:' },
        { 'Instruções de Preenchimento': '   Dia | Foco muscular | Exercício | Séries | Repetições | Descanso' },
        { 'Instruções de Preenchimento': '3. Cada linha = 1 exercício.' },
        { 'Instruções de Preenchimento': '4. Repita o "Dia" e o "Foco muscular" em cada linha do mesmo dia.' },
        { 'Instruções de Preenchimento': '5. Para um dia de DESCANSO, deixe a coluna "Exercício" vazia.' },
        { 'Instruções de Preenchimento': '6. Salve o arquivo como .xlsx.' },
        { 'Instruções de Preenchimento': '7. No app: Menu (⋮) → Importar Treino (.xlsx) → escolha o arquivo.' },
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': 'REGRAS IMPORTANTES' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': '• A importação SUBSTITUI todo o treino atual.' },
        { 'Instruções de Preenchimento': '• O histórico de cargas e pesos corporais é MANTIDO.' },
        { 'Instruções de Preenchimento': '• Os checkboxes de progresso são ZERADOS.' },
        { 'Instruções de Preenchimento': '• Faça um Backup (.json) antes, se quiser garantir.' },
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': 'EXEMPLO DE PREENCHIMENTO' },
        { 'Instruções de Preenchimento': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { 'Instruções de Preenchimento': '' },
        { 'Instruções de Preenchimento': 'Dia      | Foco muscular        | Exercício         | Séries | Repetições | Descanso' },
        { 'Instruções de Preenchimento': 'SEGUNDA  | Peito + tríceps       | Supino reto       | 3      | 8–12       | 90–120s' },
        { 'Instruções de Preenchimento': 'SEGUNDA  | Peito + tríceps       | Crucifixo         | 3      | 12–15      | 60–90s' },
        { 'Instruções de Preenchimento': 'TERÇA    | Costas + bíceps       | Puxada frontal    | 3      | 8–12       | 90–120s' },
        { 'Instruções de Preenchimento': 'SÁBADO   | Descanso              | (vazio)           |        |            |' }
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];

    // Montar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsModel, 'Modelo');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    XLSX.writeFile(wb, 'Modelo_Treino_Flavão.xlsx');
    showToast('Modelo de planilha baixado!');
}