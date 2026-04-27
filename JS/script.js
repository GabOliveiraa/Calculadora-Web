function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizarTexto(texto) {
    return removerAcentos(texto.toLowerCase().trim());
}

function converterNumero(texto) {
    texto = normalizarTexto(texto);

    // limpa espaços extras
    texto = texto.replace(/\s+/g, " ").trim();

    // trata número com separador de milhar brasileiro
    // exemplo: "10.000", "1.500", "100.000"
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(texto)) {
        texto = texto.replace(/\./g, "").replace(",", ".");
        return Number(texto);
    }

    // trata número decimal com vírgula
    // exemplo: "10,5", "-2,75"
    if (/^-?\d+,\d+$/.test(texto)) {
        return Number(texto.replace(",", "."));
    }

    // trata número digitado normal
    // exemplo: "10", "10000", "-2000", "2.5"
    if (/^-?\d+(\.\d+)?$/.test(texto)) {
        return Number(texto);
    }

    let negativo = false;

    // trata negativo falado
    // exemplo: "menos dez", "negativo dez"
    if (texto.startsWith("menos ")) {
        negativo = true;
        texto = texto.replace("menos ", "").trim();
    }

    if (texto.startsWith("negativo ")) {
        negativo = true;
        texto = texto.replace("negativo ", "").trim();
    }

    // trata decimal falado com vírgula
    // exemplo: "dez virgula cinco"
    if (texto.includes(" virgula ")) {
        const partesDecimal = texto.split(" virgula ");

        const inteiro = converterNumero(partesDecimal[0]);
        const decimalTexto = partesDecimal.slice(1).join(" ");
        const decimal = converterNumero(decimalTexto);

        if (inteiro === null || decimal === null) {
            return null;
        }

        const casas = String(decimal).length;
        const resultado = inteiro + decimal / Math.pow(10, casas);

        return negativo ? -resultado : resultado;
    }

    // remove o "e" usado em números por extenso
    // exemplo: "vinte e dois" vira "vinte dois"
    const partes = texto.split(/\s+/).filter((parte) => parte !== "e");

    const numeros = {
        "zero": 0,
        "um": 1,
        "uma": 1,
        "dois": 2,
        "duas": 2,
        "tres": 3,
        "quatro": 4,
        "cinco": 5,
        "seis": 6,
        "sete": 7,
        "oito": 8,
        "nove": 9,

        "dez": 10,
        "onze": 11,
        "doze": 12,
        "treze": 13,
        "quatorze": 14,
        "catorze": 14,
        "quinze": 15,
        "dezesseis": 16,
        "dezessete": 17,
        "dezoito": 18,
        "dezenove": 19,

        "vinte": 20,
        "trinta": 30,
        "quarenta": 40,
        "cinquenta": 50,
        "sessenta": 60,
        "setenta": 70,
        "oitenta": 80,
        "noventa": 90,

        "cem": 100,
        "cento": 100,
        "duzentos": 200,
        "trezentos": 300,
        "quatrocentos": 400,
        "quinhentos": 500,
        "seiscentos": 600,
        "setecentos": 700,
        "oitocentos": 800,
        "novecentos": 900
    };

    let total = 0;
    let atual = 0;

    for (const parte of partes) {
        if (numeros[parte] !== undefined) {
            atual += numeros[parte];
        } else if (parte === "mil") {
            // exemplo: "mil" vira 1000
            // exemplo: "dois mil" vira 2000
            if (atual === 0) {
                atual = 1;
            }

            total += atual * 1000;
            atual = 0;
        } else if (parte === "milhao" || parte === "milhoes") {
            // exemplo: "um milhao" vira 1000000
            if (atual === 0) {
                atual = 1;
            }

            total += atual * 1000000;
            atual = 0;
        } else {
            return null;
        }
    }

    const resultado = total + atual;

    return negativo ? -resultado : resultado;
}

function separarExpressao(texto) {
    const operadores = ["+", "-", "*", "/"];

    // procura o operador principal sem confundir com número negativo no começo
    for (let i = 0; i < texto.length; i++) {
        const caractere = texto[i];

        if (!operadores.includes(caractere)) {
            continue;
        }

        // ignora o sinal negativo no começo do primeiro número
        if (caractere === "-" && i === 0) {
            continue;
        }

        // ignora sinal negativo logo depois de outro operador
        // exemplo: "10 + -2"
        const anterior = texto[i - 1];
        const proximo = texto[i + 1];

        if (caractere === "-" && operadores.includes(anterior)) {
            continue;
        }

        const esquerda = texto.slice(0, i).trim();
        const direita = texto.slice(i + 1).trim();

        if (!esquerda || !direita) {
            return null;
        }

        return {
            esquerda,
            operador: caractere,
            direita
        };
    }

    return null;
}

