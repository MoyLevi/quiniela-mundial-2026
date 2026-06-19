const categoriasEspeciales = {
    campeon: {
        titulo: "Primero",
        icono: "🥇",
        campo: "campeon"
    },
    segundo: {
        titulo: "Segundo",
        icono: "🥈",
        campo: "segundo"
    },
    tercero: {
        titulo: "Tercero",
        icono: "🥉",
        campo: "tercero"
    },
    goleador: {
        titulo: "Goleador",
        icono: '<img class="icono-trionda-mini" src="img/trionda.png" alt="Balón">',
        campo: "goleador"
    },
    sorpresa: {
        titulo: "Sorpresa",
        icono: "🌟",
        campo: "sorpresa"
    },
    podio: {
        titulo: "Podio",
        icono: "🏆",
        campo: null
    },
    clasificados: {
        titulo: "Clasificados",
        icono: "🏆",
        campo: null
    },
    records: {
        titulo: "Récords",
        icono: "🏆",
        campo: null
    },
    bracket: {
        titulo: "Bracket",
        icono: "🏟️",
        campo: null
    }
};

const categoriasStatsPrincipales = ["bracket", "clasificados", "records", "sorpresa", "podio"];
const categoriasPodio = ["campeon", "segundo", "tercero", "goleador"];

let categoriaEspecialActual = "bracket";
let categoriaPodioActual = "campeon";
let vistaEspecialActual = "conteo";
let grupoClasificadosActual = "A";

function normalizarPickEspecial(valor){
    return valor && valor.trim() !== "" ? valor.trim() : "Sin pick";
}

function crearHTMLPaisConBandera(nombre){

    const pais = (nombre || "").trim();

    if(!pais || pais === "-"){
        return `<span>-</span>`;
    }

    return `
        <span class="pais-con-bandera">
            <img src="${getFlag(pais)}" alt="${pais}" class="flag-mini">
            <span>${pais}</span>
        </span>
    `;
}

function esCategoriaPaisEspecial(categoria){
    return ["campeon", "segundo", "tercero", "sorpresa"].includes(categoria);
}

function crearHTMLPickEspecialConBandera(categoria, valor){
    const pick = normalizarPickEspecial(valor);

    if(!esCategoriaPaisEspecial(categoria) || pick === "Sin pick"){
        return pick;
    }

    return crearHTMLPaisConBandera(pick);
}

function getResumenEspecial(categoria){
    const config = categoriasEspeciales[categoria];
    const conteo = {};

    usuarios.forEach(u => {
        const pick = normalizarPickEspecial(u[config.campo]);
        conteo[pick] = (conteo[pick] || 0) + 1;
    });

    const ordenados = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));

    const total = usuarios.length;
    const favorito = ordenados[0] || ["Sin pick", 0];

    return {
        config,
        total,
        favorito: favorito[0],
        favoritoCantidad: favorito[1],
        opcionesDistintas: ordenados.length,
        ordenados
    };
}

