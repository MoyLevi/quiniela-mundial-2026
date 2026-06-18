function mostrarInicio(){

    const ranking = typeof getRankingGeneralCompleto === "function" ? getRankingGeneralCompleto() : getRanking();
    const lider = ranking[0];
    const totalPicksCapturados = (Array.isArray(picks) ? picks.length : 0) + (Array.isArray(picksKO) ? picksKO.length : 0);

    const proximos = partidos
        .filter(p => p.status === "Pendiente" || p.status === "En vivo")
        .slice(0, 3);

    contenido.innerHTML = `
        <div class="acciones-app acciones-leeme-top">
            <button class="btn-leeme" onclick="mostrarLeeme()">
                🔴 Léeme
            </button>
        </div>

        <div class="hero-logo">
            <img 
                src="https://assets.football-logos.cc/logos/tournaments/700x700/fifa-world-cup-2026--white.9ba8a004.png" 
                alt="FIFA World Cup 2026"
            >
        </div>

        <h1>QUINIELA <span class="titulo-acento">MUNDIAL 2026</span></h1>

        <div class="acciones-app">
            <button onclick="compartirApp()">📤 Compartir quiniela</button>
        </div>

        <div class="refresh-container">
            <p class="ultima-actualizacion">
                Última actualización: ${formatearFechaHora(ultimaActualizacion)}
            </p>

            <button class="btn-refresh" onclick="actualizarDatos()">
                <img id="balonRefresh" class="balon-app" src="img/trionda.png" alt="Balón">
                Actualizar datos
            </button>
        </div>

        <div class="acciones-app acciones-inicio-botones">
            <button class="btn-premios" onclick="mostrarReglasPremios()">
                🏆 Premios
            </button>
        </div>

        <div class="inicio-grid">
            <div class="inicio-card">
                <h2>${usuarios.length}</h2>
                <p>Total de jugadores</p>
            </div>

            <div class="inicio-card">
                <h2>${lider ? lider.puntos : 0}</h2>
                <p>Puntos del líder</p>
            </div>

            <div class="inicio-card">
                <h2>${totalPicksCapturados}</h2>
                <p>Picks capturados</p>
            </div>
        </div>

        <h2>PRÓXIMOS <span class="titulo-acento">PARTIDOS</span></h2>

        ${proximos.map(p => `
            <div class="partido ${getClaseStatus(p.status)}" onclick="verPartido(${p.id})">
                <div class="equipo">
                    <img src="${getFlag(p.local)}">
                    <p>${p.local}</p>
                </div>

                <div class="marcador-box">
                    <div class="marcador">
                        ${p.status === "En vivo" && p.golesLoc !== "" && p.golesVis !== "" 
                            ? `${p.golesLoc}-${p.golesVis}` 
                            : "VS"}
                    </div>
                    ${p.status === "En vivo" ? `<div class="status-mini status-vivo">En vivo</div>` : ""}
                </div>

                <div class="equipo">
                    <img src="${getFlag(p.visita)}">
                    <p>${p.visita}</p>
                </div>
            </div>
        `).join("")}

        ${getFooterCopyright()}
    `;
}

function mostrarReglasPremios(){

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>

        <h1>REGLAS <span class="titulo-acento">Y PREMIOS</span></h1>

        <p class="subtexto">Puedes hacer zoom con dos dedos en el celular.</p>

        <div class="visor-reglas" id="visorReglas">
            <img 
                src="img/reglas-premios.png" 
                alt="Sistema de puntuación y premios"
                class="img-reglas"
                id="imgReglas"
            >
        </div>

        <a class="btn-descargar-reglas" href="img/reglas-premios.png" download>
            📥 Descargar imagen
        </a>

        ${getFooterCopyright()}
    `;

    setTimeout(() => {
        const imagen = document.getElementById("imgReglas");
        const visor = document.getElementById("visorReglas");

        if(!imagen || !visor || !window.Panzoom){
            return;
        }

        const iniciarZoom = () => {
            const panzoom = Panzoom(imagen, {
                maxScale: 5,
                minScale: 1,
                contain: "outside"
            });

            visor.addEventListener("wheel", panzoom.zoomWithWheel);
        };

        if(imagen.complete){
            iniciarZoom();
        } else {
            imagen.onload = iniciarZoom;
        }
    }, 100);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function mostrarLeeme(){

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>

        <h1>AVISOS <span class="titulo-acento">QUINIELA</span></h1>

        <div class="leeme-card">
            <p><strong>Last update: 17.Junio.2026 9:42pm</strong></p>
            <p>Hola quiniel@s, disfrutando el Mundial? ya se nos fue la jornada 1 y esto aun le falta!, En este espacio estaré informándoles cosas interesantes que se vienen.<br><br>

Les comparto la versión 3.0 que incluye la segunda fase completa, váyanla checando y entendiendo que son muchos Standings que ir monitoreando! no nada más es la etapa de grupos, esto conforme a las Reglas y Premios acordados, LÉANLOS! si aún no lo han hecho.<br><br>

Traté de poner todo de manera super detallada y transparente para que todos puedan ver el detalle de cada sección y como se conforman los puntos de cada categoría.<br><br>

Al finalizar el último partido de fase de grupos de manera automática se sumaran TODAS las demás tablas, Ojito con esto! y no se me confundan! por eso váyanlas viendo y familiarizandose con cada una de ellas.<br><br>

Toda la APP es 100% dinámica, con 1 solo gol se calcula absolutamente todo, así que actualicen la APP cada que quieran ver algo en tiempo real.<br><br>

Les adelanto: para la fase de 32, habrá dos opciones: 1. Conservar sus picks originales que llenaron ANTES de que comenzara el mundial o 2. Volver a hacer nuevos Picks, pero en esta ocasion serán ANTES de comenzar la Fase de 32. Váyanle viendo y en su momento les diré como hacer su nuevos picks. Desde luego que les recomiendo esta opción, pero como quieran.<br><br>

Bueno aqui sigo, me falta desarrollar los Standings de los Goleadores, e integrarlos al final, y otras monerias. Pero a su tiempo. 
 
</p>
        </div>

        ${getFooterCopyright()}
    `;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
