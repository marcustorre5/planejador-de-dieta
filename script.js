let currentUser = null;

// ===== ELEMENTOS =====
const loginSection = document.getElementById('login-section');
const app = document.getElementById('app');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginMsg = document.getElementById('login-msg');

// ===== LOGIN / REGISTRO =====
loginBtn.addEventListener('click', () => {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if (!user || !pass) return;

  const users = JSON.parse(localStorage.getItem('usuarios')) || {};
  if (users[user] && users[user].senha === pass) {
    currentUser = user;
    localStorage.setItem('usuarioLogado', user);
    iniciarApp();
  } else {
    loginMsg.textContent = "❌ Usuário ou senha incorretos";
  }
});

registerBtn.addEventListener('click', () => {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if (!user || !pass) return;

  const users = JSON.parse(localStorage.getItem('usuarios')) || {};
  if (users[user]) {
    loginMsg.textContent = "⚠️ Usuário já existe!";
    return;
  }

  users[user] = { senha: pass, dados: {} };
  localStorage.setItem('usuarios', JSON.stringify(users));
  loginMsg.textContent = "✅ Conta criada! Faça login.";
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('usuarioLogado');
  location.reload();
});

// ===== INICIAR APP =====
function iniciarApp() {
  loginSection.classList.add('hidden');
  app.classList.remove('hidden');
  currentUser = localStorage.getItem('usuarioLogado');
  carregarTema();

  mostrarUsuario();
  mostrarRefeicoes();
  atualizarGraficoCalorias();
  atualizarGraficoPeso();
  mostrarIMC();
}

// ===== FUNÇÕES AUXILIARES =====
function getUserData() {
  const allUsers = JSON.parse(localStorage.getItem('usuarios')) || {};
  return allUsers[currentUser]?.dados || {};
}

function setUserData(data) {
  const allUsers = JSON.parse(localStorage.getItem('usuarios')) || {};
  if (!allUsers[currentUser]) allUsers[currentUser] = { senha: '', dados: {} };
  allUsers[currentUser].dados = data;
  localStorage.setItem('usuarios', JSON.stringify(allUsers));
}

// ===== TEMA ESCURO =====
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('tema', document.body.classList.contains('dark') ? 'dark' : 'light');
});
function carregarTema() {
  const tema = localStorage.getItem('tema');
  if (tema === 'dark') document.body.classList.add('dark');
}

// ===== NAVEGAÇÃO =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.section;
    document.querySelectorAll('main section').forEach(sec =>
      sec.classList.toggle('hidden', sec.id !== target)
    );
  });
});

// ===== PERFIL =====
const userForm = document.getElementById('user-form');
const userInfo = document.getElementById('user-info');
const perfilMsg = document.getElementById('perfil-msg');

userForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = getUserData();
  data.perfil = {
    nome: nome.value,
    peso: parseFloat(peso.value),
    altura: parseFloat(altura.value),
    metaCalorias: parseInt(metaCalorias.value)
  };
  setUserData(data);
  mostrarUsuario();

  perfilMsg.classList.remove('hidden');
  setTimeout(() => perfilMsg.classList.add('hidden'), 3000);
});

function mostrarUsuario() {
  const data = getUserData();
  const user = data.perfil;
  if (!user) return;
  const imc = (user.peso / ((user.altura / 100) ** 2)).toFixed(2);
  userInfo.innerHTML = `
    <p><strong>Nome:</strong> ${user.nome}</p>
    <p><strong>Peso:</strong> ${user.peso} kg</p>
    <p><strong>Altura:</strong> ${user.altura} cm</p>
    <p><strong>IMC:</strong> ${imc}</p>
    <p><strong>Meta Calórica:</strong> ${user.metaCalorias} kcal</p>
  `;
}

// ===== REFEIÇÕES =====
const mealForm = document.getElementById('meal-form');
const mealList = document.getElementById('meal-list');
const totalCalEl = document.getElementById('total-calorias');
const alertaMeta = document.getElementById('alerta-meta');

mealForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = getUserData();
  data.refeicoes = data.refeicoes || [];

  data.refeicoes.push({
    alimento: alimento.value,
    calorias: parseInt(calorias.value),
    data: document.getElementById('data').value
  });

  setUserData(data);
  mealForm.reset();
  mostrarRefeicoes();
  atualizarGraficoCalorias();
});

function mostrarRefeicoes() {
  const data = getUserData();
  const refeicoes = data.refeicoes || [];
  mealList.innerHTML = '';
  const hoje = new Date().toISOString().split('T')[0];
  let total = 0;

  refeicoes.forEach(r => {
    if (r.data === hoje) total += r.calorias;
    const div = document.createElement('div');
    div.className = 'meal-item';
    const [ano, mes, dia] = r.data.split('-');
    const dataFormatada = `${dia}-${mes}-${ano}`;
    div.innerHTML = `<span>${dataFormatada} - ${r.alimento}</span><span>${r.calorias} kcal</span>`;
    mealList.appendChild(div);
  });

  totalCalEl.textContent = total;
  verificarMeta(total);
}

