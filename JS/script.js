// código apenas para testar se está funcionando
function startListening() {
    const container = document.querySelector(".voice-calc");
    const status = document.getElementById("status");
    const spokenText = document.getElementById("spokenText");
    const display = document.getElementById("display");

    container.classList.add("listening");
    status.textContent = "Ouvindo...";

    setTimeout(() => {
        container.classList.remove("listening");
        status.textContent = "Reconhecimento concluído";
        spokenText.textContent = "Você falou: dois mais dois";
        display.textContent = "4";
    }, 3000);
}