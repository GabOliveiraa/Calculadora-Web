function interpretarExpressao(texto) {
    texto = texto.toLowerCase().trim();

    // remove frases desnecessárias
    texto = texto
        .replace(/quanto é/g, "")
        .replace(/calcula/g, "")
        .replace(/calcule/g, "")
        .replace(/resultado de/g, "")
        .trim();

    // números por extenso
    const numeros = {
        "zero": 0,
        "um": 1,
        "dois": 2,
        "três": 3,
        "tres": 3,
        "quatro": 4,
        "cinco": 5,
        "seis": 6,
        "sete": 7,
        "oito": 8,
        "nove": 9,
        "dez": 10
    };

    // operadores
    texto = texto
        .replace(/mais/g, "+")
        .replace(/menos/g, "-")
        .replace(/vezes|x|\*/g, "*")
        .replace(/dividido por|dividir por|divide por|dividido|dividir|divide/g, "/");

    // troca palavras por números
    Object.keys(numeros).forEach((palavra) => {
        const regex = new RegExp(`\\b${palavra}\\b`, "g");
        texto = texto.replace(regex, numeros[palavra]);
    });

    // limpa espaços extras
    texto = texto.replace(/\s+/g, " ").trim();

    return texto;
}

function calcular(expressao) {
    try {
        let resultado = eval(expressao);

        if (typeof resultado === "number" && !Number.isInteger(resultado)) {
            resultado = parseFloat(resultado.toFixed(2));
        }

        return resultado;
    } catch {
        return "Erro";
    }
}

function startListening() {
    const container = document.querySelector(".voice-calc");
    const status = document.getElementById("status");
    const spokenText = document.getElementById("spokenText");
    const display = document.getElementById("display");

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    // se o navegador não suportar
    if (!SpeechRecognition) {
        status.textContent = "Reconhecimento não suportado";
        spokenText.textContent = "Você falou: —";
        display.textContent = "Erro";
        return;
    }

    const recognition = new SpeechRecognition();

    // configurações principais
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // estado visual
    container.classList.add("listening");
    status.textContent = "Ouvindo...";

    // quando reconhecer algo
    recognition.onresult = (event) => {
        const textoFalado = event.results[0][0].transcript;

        spokenText.textContent = "Você falou: " + textoFalado;

        const expressao = interpretarExpressao(textoFalado);
        const resultado = calcular(expressao);

        display.textContent = resultado;
        display.setAttribute("aria-label", `Resultado: ${resultado}`);

        falarTexto(`O resultado de ${textoFalado} é ${resultado}`);
    };

    // quando a pessoa parar de falar
    recognition.onspeechend = () => {
        recognition.stop();
        container.classList.remove("listening");
        status.textContent = "Reconhecimento concluído";
    };

    // se não reconhecer direito
    recognition.onnomatch = () => {
        container.classList.remove("listening");
        status.textContent = "Não entendi";
        display.textContent = "Erro";
    };

    // erro geral
    recognition.onerror = (event) => {
        container.classList.remove("listening");
        status.textContent = "Erro no microfone";
        spokenText.textContent = `Você falou: erro (${event.error})`;
        display.textContent = "Erro";

        falarTexto("Ocorreu um erro no reconhecimento de voz");
    };

    recognition.start();
}

// resposta falada
function falarTexto(texto) {
    // cancela qualquer fala anterior
    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    // define idioma
    fala.lang = "pt-BR";

    // velocidade e tom
    fala.rate = 1;
    fala.pitch = 1;

    window.speechSynthesis.speak(fala);
}

// Alterna entre modo claro e escuro
function toggleTheme() {
    document.body.classList.toggle("light-mode");

    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

// Quando a página carregar, aplica o tema salvo
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }
});