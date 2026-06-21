function parseCSV(str){
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for(let i = 0; i < str.length; i++){
        const char = str[i];
        const next = str[i + 1];

        if(char === '"' && inQuotes && next === '"'){
            cell += '"';
            i++;
        } 
        else if(char === '"'){
            inQuotes = !inQuotes;
        } 
        else if(char === "," && !inQuotes){
            row.push(cell.trim());
            cell = "";
        } 
        else if((char === "\n" || char === "\r") && !inQuotes){
            if(cell || row.length){
                row.push(cell.trim());
                rows.push(row);
                row = [];
                cell = "";
            }
        } 
        else {
            cell += char;
        }
    }

    if(cell || row.length){
        row.push(cell.trim());
        rows.push(row);
    }

    return rows;
}

async function cargarPartidos(){

    const res = await fetch(urlPartidos);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    partidos = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["ID"]),
            fecha: obj["Fecha"],
            hora: obj["Hora"],
            lugar: obj["Lugar"],
            loc: obj["Loc"],
            local: obj["Local"],
            vis: obj["Vis"],
            visita: obj["Visita"],
            golesLoc: obj["GolesLoc"],
            golesVis: obj["GolesVis"],
            status: obj["Status"] || "Pendiente"
        };
    });
}

async function cargarUsuarios(){

    const res = await fetch(urlUsuarios);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    usuarios = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["IDUsuario"]),
            nombre: obj["Nombre"],
            paga: (obj["Paga"] || "No").trim().toLowerCase() === "si",
            campeon: obj["Campeon"] || "",
            segundo: obj["Segundo"] || "",
            tercero: obj["Tercero"] || "",
            goleador: obj["Goleador"] || "",
            sorpresa: obj["Sorpresa"] || ""
        };
    });
}

async function cargarPicks(){

    const res = await fetch(urlPicks);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    picks = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idPick: Number(obj["IDPick"]),
            idUser: Number(obj["IDUser"]),
            partidoId: Number(obj["IDPartido"]),
            golLoc: Number(obj["GolLoc"]),
            golVis: Number(obj["GolVis"])
        };
    });
}

async function cargarLugaresPro(){

    const res = await fetch(urlLugaresPro);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    lugaresPro = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idLug: Number(obj["IDLug"]),
            idUsuario: Number(obj["IDUsuario"]),
            lug: obj["Lug"],
            lugares: obj["Lugares"]
        };
    });
}

async function cargarKnockout(){

    const res = await fetch(urlKnockout);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    knockout = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["ID"]),
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            fecha: obj["Fecha"],
            hora: obj["Hora"],
            lugar: obj["Lugar"],
            loc: obj["Loc"],
            vis: obj["Vis"],
            local: obj["Local"],
            visita: obj["Visita"],
            penLoc: obj["PenLoc"],
            golesLoc: obj["GolesLoc"],
            golesVis: obj["GolesVis"],
            penVis: obj["PenVis"],
            status: obj["Status"] || "Pendiente",
            esKO: true
        };
    });
}

async function cargarRankKO(){

    const res = await fetch(urlRankKO);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    rankKO = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            clave: obj["Clave"],
            equipo: obj["Equipo"]
        };
    });
}

async function cargarPicksKO(){

    const res = await fetch(urlPicksKO);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    picksKO = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idPick: Number(obj["IDPick"]),
            idUser: Number(obj["IDUsuario"] || obj["IDUser"]),
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            partidoId: Number(obj["IDPartido"]),
            loc: obj["Loc"],
            vis: obj["Vis"],
            penLoc: obj["PenLoc"],
            golLoc: Number(obj["GolLoc"]),
            golVis: Number(obj["GolVis"]),
            penVis: obj["PenVis"],
            esKO: true
        };
    });
}

/* =========================================================
   GOLEADORES TRANSFERMARKT · Top 25 con fallback seguro
   ---------------------------------------------------------
   Intenta leer el ranking público de Transfermarkt. Si CORS,
   red o estructura HTML fallan, conserva 25 lugares Por Definir.
   ========================================================= */
function crearGoleadoresFallback(){
    return Array.from({length:25}, (_, i) => ({
        pos: i + 1,
        nombre: "Por Definir",
        nombreCorto: "Por Definir",
        pais: "",
        abbr: "",
        goles: 0,
        fallback: true
    }));
}

