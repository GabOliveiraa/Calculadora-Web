function interpretarExpressao(texto) {
    texto = texto.toLowerCase().trim();

    // remove frases desnecessárias
    texto = texto
        .replace(/quanto é/g, "")
        .replace(/calcula/g, "")
        .replace(/calcule/g, "")
        .replace(/resultado de/g, "")
        .trim();

    // Remove o "e" conector (ex: vinte e dois)
    texto = texto.replace(/\s+e\s+/g, " ");

    // números por extenso
    const numeros = {
        // Unidades e 11-19
        "zero": 0, "um": 1, "dois": 2, "três": 3, "tres": 3, "quatro": 4, "cinco": 5,
        "seis": 6, "sete": 7, "oito": 8, "nove": 9, "dez": 10, "onze": 11, "doze": 12,
        "treze": 13, "quatorze": 14, "catorze": 14, "quinze": 15, "dezesseis": 16,
        "dezessete": 17, "dezoito": 18, "dezenove": 19,

        // Dezenas
        "vinte": 20, "trinta": 30, "quarenta": 40, "cinquenta": 50,
        "sessenta": 60, "setenta": 70, "oitenta": 80, "noventa": 90, "cem": 100, "cento": 100
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
        // só calcula se tiver operador
        if (!/[+\-*/]/.test(expressao)) {
            return "Operação inválida";
        }

        let resultado = eval(expressao);

        // tratamento especial de divisão inválida
        if (Number.isNaN(resultado)) {
            return "Indefinido";
        }

        if (!Number.isFinite(resultado)) {
            return "Infinito";
        }

        // limita casas decimais
        if (typeof resultado === "number" && !Number.isInteger(resultado)) {
            resultado = parseFloat(resultado.toFixed(2));
        }

        return resultado;
    } catch {
        return "Erro";
    }
}

function formatarExpressaoParaFala(texto) {
    return texto
        .replace(/\+/g, " mais ")
        .replace(/\-/g, " menos ")
        .replace(/\*/g, " vezes ")
        .replace(/\//g, " dividido por ")
        .replace(/\s+/g, " ")
        .trim();
}

// resposta falada
function falarTexto(texto) {
    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    function definirVoz() {
        const vozes = window.speechSynthesis.getVoices();
        const vozPtBr = vozes.find((voz) => voz.lang === "pt-BR");

        if (vozPtBr) {
            fala.voice = vozPtBr;
        }

        fala.lang = "pt-BR";
        fala.rate = 1;
        fala.pitch = 1;

        window.speechSynthesis.speak(fala);
    }

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = definirVoz;
    } else {
        definirVoz();
    }
}

function startListening() {
    const container = document.querySelector(".voice-calc");
    const status = document.getElementById("status");
    const spokenText = document.getElementById("spokenText");
    const display = document.getElementById("display");
    const micBtn = document.getElementById("mic-btn");

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

    micBtn.disabled = true;
    micBtn.setAttribute("aria-pressed", "true");
    micBtn.setAttribute("aria-label", "Reconhecimento de voz em andamento");

    // quando reconhecer algo
    recognition.onresult = (event) => {
        const textoFalado = event.results[0][0].transcript;

        spokenText.textContent = "Você falou: " + textoFalado;

        const expressao = interpretarExpressao(textoFalado);
        const resultado = calcular(expressao);

        if (resultado === "Operação inválida") {
            display.textContent = "—";
            display.setAttribute("aria-label", "Operação inválida");
            falarTexto("Você precisa falar uma operação, por exemplo, dois mais dois.");
            return;
        }

        if (resultado === "Erro") {
            display.textContent = "Erro";
            display.setAttribute("aria-label", "Erro no cálculo");
            falarTexto("Não foi possível calcular a operação.");
            return;
        }

        if (resultado === "Indefinido") {
            display.textContent = "Indefinido";
            display.setAttribute("aria-label", "Resultado indefinido");
            falarTexto("Essa operação é indefinida.");
            return;
        }

        if (resultado === "Infinito") {
            display.textContent = "Infinito";
            display.setAttribute("aria-label", "Resultado infinito");
            falarTexto("O resultado é infinito.");
            return;
        }

        display.textContent = resultado;
        display.setAttribute("aria-label", `O resultado é ${resultado}`);

        const textoParaFala = formatarExpressaoParaFala(expressao);
        falarTexto(`${textoParaFala} é igual a ${resultado}`);
    };

    // quando a pessoa parar de falar
    recognition.onspeechend = () => {
        recognition.stop();
        container.classList.remove("listening");
        status.textContent = "Reconhecimento concluído";
        micBtn.disabled = false;
        micBtn.setAttribute("aria-pressed", "false");
        micBtn.setAttribute("aria-label", "Iniciar reconhecimento de voz");
    };

    // se não reconhecer direito
    recognition.onnomatch = () => {
        container.classList.remove("listening");
        status.textContent = "Não entendi";
        spokenText.textContent = "Você falou: —";
        display.textContent = "Erro";
        display.setAttribute("aria-label", "Não entendi a operação");
        falarTexto("Não entendi a operação.");
        micBtn.disabled = false;
        micBtn.setAttribute("aria-pressed", "false");
        micBtn.setAttribute("aria-label", "Iniciar reconhecimento de voz");
    };

    // erro geral
    recognition.onerror = (event) => {
        container.classList.remove("listening");
        micBtn.disabled = false;
        micBtn.setAttribute("aria-pressed", "false");
        micBtn.setAttribute("aria-label", "Iniciar reconhecimento de voz");

        spokenText.textContent = "Você falou: —";

        if (event.error === "no-speech") {
            status.textContent = "Não ouvi nada";
            display.textContent = "—";
            falarTexto("Não ouvi nada. Tente novamente.");
            return;
        }

        if (event.error === "audio-capture") {
            status.textContent = "Microfone não encontrado";
            display.textContent = "Erro";
            falarTexto("Microfone não encontrado.");
            return;
        }

        if (event.error === "not-allowed") {
            status.textContent = "Permissão negada";
            display.textContent = "Erro";
            falarTexto("Permissão do microfone negada.");
            return;
        }

        status.textContent = "Reconhecimento interrompido";
        display.textContent = "Erro";
        falarTexto("O reconhecimento foi interrompido.");
    };

    // quando finalizar totalmente
    recognition.onend = () => {
        container.classList.remove("listening");
        micBtn.disabled = false;
        micBtn.setAttribute("aria-pressed", "false");
        micBtn.setAttribute("aria-label", "Iniciar reconhecimento de voz");

        if (status.textContent === "Ouvindo...") {
            status.textContent = "Pronto para falar";
        }
    };

    recognition.start();
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