function interpretarExpressao(texto) {
    texto = normalizarTexto(texto);

    // remove frases desnecessárias
    texto = texto
        .replace(/quanto e/g, "")
        .replace(/qual e/g, "")
        .replace(/calcula/g, "")
        .replace(/calcule/g, "")
        .replace(/resultado de/g, "")
        .replace(/me diga/g, "")
        .replace(/por favor/g, "")
        .trim();

    // trata formatos especiais de fala
    // exemplo: "produto de 5 por 2"
    let match = texto.match(/^produto de (.+) por (.+)$/);
    if (match) {
        texto = `${match[1]} * ${match[2]}`;
    }

    // exemplo: "quociente de 10 por 2"
    match = texto.match(/^quociente de (.+) por (.+)$/);
    if (match) {
        texto = `${match[1]} / ${match[2]}`;
    }

    // exemplo: "somar 10 com 5"
    match = texto.match(/^somar (.+) com (.+)$/);
    if (match) {
        texto = `${match[1]} + ${match[2]}`;
    }

    // exemplo: "soma 10 com 5"
    match = texto.match(/^soma (.+) com (.+)$/);
    if (match) {
        texto = `${match[1]} + ${match[2]}`;
    }

    // exemplo: "adicionar 10 com 5"
    match = texto.match(/^adicionar (.+) com (.+)$/);
    if (match) {
        texto = `${match[1]} + ${match[2]}`;
    }

    // exemplo: "tirar 3 de 10"
    // importante: isso vira 10 - 3
    match = texto.match(/^tirar (.+) de (.+)$/);
    if (match) {
        texto = `${match[2]} - ${match[1]}`;
    }

    // troca operadores falados por símbolos
    texto = texto
        // divisão
        .replace(/dividido por/g, " / ")
        .replace(/dividir por/g, " / ")
        .replace(/divide por/g, " / ")
        .replace(/dividido/g, " / ")
        .replace(/dividir/g, " / ")
        .replace(/divide/g, " / ")
        .replace(/quociente de/g, " / ")
        .replace(/quociente/g, " / ")
        .replace(/sobre/g, " / ")
        .replace(/barra/g, " / ")

        // multiplicação
        .replace(/multiplicado por/g, " * ")
        .replace(/multiplicar por/g, " * ")
        .replace(/multiplica por/g, " * ")
        .replace(/multiplicar/g, " * ")
        .replace(/multiplica/g, " * ")
        .replace(/produto de/g, " * ")
        .replace(/produto/g, " * ")
        .replace(/vezes/g, " * ")
        .replace(/\bx\b/g, " * ")

        // adição
        .replace(/adicionar/g, " + ")
        .replace(/adiciona/g, " + ")
        .replace(/somar/g, " + ")
        .replace(/soma/g, " + ")
        .replace(/mais/g, " + ")

        // subtração
        .replace(/subtrair/g, " - ")
        .replace(/subtrai/g, " - ")
        .replace(/diferenca/g, " - ")
        .replace(/tirar/g, " - ")
        .replace(/menos/g, " - ");

    // separa operadores digitados
    texto = texto
        .replace(/\+/g, " + ")
        .replace(/\*/g, " * ")
        .replace(/\//g, " / ")
        .replace(/\s+/g, " ")
        .trim();

    const partes = separarExpressao(texto);

    if (!partes) {
        return null;
    }

    const numero1 = converterNumero(partes.esquerda);
    const numero2 = converterNumero(partes.direita);

    if (numero1 === null || numero2 === null) {
        return null;
    }

    return {
        numero1,
        operador: partes.operador,
        numero2,
        expressao: `${numero1} ${partes.operador} ${numero2}`
    };
}

function calcular(dados) {
    if (!dados) {
        return "Operação inválida";
    }

    const numero1 = dados.numero1;
    const numero2 = dados.numero2;
    const operador = dados.operador;

    let resultado;

    // calcula sem usar eval
    switch (operador) {
        case "+":
            resultado = numero1 + numero2;
            break;

        case "-":
            resultado = numero1 - numero2;
            break;

        case "*":
            resultado = numero1 * numero2;
            break;

        case "/":
            if (numero2 === 0) {
                return "Infinito";
            }

            resultado = numero1 / numero2;
            break;

        default:
            return "Operação inválida";
    }

    if (Number.isNaN(resultado)) {
        return "Indefinido";
    }

    if (!Number.isFinite(resultado)) {
        return "Infinito";
    }

    // limita casas decimais
    if (!Number.isInteger(resultado)) {
        resultado = parseFloat(resultado.toFixed(2));
    }

    return resultado;
}

function formatarNumeroParaFala(numero) {
    return String(numero).replace(".", ",");
}

function formatarExpressaoParaFala(expressao) {
    return expressao
        .replace(/\+/g, " mais ")
        .replace(/\-/g, " menos ")
        .replace(/\*/g, " vezes ")
        .replace(/\//g, " dividido por ")
        .replace(/\./g, ",")
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

function resetarBotaoMicrofone(micBtn) {
    // volta o botão para o estado normal
    micBtn.disabled = false;
    micBtn.setAttribute("aria-pressed", "false");
    micBtn.setAttribute("aria-label", "Iniciar reconhecimento de voz");
    micBtn.removeAttribute("aria-busy");
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
        display.setAttribute("aria-label", "Reconhecimento de voz não suportado neste navegador");
        falarTexto("Reconhecimento de voz não suportado neste navegador.");
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

    // acessibilidade do botão enquanto ouve
    micBtn.disabled = true;
    micBtn.setAttribute("aria-pressed", "true");
    micBtn.setAttribute("aria-label", "Reconhecimento de voz em andamento");
    micBtn.setAttribute("aria-busy", "true");

    // quando reconhecer algo
    recognition.onresult = (event) => {
        const textoFalado = event.results[0][0].transcript;

        spokenText.textContent = "Você falou: " + textoFalado;

        const expressao = interpretarExpressao(textoFalado);
        const resultado = calcular(expressao);

        if (resultado === "Operação inválida") {
            status.textContent = "Operação inválida";
            display.textContent = "—";
            display.setAttribute("aria-label", "Operação inválida");
            falarTexto("Você precisa falar uma operação válida, por exemplo, dez dividido por dois.");
            return;
        }

        if (resultado === "Indefinido") {
            status.textContent = "Resultado indefinido";
            display.textContent = "Indefinido";
            display.setAttribute("aria-label", "Resultado indefinido");
            falarTexto("Essa operação é indefinida.");
            return;
        }

        if (resultado === "Infinito") {
            status.textContent = "Divisão por zero";
            display.textContent = "Infinito";
            display.setAttribute("aria-label", "Resultado infinito");
            falarTexto("Não é possível dividir por zero.");
            return;
        }

        status.textContent = "Resultado encontrado";
        display.textContent = formatarNumeroParaFala(resultado);
        display.setAttribute("aria-label", `O resultado é ${formatarNumeroParaFala(resultado)}`);

        const textoParaFala = formatarExpressaoParaFala(expressao.expressao);
        falarTexto(`${textoParaFala} é igual a ${formatarNumeroParaFala(resultado)}`);
    };

    // quando a pessoa parar de falar
    recognition.onspeechend = () => {
        recognition.stop();
        container.classList.remove("listening");
        status.textContent = "Reconhecimento concluído";
        resetarBotaoMicrofone(micBtn);
    };

    // se não reconhecer direito
    recognition.onnomatch = () => {
        container.classList.remove("listening");
        status.textContent = "Não entendi";
        spokenText.textContent = "Você falou: —";
        display.textContent = "Erro";
        display.setAttribute("aria-label", "Não entendi a operação");
        falarTexto("Não entendi a operação.");
        resetarBotaoMicrofone(micBtn);
    };

    // erro geral
    recognition.onerror = (event) => {
        container.classList.remove("listening");
        spokenText.textContent = "Você falou: —";
        resetarBotaoMicrofone(micBtn);

        if (event.error === "no-speech") {
            status.textContent = "Não ouvi nada";
            display.textContent = "—";
            display.setAttribute("aria-label", "Nenhuma fala detectada");
            falarTexto("Não ouvi nada. Tente novamente.");
            return;
        }

        if (event.error === "audio-capture") {
            status.textContent = "Microfone não encontrado";
            display.textContent = "Erro";
            display.setAttribute("aria-label", "Microfone não encontrado");
            falarTexto("Microfone não encontrado.");
            return;
        }

        if (event.error === "not-allowed") {
            status.textContent = "Permissão negada";
            display.textContent = "Erro";
            display.setAttribute("aria-label", "Permissão do microfone negada");
            falarTexto("Permissão do microfone negada.");
            return;
        }

        status.textContent = "Reconhecimento interrompido";
        display.textContent = "Erro";
        display.setAttribute("aria-label", "Reconhecimento interrompido");
        falarTexto("O reconhecimento foi interrompido.");
    };

    // quando finalizar totalmente
    recognition.onend = () => {
        container.classList.remove("listening");
        resetarBotaoMicrofone(micBtn);

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

// Quando a página carregar, aplica o tema salvo e liga os botões
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    const micBtn = document.getElementById("mic-btn");
    const contrastBtn = document.querySelector(".contrast-btn");

    // aplica o tema salvo
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }

    // liga o botão do microfone
    if (micBtn) {
        micBtn.addEventListener("click", startListening);
    }

    // liga o botão de contraste
    if (contrastBtn) {
        contrastBtn.addEventListener("click", toggleTheme);
    }
});