function quitarAcentosTexto(valor){
    return (valor || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function limpiarTextoGoleador(valor){
    return (valor || "").toString().replace(/\s+/g, " ").trim();
}

function abreviarNombreGoleador(nombre){
    const limpio = limpiarTextoGoleador(nombre);
    if(!limpio || limpio.toLowerCase().includes("por definir")) return "Por Definir";
    const partes = limpio.split(" ").filter(Boolean);
    if(partes.length === 1) return partes[0];
    return `${partes[0].charAt(0).toUpperCase()}.${partes.slice(1).join(" ")}`;
}

function normalizarPaisGoleador(pais){
    const limpio = limpiarTextoGoleador(pais);
    const key = quitarAcentosTexto(limpio).toLowerCase();
    const mapa = {
        "algeria":"Argelia", "argentina":"Argentina", "australia":"Australia", "austria":"Austria",
        "belgium":"Belgica", "bosnia-herzegovina":"Bosnia Herzegovina", "bosnia herzegovina":"Bosnia Herzegovina",
        "brazil":"Brasil", "canada":"Canada", "cape verde":"Cabo Verde", "colombia":"Colombia",
        "congo dr":"Congo", "democratic republic of the congo":"Congo", "curacao":"Curazao",
        "denmark":"Dinamarca", "ecuador":"Ecuador", "egypt":"Egipto", "england":"Inglaterra",
        "france":"Francia", "germany":"Alemania", "ghana":"Ghana", "haiti":"Haiti",
        "iran":"Iran", "iraq":"Iraq", "ivory coast":"Costa de Marfil", "japan":"Japon",
        "jordan":"Jordania", "mexico":"Mexico", "morocco":"Marruecos", "netherlands":"Holanda",
        "new zealand":"Nueva Zelanda", "norway":"Noruega", "panama":"Panama", "paraguay":"Paraguay",
        "portugal":"Portugal", "qatar":"Qatar", "saudi arabia":"Arabia Saudita", "scotland":"Escocia",
        "senegal":"Senegal", "serbia":"Serbia", "south africa":"Sudafrica", "south korea":"Corea del Sur",
        "spain":"Espana", "sweden":"Suecia", "switzerland":"Suiza", "tunisia":"Tunez",
        "turkey":"Turquia", "ukraine":"Ucrania", "united states":"Estados Unidos",
        "united states of america":"Estados Unidos", "uruguay":"Uruguay", "uzbekistan":"Uzbekistan"
    };
    return mapa[key] || limpio;
}

function abreviarPaisGoleador(pais){
    const normalizado = normalizarPaisGoleador(pais);
    const key = quitarAcentosTexto(normalizado).toLowerCase();
    const excepciones = {
        "alemania":"GER", "arabia saudita":"KSA", "argelia":"ALG", "argentina":"ARG", "australia":"AUS",
        "austria":"AUT", "belgica":"BEL", "bosnia herzegovina":"BIH", "brasil":"BRA", "cabo verde":"CPV",
        "canada":"CAN", "colombia":"COL", "congo":"COD", "corea del sur":"KOR", "costa de marfil":"CIV",
        "curazao":"CUW", "dinamarca":"DEN", "ecuador":"ECU", "egipto":"EGY", "escocia":"SCO",
        "espana":"ESP", "españa":"ESP", "estados unidos":"USA", "francia":"FRA", "ghana":"GHA",
        "haiti":"HAI", "holanda":"NED", "inglaterra":"ENG", "iran":"IRN", "iraq":"IRQ", "japon":"JPN",
        "jordania":"JOR", "marruecos":"MAR", "mexico":"MEX", "nueva zelanda":"NZL", "noruega":"NOR",
        "panama":"PAN", "paraguay":"PAR", "portugal":"POR", "qatar":"QAT", "senegal":"SEN", "serbia":"SRB",
        "sudafrica":"RSA", "suecia":"SWE", "suiza":"SUI", "tunez":"TUN", "turquia":"TUR", "ucrania":"UKR",
        "uruguay":"URU", "uzbekistan":"UZB"
    };
    return excepciones[key] || (normalizado ? quitarAcentosTexto(normalizado).slice(0, 3).toUpperCase() : "");
}

function extraerTextoCeldaGoleador(celda){
    return limpiarTextoGoleador(celda?.innerText || celda?.textContent || "");
}

function obtenerPaisFilaTransfermarkt(fila){
    const imgs = [...fila.querySelectorAll("img")];
    const imgPais = imgs.find(img => {
        const src = (img.getAttribute("src") || "").toLowerCase();
        const clase = (img.getAttribute("class") || "").toLowerCase();
        return src.includes("flaggen") || clase.includes("flaggen") || clase.includes("flag");
    });
    return limpiarTextoGoleador(imgPais?.getAttribute("title") || imgPais?.getAttribute("alt") || "");
}

function obtenerNombreFilaTransfermarkt(fila, textos){
    const linkJugador = fila.querySelector("td.hauptlink a[href*='/profil/spieler/'], a[href*='/profil/spieler/']");
    const nombreLink = limpiarTextoGoleador(linkJugador?.textContent || "");
    if(nombreLink) return nombreLink;
    return textos.find(t => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(t) && !/^\d+$/.test(t) && !/^(centre|right|left|attacking|central|defensive|goalkeeper|forward|winger|midfield|back|striker)/i.test(t)) || "Por Definir";
}

function parsearGoleadoresTransfermarktHTML(html){
    const doc = new DOMParser().parseFromString(html, "text/html");
    const filas = [...doc.querySelectorAll("table.items tbody tr, table tbody tr")];
    const salida = [];
    filas.forEach(fila => {
        if(salida.length >= 25) return;
        const celdas = [...fila.querySelectorAll("td")];
        if(celdas.length < 3) return;
        const textos = celdas.map(extraerTextoCeldaGoleador).filter(Boolean);
        const pos = Number((textos[0] || "").match(/^\d+/)?.[0]);
        if(!Number.isFinite(pos)) return;
        const nombre = obtenerNombreFilaTransfermarkt(fila, textos);
        const pais = normalizarPaisGoleador(obtenerPaisFilaTransfermarkt(fila));
        const numeros = textos.flatMap(t => (t.match(/\d+/g) || []).map(Number)).filter(Number.isFinite);
        const goles = numeros.length ? numeros[numeros.length - 1] : 0;
        salida.push({ pos, nombre, nombreCorto: abreviarNombreGoleador(nombre), pais, abbr: abreviarPaisGoleador(pais), goles, fallback: false });
    });
    return salida.slice(0, 25);
}

function parsearGoleadoresTransfermarktTexto(texto){
    const lineas = (texto || "").split(/\n+/).map(limpiarTextoGoleador).filter(Boolean);
    const salida = [];
    const paises = ["Germany","Argentina","Canada","Brazil","United States","Netherlands","Norway","England","Morocco","Sweden","France","New Zealand","Switzerland","Colombia","South Korea","Mexico","Portugal","Spain","Uruguay","Japan","Belgium","Ghana","Saudi Arabia","Austria"];
    for(let i = 0; i < lineas.length && salida.length < 25; i++){
        const match = lineas[i].match(/^(\d{1,2})\s+(.+)$/);
        if(!match) continue;
        const pos = Number(match[1]);
        let nombre = limpiarTextoGoleador(match[2].replace(/Image:\s*/i, ""));
        if(!nombre || /world cup|latest|player|club/i.test(nombre)) continue;
        const ventana = lineas.slice(i, i + 6).join(" ");
        const paisOriginal = paises.find(p => new RegExp(`\\b${p}\\b`, "i").test(ventana)) || "";
        const pais = normalizarPaisGoleador(paisOriginal);
        const nums = (ventana.match(/\b\d+\b/g) || []).map(Number);
        const goles = nums.length ? nums[nums.length - 1] : 0;
        salida.push({ pos, nombre, nombreCorto: abreviarNombreGoleador(nombre), pais, abbr: abreviarPaisGoleador(pais), goles, fallback: false });
    }
    return salida.slice(0, 25);
}

function parsearGoleadoresTransfermarkt(contenido){
    const listaHTML = parsearGoleadoresTransfermarktHTML(contenido || "");
    return listaHTML.length ? listaHTML : parsearGoleadoresTransfermarktTexto(contenido || "");
}

async function fetchTextoGoleadores(url){
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error(`Goleadores ${res.status}`);
    return await res.text();
}

async function cargarGoleadores(){
    const urls = [urlGoleadoresTransfermarkt, urlGoleadoresTransfermarktProxy].filter(Boolean);
    for(const url of urls){
        try{
            const contenido = await fetchTextoGoleadores(url);
            const lista = parsearGoleadoresTransfermarkt(contenido);
            if(lista.length){
                goleadores = lista;
                return;
            }
        }catch(error){
            console.warn("No se pudo cargar Transfermarkt goleadores desde:", url, error);
        }
    }
    goleadores = crearGoleadoresFallback();
}