function crearHTMLBotonesEspeciales(categoriaActiva){
    return `
        <div class="tabs-especiales tabs-stats-principales">
            ${categoriasStatsPrincipales.map(key => {
                const cat = categoriasEspeciales[key];
                return `
                    <button 
                        class="${categoriaActiva === key ? "tab-activa" : ""}"
                        onclick="mostrarEstadisticas('${key}', 'conteo', grupoClasificadosActual, true)"
                    >
                        ${cat.icono} ${cat.titulo}
                    </button>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLBotonesPodio(categoriaActiva){
    return `
        <div class="tabs-mini-estadisticas tabs-podio">
            ${categoriasPodio.map(key => {
                const cat = categoriasEspeciales[key];
                return `
                    <button
                        class="${categoriaActiva === key ? "tab-activa" : ""}"
                        onclick="mostrarEstadisticas('podio', vistaEspecialActual, grupoClasificadosActual, true, '${key}')"
                    >
                        ${cat.icono} ${cat.titulo}
                    </button>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLBotonesVistaEspecial(categoria, vistaActiva){
    const destino = categoriasPodio.includes(categoria) ? "podio" : categoria;
    return `
        <div class="tabs-mini-estadisticas">
            <button
                class="${vistaActiva === "conteo" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${destino}', 'conteo', grupoClasificadosActual, true, '${categoria}')"
            >
                📊 Conteo General
            </button>

            <button
                class="${vistaActiva === "usuarios" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${destino}', 'usuarios', grupoClasificadosActual, true, '${categoria}')"
            >
                👥 Picks por Usuario
            </button>

            ${categoria === "goleador" ? `
                <button
                    class="${vistaActiva === "standing" ? "tab-activa" : ""}"
                    onclick="mostrarEstadisticas('${destino}', 'standing', grupoClasificadosActual, true, '${categoria}')"
                >
                    🏅 Standing
                </button>
            ` : ""}
        </div>
    `;
}

function crearHTMLStandingGoleador(){
    return `
        <div class="especial-panel">
            <h3>Standing Goleador</h3>
            ${Array.from({length:10}, (_, i) => `
                <div class="especial-row especial-row-conteo">
                    <span>${i + 1}. (Por Definir)</span>
                    <strong>0 goles</strong>
                </div>
            `).join("")}
        </div>
    `;
}


function getLugaresProGrupos(){
    return getLugaresProComparables();
}

function contarValores(lista, selector){
    const conteo = {};

    lista.forEach(item => {
        const valor = normalizarPickEspecial(selector(item));
        conteo[valor] = (conteo[valor] || 0) + 1;
    });

    return Object.entries(conteo)
        .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

function crearHTMLTopConteo(ordenados, total, limite = 5){
    if(ordenados.length === 0){
        return `<p class="subtexto">Sin picks capturados.</p>`;
    }

    return ordenados.slice(0, limite).map(([equipo, cantidad]) => {
        const porcentaje = total > 0
            ? Math.round((cantidad / total) * 100)
            : 0;

        return `
            <div class="clasificado-comunidad-row">
                <span>${crearHTMLPaisConBandera(equipo)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");
}

function crearHTMLBotonesGruposClasificados(grupoActivo){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="grupos-clasificados-stats">
            ${grupos.map(g => `
                <button
                    class="${grupoActivo === g ? "filtro-activo" : ""}"
                    onclick="mostrarEstadisticas('clasificados', 'conteo', '${g}', true)"
                >
                    ${g}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLClasificadosRealesGrupo(grupo){
    const reales = getClasificadosReales().filter(x => x.grupo === grupo);

    return `
        <div class="clasificado-comunidad-card clasificados-reales-card">
            <h3 class="stats-clasificados-titulo-blanco">Clasificados</h3>
            <p class="subtexto">Equipos Clasificados Reales</p>
            ${reales.map(r => `
                <div class="clasificado-comunidad-row">
                    <span><strong class="clave-clasificado-real">${r.clave}</strong> ${crearHTMLPaisConBandera(r.equipo)}</span>
                    <strong>${r.lugar}°</strong>
                </div>
            `).join("")}
        </div>
    `;
}

function getResumenComparacionClasificados(){
    const picksComparables = getLugaresProComparables();
    const porUsuario = {};

    picksComparables.forEach(pick => {
        const real = getClasificadoRealPorClave(pick.claveNormal);
        const acierto = real && normalizarNombreEquipo(real.equipo) === normalizarNombreEquipo(pick.lugares);

        if(!porUsuario[pick.idUsuario]){
            porUsuario[pick.idUsuario] = {
                id: pick.idUsuario,
                total: 0,
                aciertos: 0
            };
        }

        porUsuario[pick.idUsuario].total += 1;
        porUsuario[pick.idUsuario].aciertos += acierto ? 1 : 0;
    });

    return Object.values(porUsuario).sort((a,b) =>
        b.aciertos - a.aciertos ||
        a.id - b.id
    );
}

function crearHTMLResumenComparacionClasificados(){
    const resumen = getResumenComparacionClasificados();

    if(resumen.length === 0){
        return `<p class="subtexto">Todavía no hay LugaresPro comparables.</p>`;
    }

    return `
        <div class="clasificado-comunidad-card clasificados-reales-card">
            <h3>Comparación vs LugaresPro</h3>
            <p class="subtexto">Solo posiciones 1 y 2 de cada grupo. Terceros fuera por ahora.</p>
            ${resumen.map(r => {
                const usuario = usuarios.find(u => Number(u.id) === Number(r.id));
                return `
                    <div class="clasificado-comunidad-row">
                        <span>${usuario?.nombre || "Usuario " + r.id}</span>
                        <strong>${r.aciertos}/${r.total}</strong>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLClasificadosComunidad(grupoActivo = grupoClasificadosActual){
    const lugaresGrupo = getLugaresProGrupos();
    const totalUsuarios = new Set(lugaresGrupo.map(x => x.idUsuario)).size;
    const conteoGeneral = contarValores(lugaresGrupo, x => x.lugares);
    const favorito = conteoGeneral[0] || ["Sin pick", 0];

    const grupoSeguro = /^[A-L]$/.test(grupoActivo) ? grupoActivo : "A";
    grupoClasificadosActual = grupoSeguro;

    const picksPrimero = lugaresGrupo.filter(x => x.claveNormal === `1${grupoSeguro}`);
    const picksSegundo = lugaresGrupo.filter(x => x.claveNormal === `2${grupoSeguro}`);
    const topPrimero = contarValores(picksPrimero, x => x.lugares);
    const topSegundo = contarValores(picksSegundo, x => x.lugares);

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales("clasificados")}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>🏆</h2>
                <p>Clasificados</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPaisConBandera(favorito[0])}</h2>
                <p>Equipo más elegido · ${favorito[1]} picks</p>
            </div>

            <div class="stat-card">
                <h2>${totalUsuarios}</h2>
                <p>Usuarios con picks de clasificados</p>
            </div>
        </div>

        ${crearHTMLBotonesGruposClasificados(grupoSeguro)}

        <div class="clasificados-comunidad-grid clasificados-comunidad-grid-unico">
            ${crearHTMLClasificadosRealesGrupo(grupoSeguro)}

            <div class="clasificado-comunidad-card">
                <h3>Grupo ${grupoSeguro}</h3>

                <div class="clasificado-comunidad-bloque">
                    <h4>1° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topPrimero, picksPrimero.length)}
                </div>

                <div class="clasificado-comunidad-bloque">
                    <h4>2° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topSegundo, picksSegundo.length)}
                </div>
            </div>
        </div>
    `;
}


function crearHTMLRecordCardStats(icono, titulo, valor, detalle = "", tipoDetalle = ""){
    const accion = tipoDetalle ? ` onclick="mostrarDetalleRecordStats('${tipoDetalle}')"` : "";
    const claseExtra = tipoDetalle ? " record-card-clickable" : "";

    return `
        <div class="record-card${claseExtra}"${accion}>
            <div class="record-icono">${icono}</div>

            <div class="record-info">
                <span>${titulo}</span>
                <strong>${valor}</strong>
                ${detalle ? `<small>${detalle}</small>` : ""}
            </div>
        </div>
    `;
}

function crearHTMLRecordsStats(){

    const ranking = getRanking();

    const liderGeneral = [...ranking].sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorExactos = [...ranking].sort((a,b) => b.exactos - a.exactos || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorGanadores = [...ranking].sort((a,b) => b.ganadores - a.ganadores || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorDiferencias = [...ranking].sort((a,b) => b.diferencias - a.diferencias || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const partidoMayorEfectividad = getPartidoMayorEfectividad();

    return `
        <h1>RÉCORDS <span class="titulo-acento">ACTUALES</span></h1>
        <p class="subtexto">Datos destacados y marcas vivas de la quiniela.</p>

        ${crearHTMLBotonesEspeciales("records")}

        ${crearHTMLDatosDestacados()}

        <h2 id="marcasDestacadasStats">MARCAS <span class="titulo-acento">DESTACADAS</span></h2>
        <p class="subtexto">Toca una tarjeta para ver el detalle completo.</p>

        <div class="records-grid">
            ${crearHTMLRecordCardStats(
                "👑",
                "Líder general",
                liderGeneral ? `${liderGeneral.nombre} · ${liderGeneral.puntos} pts` : "-",
                "Mayor puntaje acumulado"
            )}

            ${crearHTMLRecordCardStats(
                "🎯",
                "Más marcadores exactos",
                mejorExactos ? `${mejorExactos.nombre} · ${mejorExactos.exactos}` : "-",
                "Toca para ver la tabla completa",
                "exactos"
            )}

            ${crearHTMLRecordCardStats(
                "✅",
                "Más ganadores",
                mejorGanadores ? `${mejorGanadores.nombre} · ${mejorGanadores.ganadores}` : "-",
                "Toca para ver la tabla completa",
                "ganadores"
            )}

            ${crearHTMLRecordCardStats(
                "📐",
                "Más diferencia + ganador",
                mejorDiferencias ? `${mejorDiferencias.nombre} · ${mejorDiferencias.diferencias}` : "-",
                "Toca para ver la tabla completa",
                "diferencias"
            )}

            ${crearHTMLRecordCardStats(
                "🔥",
                "Partido con mayor efectividad",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.partido.local} vs ${partidoMayorEfectividad.partido.visita} · ${partidoMayorEfectividad.porcentaje}%`
                    : "-",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.puntosGanados}/${partidoMayorEfectividad.puntosDisponibles} pts posibles · toca para detalle`
                    : "Solo partidos finalizados",
                "efectividad"
            )}
        </div>
    `;
}

function volverARecordsStats(){
    mostrarEstadisticas("records", "conteo", grupoClasificadosActual, false);

    setTimeout(() => {
        const titulo = document.getElementById("marcasDestacadasStats");

        if(titulo){
            const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
            window.scrollTo({
                top: Math.max(0, y),
                behavior: "smooth"
            });
        }
    }, 60);
}

function crearHTMLDetalleRecordUsuariosStats(tipo){
    const config = {
        exactos: { titulo: "Más marcadores exactos", campo: "exactos", icono: "🎯", ayuda: "Marcadores que valen 3 puntos." },
        ganadores: { titulo: "Más ganadores", campo: "ganadores", icono: "✅", ayuda: "Aciertos de ganador." },
        diferencias: { titulo: "Más diferencia + ganador", campo: "diferencias", icono: "📐", ayuda: "Aciertos que valen 2 puntos." }
    }[tipo];

    const lista = getRankingRecord(tipo);

    return `
        <button onclick="volverARecordsStats()" class="btnVolver">⬅ Volver</button>
        <h1>${config.icono} ${config.titulo}</h1>
        <p class="subtexto">${config.ayuda}</p>

        <div class="tabla-ranking">
            ${lista.map((u, index) => `
                <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
                    <div class="ranking-pos">${index + 1}</div>
                    <div class="ranking-user">
                        ${u.nombre}
                        <span>${u.puntos} pts totales · ${u.jugados} partidos</span>
                    </div>
                    <div class="ranking-puntos">${u[config.campo]}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function crearHTMLPaginacionRecordEfectividadStats(paginaSegura, totalPaginas){
    return `
        <div class="paginacion paginacion-detalle">
            <button 
                onclick="mostrarDetalleRecordStats('efectividad', ${paginaSegura - 1}, true)" 
                ${paginaSegura <= 1 ? "disabled" : ""}
            >
                ⬅ Anterior
            </button>

            <span>Página ${paginaSegura} de ${totalPaginas}</span>

            <button 
                onclick="mostrarDetalleRecordStats('efectividad', ${paginaSegura + 1}, true)" 
                ${paginaSegura >= totalPaginas ? "disabled" : ""}
            >
                Siguiente ➡
            </button>
        </div>
    `;
}

function crearHTMLDetalleRecordEfectividadStats(pagina = 1){
    const lista = getEfectividadPartidosOrdenada();
    const itemsPorPagina = 10;
    const totalPaginas = Math.max(1, Math.ceil(lista.length / itemsPorPagina));
    const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * itemsPorPagina;
    const fin = Math.min(inicio + itemsPorPagina, lista.length);
    const listaPagina = lista.slice(inicio, fin);
    const paginacionHTML = lista.length > 0
        ? crearHTMLPaginacionRecordEfectividadStats(paginaSegura, totalPaginas)
        : "";

    return `
        <button onclick="volverARecordsStats()" class="btnVolver">⬅ Volver</button>
        <h1 id="tituloRecordEfectividadStats">🔥 MAYOR <span class="titulo-acento">EFECTIVIDAD</span></h1>
        <p class="subtexto">Partidos ordenados por puntos ganados / puntos disponibles.</p>

        ${paginacionHTML}

        <div class="tabla-ranking">
            ${lista.length === 0 ? `<p class="subtexto">Aún no hay partidos finalizados con picks.</p>` : listaPagina.map((item, index) => `
                <div class="ranking-card ranking-card-detallado" onclick="verPartido(${item.partido.id})">
                    <div class="ranking-pos">${inicio + index + 1}</div>
                    <div class="ranking-user">
                        ${item.partido.local} vs ${item.partido.visita}
                        <span>${item.puntosGanados}/${item.puntosDisponibles} pts posibles</span>
                    </div>
                    <div class="ranking-puntos">${item.porcentaje}%</div>
                </div>
            `).join("")}
        </div>

        ${paginacionHTML}
    `;
}

function mostrarDetalleRecordStats(tipo, pagina = 1, scrollTitulo = false){
    if(!scrollTitulo){
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if(tipo === "efectividad"){
        contenido.innerHTML = `
            ${crearHTMLDetalleRecordEfectividadStats(pagina)}
            ${getFooterCopyright()}
        `;

        if(scrollTitulo){
            setTimeout(() => {
                const titulo = document.getElementById("tituloRecordEfectividadStats");

                if(titulo){
                    const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
                    window.scrollTo({
                        top: Math.max(0, y),
                        behavior: "smooth"
                    });
                }
            }, 50);
        }

        return;
    }

    if(["exactos", "ganadores", "diferencias"].includes(tipo)){
        contenido.innerHTML = `
            ${crearHTMLDetalleRecordUsuariosStats(tipo)}
            ${getFooterCopyright()}
        `;
        return;
    }

    mostrarEstadisticas("records");
}


/* =========================================================
   BRACKET VISUAL DINÁMICO · v3.0.2
   Usa Knockout + RankKO y se actualiza con los resultados.
   ========================================================= */

const bracketVisualConfig = [
    {
        lado:"izq",
        grupos:[
            { ronda32:[73,75], octavos:90, cuartos:97, semi:101 },
            { ronda32:[74,77], octavos:89, cuartos:97, semi:101 },
            { ronda32:[83,84], octavos:93, cuartos:98, semi:101 },
            { ronda32:[81,82], octavos:94, cuartos:98, semi:101 }
        ]
    },
    {
        lado:"der",
        grupos:[
            { ronda32:[76,78], octavos:91, cuartos:99, semi:102 },
            { ronda32:[79,80], octavos:92, cuartos:99, semi:102 },
            { ronda32:[86,88], octavos:95, cuartos:100, semi:102 },
            { ronda32:[85,87], octavos:96, cuartos:100, semi:102 }
        ]
    }
];

function getNombreEquipoBracket(nombre){
    const texto = (nombre || "").toString().trim();
    if(!texto || esPorDefinir(texto)) return "Por definir";
    return texto;
}

function getClaseEquipoBracket(partido, equipo){
    if(!partido || !equipo || esPorDefinir(equipo)) return "";
    const pasa = getNombreEquipoBracket(partido.pasa);
    return normalizarNombreEquipo(pasa) === normalizarNombreEquipo(equipo)
        ? " bracket-team-winner"
        : "";
}

function crearEquipoBracketHTML(partido, equipo, lado){
    const nombre = getNombreEquipoBracket(equipo);
    const sinDefinir = nombre === "Por definir";
    const claseWinner = getClaseEquipoBracket(partido, nombre);
    const inicial = sinDefinir ? "PD" : nombre.slice(0, 3).toUpperCase();

    return `
        <div class="bracket-team${claseWinner}${sinDefinir ? " bracket-team-pd" : ""}">
            ${sinDefinir ? `
                <div class="bracket-flag-placeholder">${inicial}</div>
            ` : `
                <img src="${getFlag(nombre)}" alt="${nombre}" loading="lazy">
            `}
            <span>${nombre}</span>
        </div>
    `;
}

function crearScoreBracketHTML(partido){
    if(!partido || partido.golesLoc === "" || partido.golesVis === ""){
        return `<div class="bracket-score">VS</div>`;
    }

    return `
        <div class="bracket-score">
            ${formatearMarcadorConPenales(partido.golesLoc, partido.golesVis, partido.penLoc, partido.penVis)}
        </div>
    `;
}

function crearPartidoBracketHTML(id, extraClass = ""){
    const partido = getPartidoGlobalKO(Number(id));

    if(!partido){
        return `<div class="bracket-match bracket-empty ${extraClass}">Partido ${id}</div>`;
    }

    const gana = getNombreEquipoBracket(partido.pasa);
    const finalizado = partidoFinalizado(partido);

    return `
        <div class="bracket-match ${finalizado ? "bracket-finalizado" : ""} ${extraClass}" title="${partido.stage} · ${partido.lugar}">
            <div class="bracket-meta">
                <span>${partido.id}</span>
                <strong>${partido.fecha || ""}</strong>
                <em>${partido.lugar || ""}</em>
            </div>
            <div class="bracket-teams">
                ${crearEquipoBracketHTML(partido, partido.local, "loc")}
                ${crearScoreBracketHTML(partido)}
                ${crearEquipoBracketHTML(partido, partido.visita, "vis")}
            </div>
            <div class="bracket-winner">${finalizado && gana !== "Por definir" ? `Gana: ${gana}` : "Pendiente"}</div>
        </div>
    `;
}

function crearColumnaBracketHTML(ladoConfig){
    const ladoClase = ladoConfig.lado === "izq" ? "bracket-left" : "bracket-right";

    return `
        <div class="bracket-side ${ladoClase}">
            ${ladoConfig.grupos.map((grupo, index) => `
                <div class="bracket-cluster">
                    <div class="bracket-round bracket-r32">
                        ${grupo.ronda32.map(id => crearPartidoBracketHTML(id, "bracket-r32-match")).join("")}
                    </div>

                    <div class="bracket-connector bracket-connector-a"></div>

                    <div class="bracket-round bracket-r16">
                        ${crearPartidoBracketHTML(grupo.octavos, "bracket-r16-match")}
                    </div>

                    ${index % 2 === 0 ? `<div class="bracket-connector bracket-connector-b"></div>` : ""}

                    <div class="bracket-round bracket-qf">
                        ${index % 2 === 0 ? crearPartidoBracketHTML(grupo.cuartos, "bracket-qf-match") : ""}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function crearCentroBracketHTML(){
    const semi1 = getPartidoGlobalKO(101);
    const semi2 = getPartidoGlobalKO(102);
    const tercero = getPartidoGlobalKO(103);
    const final = getPartidoGlobalKO(104);
    const campeon = getNombreEquipoBracket(final?.pasa);

    return `
        <div class="bracket-center">
            <div class="bracket-title-card">
                <h1>BRACKET <span class="titulo-acento">AL MOMENTO</span></h1>
                <p>Se actualiza automáticamente con Knockout y Rank.</p>
            </div>

            <div class="bracket-trophy">🏆</div>

            <div class="bracket-semis">
                ${crearPartidoBracketHTML(101, "bracket-semi-match")}
                ${crearPartidoBracketHTML(102, "bracket-semi-match")}
            </div>

            <div class="bracket-final-card">
                <div class="bracket-final-label">FINAL · 19/JUL · NY</div>
                ${crearPartidoBracketHTML(104, "bracket-final-match")}
                <div class="bracket-champion">
                    <span>Campeón</span>
                    <strong>${campeon === "Por definir" ? "Por definir" : crearHTMLPaisConBandera(campeon)}</strong>
                </div>
            </div>

            <div class="bracket-third-card">
                <span>3er Lugar</span>
                ${crearPartidoBracketHTML(103, "bracket-third-match")}
            </div>
        </div>
    `;
}



function equipoSigueVivoBracket(nombre, grupo = ""){
    const equipo = (nombre || "").toString().trim();
    if(!equipo || esPorDefinir(equipo)) return false;
    const normal = normalizarNombreEquipo(equipo);

    if(!faseGruposCerradaPorJuego70()){
        return equipoClasificadoReal(equipo, grupo);
    }

    const partidosKO = getKnockoutResueltoGlobal();
    const participantes = new Set();
    const eliminados = new Set();

    partidosKO.forEach(p => {
        const loc = normalizarNombreEquipo(p.local);
        const vis = normalizarNombreEquipo(p.visita);
        if(loc && !esPorDefinir(p.local)) participantes.add(loc);
        if(vis && !esPorDefinir(p.visita)) participantes.add(vis);

        if(partidoFinalizado(p)){
            const pasa = normalizarNombreEquipo(p.pasa);
            if(loc && loc !== pasa) eliminados.add(loc);
            if(vis && vis !== pasa) eliminados.add(vis);
        }
    });

    return participantes.has(normal) && !eliminados.has(normal);
}

function crearEstadoVidaBracketHTML(equipo, grupo){
    const inTorneo = equipoSigueVivoBracket(equipo, grupo);
    return `<span class="bracket-life ${inTorneo ? "bracket-life-in" : "bracket-life-out"}">${inTorneo ? "IN" : "OUT"}</span>`;
}

function crearHTMLGruposBracket(){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="bracket-groups-strip">
            <h2>Grupos</h2>
            <div class="bracket-groups-grid">
                ${grupos.map(grupo => {
                    const equipos = getEquiposPorGrupo(grupo);
                    return `
                        <div class="bracket-group-col">
                            <strong>${grupo}</strong>
                            ${equipos.map(equipo => `
                                <div class="bracket-group-team" title="${equipo}">
                                    <img src="${getFlag(equipo)}" alt="${equipo}" loading="lazy">
                                    ${crearEstadoVidaBracketHTML(equipo, grupo)}
                                </div>
                            `).join("")}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function crearHTMLBracketVisual(){
    return `
        <h1>BRACKET <span class="titulo-acento">MUNDIAL</span></h1>
        ${crearHTMLBotonesEspeciales("bracket")}
        <p class="subtexto">Bracket dinámico de Knockout. Los equipos avanzan automáticamente conforme se capturan resultados.</p>

        <div class="bracket-scroll-hint">Desliza horizontalmente para ver todo el bracket ↔</div>

        <div class="bracket-scroll">
            <div class="bracket-board">
                ${crearColumnaBracketHTML(bracketVisualConfig[0])}
                ${crearCentroBracketHTML()}
                ${crearColumnaBracketHTML(bracketVisualConfig[1])}
                ${crearHTMLGruposBracket()}
            </div>
        </div>
    `;
}



function crearHTMLPodioEspecial(){
    const categoria = categoriasPodio.includes(categoriaPodioActual) ? categoriaPodioActual : "campeon";
    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuarios = [...usuarios]
        .sort((a,b) => a.nombre.localeCompare(b.nombre, "es"))
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${crearHTMLPickEspecialConBandera(categoria, u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${crearHTMLPickEspecialConBandera(categoria, pick)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    const panelActual = categoria === "goleador" && vistaEspecialActual === "standing"
        ? "standing"
        : (vistaEspecialActual === "usuarios" ? "usuarios" : "conteo");

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales("podio")}

        <div class="podio-wrapper">
            <h2>🏆 Podio</h2>
            <p class="subtexto">Filtro por Categorías</p>
            ${crearHTMLBotonesPodio(categoria)}
        </div>

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPickEspecialConBandera(categoria, resumen.favorito)}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        ${crearHTMLBotonesVistaEspecial(categoria, panelActual)}

        <div class="especiales-layout especiales-layout-unico">
            ${panelActual === "standing" ? crearHTMLStandingGoleador() : (panelActual === "conteo" ? `
                <div class="especial-panel">
                    <h3>Conteo general</h3>
                    ${conteoHTML}
                </div>
            ` : `
                <div class="especial-panel">
                    <h3>Picks por usuario</h3>
                    ${listaUsuarios}
                </div>
            `)}
        </div>
    `;
}

function crearHTMLEspecial(categoria){

    if(categoria === "podio"){
        return crearHTMLPodioEspecial();
    }

    if(categoria === "records"){
        return crearHTMLRecordsStats();
    }

    if(categoria === "bracket"){
        return crearHTMLBracketVisual();
    }

    if(categoria === "clasificados"){
        return crearHTMLClasificadosComunidad(grupoClasificadosActual);
    }

    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuarios = [...usuarios]
        .sort((a,b) => a.nombre.localeCompare(b.nombre, "es"))
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${crearHTMLPickEspecialConBandera(categoria, u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${crearHTMLPickEspecialConBandera(categoria, pick)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    const panelActual = categoria === "goleador" && vistaEspecialActual === "standing"
        ? "standing"
        : (vistaEspecialActual === "usuarios" ? "usuarios" : "conteo");

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales(categoria)}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPickEspecialConBandera(categoria, resumen.favorito)}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        ${crearHTMLBotonesVistaEspecial(categoria, panelActual)}

        <div class="especiales-layout especiales-layout-unico">
            ${panelActual === "standing" ? crearHTMLStandingGoleador() : (panelActual === "conteo" ? `
                <div class="especial-panel">
                    <h3>Conteo general</h3>
                    ${conteoHTML}
                </div>
            ` : `
                <div class="especial-panel">
                    <h3>Picks por usuario</h3>
                    ${listaUsuarios}
                </div>
            `)}
        </div>
    `;
}

function mostrarEstadisticas(categoriaEspecial = categoriaEspecialActual, vistaEspecial = "conteo", grupoClasificados = grupoClasificadosActual, conservarScroll = false, categoriaPodio = categoriaPodioActual){

    const scrollActual = window.scrollY || document.documentElement.scrollTop || 0;

    if(!conservarScroll){
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    categoriaEspecialActual = categoriasStatsPrincipales.includes(categoriaEspecial)
        ? categoriaEspecial
        : "bracket";

    if(categoriaEspecialActual === "podio" && categoriasPodio.includes(categoriaPodio)){
        categoriaPodioActual = categoriaPodio;
    }

    vistaEspecialActual = ["usuarios", "standing"].includes(vistaEspecial) ? vistaEspecial : "conteo";

    if(/^[A-L]$/.test(grupoClasificados)){
        grupoClasificadosActual = grupoClasificados;
    }

    contenido.innerHTML = `
        ${crearHTMLEspecial(categoriaEspecialActual)}

        ${getFooterCopyright()}
    `;


    if(conservarScroll){
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollActual,
                behavior: "auto"
            });
        });
    }
}
