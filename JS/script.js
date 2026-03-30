// Simula a escuta do microfone, por enquanto até ser adicionado
// as funções da calculadora
function startListening() {
    const container = document.querySelector(".voice-calc");
    const status = document.getElementById("status");
    
    // Liga o feedback visual (animações e textos)
    container.classList.add("listening");
    status.textContent = "Ouvindo...";

    // Simula um delay de processamento de 3 segundos
    setTimeout(() => {
        container.classList.remove("listening");
        status.textContent = "Reconhecimento concluído";
        document.getElementById("spokenText").textContent = "Você falou: dois mais dois";
        document.getElementById("display").textContent = "4";
    }, 3000);
}

// Alterna entre modo claro e escuro
function toggleTheme() {
    document.body.classList.toggle("light-mode");

    // Verifica se ficou claro ou escuro e salva a escolha no navegador
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

// Assim que a página carregar, verifica se o usuário já tinha escolhido um tema antes
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }
});