function verificarMeta(total) {
  const data = getUserData();
  const meta = data.perfil?.metaCalorias;
  if (!meta) return;

  alertaMeta.style.display = 'block';
  if (total >= meta) {
    alertaMeta.textContent = "⚠️ Meta calórica ultrapassada!";
    alertaMeta.className = 'alert bad';
  } else if (total >= meta * 0.8) {
    alertaMeta.textContent = "💪 80% da meta atingida!";
    alertaMeta.className = 'alert good';
  } else {
    alertaMeta.style.display = 'none';
  }
}

// ===== GRÁFICO CALORIAS =====
const ctx1 = document.getElementById('progressChart').getContext('2d');
let chartCalorias = new Chart(ctx1, {
  type: 'bar',
  data: { labels: [], datasets: [{ label: 'Calorias (kcal)', data: [], backgroundColor: '#00bfa5a8' }] },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

function atualizarGraficoCalorias() {
  const data = getUserData();
  const refeicoes = data.refeicoes || [];
  const caloriasPorDia = {};

  refeicoes.forEach(r => {
    caloriasPorDia[r.data] = (caloriasPorDia[r.data] || 0) + r.calorias;
  });
  
  // Converte as datas para formato DD-MM-YYYY
  const labels = Object.keys(caloriasPorDia).map(date => {
    const [ano, mes, dia] = date.split('-');
    return `${dia}-${mes}-${ano}`;
  });

  chartCalorias.data.labels = labels;
  chartCalorias.data.datasets[0].data = Object.values(caloriasPorDia);
  chartCalorias.update();
}

// ===== PROGRESSO FÍSICO =====
const fitnessForm = document.getElementById('fitness-form');
const imcInfo = document.getElementById('imc-info');
const ctx2 = document.getElementById('weightChart').getContext('2d');
let chartPeso = new Chart(ctx2, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Peso (kg)', data: [], borderColor: '#00796b', backgroundColor: '#00796b33', fill: true }] },
  options: { responsive: true }
});

fitnessForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = getUserData();
  data.progresso = data.progresso || [];
  data.progresso.push({
    peso: parseFloat(pesoAtual.value),
    data: document.getElementById('dataPeso').value
  });
  setUserData(data);
  fitnessForm.reset();
  atualizarGraficoPeso();
  mostrarIMC();
});

function atualizarGraficoPeso() {
  const data = getUserData();
  const progresso = data.progresso || [];

  // ✅ Converte formato de data
  const labels = progresso.map(p => {
    const [ano, mes, dia] = p.data.split('-');
    return `${dia}-${mes}-${ano}`;
  });

  chartPeso.data.labels = labels;
  chartPeso.data.datasets[0].data = progresso.map(p => p.peso);
  chartPeso.update();
}

function mostrarIMC() {
  const data = getUserData();
  const perfil = data.perfil;
  const progresso = data.progresso || [];
  if (!perfil) return;
  const peso = progresso.length ? progresso[progresso.length - 1].peso : perfil.peso;
  const imc = (peso / ((perfil.altura / 100) ** 2)).toFixed(2);
  imcInfo.textContent = `IMC Atual: ${imc}`;
}

// ===== EXPORTAR PDF (corrigido - acentos OK) =====
document.getElementById('exportar-pdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const data = getUserData();
  const perfil = data.perfil || {};
  const progresso = data.progresso || [];
  const refeicoes = data.refeicoes || [];

  // Cabeçalho
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 121, 107);
  doc.text("Relatório de Dieta", 105, 15, { align: "center" });
  doc.setDrawColor(0, 121, 107);
  doc.line(10, 20, 200, 20);

  // Dados do perfil
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let y = 30;
  doc.text(`Nome: ${perfil.nome || '-'}`, 10, y);
  doc.text(`Peso: ${perfil.peso || '-'} kg`, 10, y + 7);
  doc.text(`Altura: ${perfil.altura || '-'} cm`, 10, y + 14);
  doc.text(`Meta calórica: ${perfil.metaCalorias || '-'} kcal`, 10, y + 21);

  // Seção Progresso
  y += 35;
  doc.setFontSize(14);
  doc.setTextColor(0, 121, 107);
  doc.text("Progresso de Peso", 10, y);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  if (progresso.length === 0) {
    doc.text("Nenhum registro de peso.", 10, y + 7);
  } else {
    progresso.forEach((p, i) => {
      const [ano, mes, dia] = p.data.split('-');
      const dataFormatada = `${dia}-${mes}-${ano}`;
      doc.text(`${dataFormatada} — ${p.peso} kg`, 10, y + 7 + i * 7);
    });
    y += 7 * progresso.length + 10;
  }

  // Seção Refeições
  doc.setFontSize(14);
  doc.setTextColor(0, 121, 107);
  doc.text("Refeições Registradas", 10, y);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  if (refeicoes.length === 0) {
    doc.text("Nenhuma refeição registrada.", 10, y + 7);
  } else {
    refeicoes.forEach((r, i) => {
      const [ano, mes, dia] = r.data.split('-');
      const dataFormatada = `${dia}-${mes}-${ano}`;
      if (y + 15 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${dataFormatada} — ${r.alimento}: ${r.calorias} kcal`, 10, y + 7 + i * 7);
    });
  }

  // Rodapé
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Gerado automaticamente pelo Planejador de Dieta © 2025", 105, 290, { align: "center" });

  doc.save(`relatorio_${perfil.nome || 'usuario'}.pdf`);
});
