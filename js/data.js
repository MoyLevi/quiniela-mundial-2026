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
   GOLEADORES ESPN · Top 10 con fallback seguro
   ---------------------------------------------------------
   Intenta leer el ranking público de ESPN. Si CORS, red o
   estructura HTML fallan, conserva 10 lugares Por Definir.
   ========================================================= */
function crearGoleadoresFallback(){
    return Array.from({length:10}, (_, i) => ({
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
    return (valor || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function abreviarNombreGoleador(nombre){
    const limpio = (nombre || "").toString().trim().replace(/\s+/g, " ");
    if(!limpio || limpio.toLowerCase().includes("por definir")) return "Por Definir";
    const partes = limpio.split(" ").filter(Boolean);
    if(partes.length === 1) return partes[0];
    return `${partes[0].charAt(0).toUpperCase()}.${partes.slice(1).join(" ")}`;
}

function abreviarPaisGoleador(pais){
    const limpio = quitarAcentosTexto(pais || "").trim();
    const key = limpio.toLowerCase();
    const excepciones = {
        "nueva zelanda": "NZL",
        "estados unidos": "USA",
        "republica democratica del congo": "CON",
        "rd congo": "CON",
        "congo": "CON",
        "paises bajos": "NED",
        "holanda": "NED"
    };
    if(excepciones[key]) return excepciones[key];
    return limpio ? limpio.slice(0, 3).toUpperCase() : "";
}

function extraerTextoCeldaGoleador(celda){
    return (celda?.innerText || celda?.textContent || "").replace(/\s+/g, " ").trim();
}

function parsearGoleadoresESPN(html){
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tablas = [...doc.querySelectorAll("table")];
    const filas = tablas.flatMap(tabla => [...tabla.querySelectorAll("tbody tr")]);
    const salida = [];

    filas.forEach(fila => {
        if(salida.length >= 10) return;
        const celdas = [...fila.querySelectorAll("td")];
        if(celdas.length < 3) return;

        const textos = celdas.map(extraerTextoCeldaGoleador).filter(Boolean);
        const pos = Number((textos[0] || "").match(/\d+/)?.[0]);
        if(!Number.isFinite(pos)) return;

        const goles = Number((textos[textos.length - 1] || "").match(/\d+/)?.[0] || 0);
        const candidatoNombre = textos.find((t, idx) => idx > 0 && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(t) && !/^\d+$/.test(t)) || "Por Definir";
        let pais = "";

        for(let i = 2; i < textos.length - 1; i++){
            const t = textos[i];
            if(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(t) && t !== candidatoNombre){
                pais = t;
                break;
            }
        }

        salida.push({
            pos,
            nombre: candidatoNombre,
            nombreCorto: abreviarNombreGoleador(candidatoNombre),
            pais,
            abbr: abreviarPaisGoleador(pais),
            goles,
            fallback: false
        });
    });

    return salida.slice(0, 10);
}

async function cargarGoleadores(){
    try{
        const res = await fetch(urlGoleadoresESPN, { cache: "no-store" });
        if(!res.ok) throw new Error(`ESPN ${res.status}`);
        const html = await res.text();
        const lista = parsearGoleadoresESPN(html);
        goleadores = lista.length ? lista : crearGoleadoresFallback();
    }
    catch(error){
        console.warn("No se pudo cargar ESPN goleadores. Usando fallback.", error);
        goleadores = crearGoleadoresFallback();
    }
}
