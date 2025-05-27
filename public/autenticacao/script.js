// script.js — SUPABASE + FIREBASE + VALIDAÇÕES + TOAST

import { createClient }    from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { initializeApp }   from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { getAnalytics }    from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

const SUPABASE_URL  = "https://zrfgitzipulplvxihpik.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZmdpdHppcHVscGx2eGlocGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTcwMjQsImV4cCI6MjA2MjU3MzAyNH0.wOvc9NwaXJqfT_8OpId2NZey42Rb3a4129-FeKE9COA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const firebaseConfig = {
  apiKey:            "AIzaSyBCXGROCEjPw2AKwrkSrvJwoyT0eX5ZiDk",
  authDomain:        "fazfestasapp.firebaseapp.com",
  databaseURL:       "https://fazfestasapp-default-rtdb.firebaseio.com",
  projectId:         "fazfestasapp",
  storageBucket:     "fazfestasapp.firebasestorage.app",
  messagingSenderId: "587597050441",
  appId:             "1:587597050441:web:95aa6d63f73e3073ca0598",
  measurementId:     "G-SNG49SH2YB"
};
const fbApp       = initializeApp(firebaseConfig);
export const fbStorage = getStorage(fbApp);
getAnalytics(fbApp);

// 2. VALIDAÇÕES ÚTEIS
const validateEmail = (em) => /^\S+@\S+\.\S+$/.test(em);
const validatePassword = (pw) => pw.length >= 6;

// 3. FUNÇÕES DE AUTENTICAÇÃO
async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nome_completo: name } }
  });
  if (error) throw error;
  await supabase
    .from("profiles")
    .insert([{ id: data.user.id, email, nome_completo: name }]);
  return data;
}

async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// 4. BINDINGS
document.addEventListener("DOMContentLoaded", () => {
  // LOGIN
  const btnLogin = document.getElementById("btn-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", async e => {
      e.preventDefault();
      const email    = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-pass").value;
      if (!validateEmail(email))    return showToast("E-mail inválido", { type: "warning" });
      if (!validatePassword(password)) return showToast("Senha precisa ter mínimo de 6 caracteres", { type: "warning" });
      try {
        await signIn(email, password);
        showToast("Login realizado com sucesso!", { type: "success" });
        setTimeout(() => window.location.href = "/index.html", 800);
      } catch (err) {
        showToast(err.message, { type: "error" });
      }
    });
  }

  // CADASTRO
  const btnSignup = document.getElementById("btn-signup");
  if (btnSignup) {
    btnSignup.addEventListener("click", async e => {
      e.preventDefault();
      const name     = document.getElementById("signup-name").value.trim();
      const email    = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-pass").value;
      if (!name)                     return showToast("Informe seu nome", { type: "warning" });
      if (!validateEmail(email))     return showToast("E-mail inválido", { type: "warning" });
      if (!validatePassword(password)) return showToast("Senha precisa ter ≥6 caracteres", { type: "warning" });
      try {
        await signUp(name, email, password);
        showToast("Conta criada! Verifique seu e-mail.", { type: "success" });
        setTimeout(() => window.location.href = "login.html", 1000);
      } catch (err) {
        showToast(err.message, { type: "error" });
      }
    });
  }

  // RECUPERAR SENHA
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", async e => {
      e.preventDefault();
      const email = document.getElementById("reset-email").value.trim();
      if (!validateEmail(email)) return showToast("E-mail inválido", { type: "warning" });
      try {
        await sendPasswordReset(email);
        showToast("Link de recuperação enviado!", { type: "success" });
        setTimeout(() => window.location.href = "login.html", 800);
      } catch (err) {
        showToast(err.message, { type: "error" });
      }
    });
  }
});
