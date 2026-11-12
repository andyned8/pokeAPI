// --- 0. CARGAR OPCIONES DE AUTOCOMPLETADO DESDE LA POKÉAPI ---
async function cargarOpcionesAutocomplete() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        const datalist = document.getElementById('pokemon-list');
        
        datalist.innerHTML = '';
        data.results.forEach(pokemon => {
            const option = document.createElement('option');
            option.value = pokemon.name;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error("No se pudo cargar la lista de autocompletado", error);
    }
}

cargarOpcionesAutocomplete();


// --- 1. LÓGICA DE LA POKÉAPI (Buscador individual con Shiny, Medidas y Estadísticas) ---
const input = document.getElementById('pokemon-input');
const btn = document.getElementById('buscar-btn');
const resultado = document.getElementById('resultado-pokemon');

async function realizarBusqueda(nombrePokemon = null) {
    const query = nombrePokemon ? nombrePokemon : input.value.trim().toLowerCase();
    if (!query) return;

    if (nombrePokemon) {
        input.value = nombrePokemon;
    }

    resultado.innerHTML = '<p>Cargando datos del Pokémon...</p>';

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!response.ok) throw new Error('No encontrado');
        
        const data = await response.json();
        
        // Mapear estadísticas de combate (HP, Attack, Defense, etc.)
        const statsHTML = data.stats.map(s => `
            <div class="stat-item">
                <strong>${s.stat.name.replace('-', ' ')}:</strong> ${s.base_stat}
            </div>
        `).join('');

        resultado.innerHTML = `
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
                <h3 style="text-transform: capitalize; margin: 0 0 0.5rem 0; color: #f8fafc;">${data.name} (#${data.id})</h3>
                
                <div class="pokemon-image-box">
                    <img src="${data.sprites.front_shiny}" alt="${data.name} shiny">
                </div>

                <p style="margin: 0.5rem 0; color: #cbd5e1;"><strong>Tipo:</strong> ${data.types.map(t => t.type.name).join(', ')}</p>
                <p style="margin: 0 0 0.5rem 0; color: #cbd5e1;"><strong>Altura:</strong> ${data.height / 10} m | <strong>Peso:</strong> ${data.weight / 10} kg</p>
                
                <h4 style="margin: 10px 0 5px 0; font-size: 0.9rem; color: #facc15; font-family: 'Press Start 2P', monospace;">Estadísticas</h4>
                <div class="stats-container">
                    ${statsHTML}
                </div>
            </div>
        `;

        document.getElementById('seccion-buscador').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        resultado.innerHTML = `<p style="color: #f87171; font-weight: 500;">Pokémon no encontrado. Intenta con otro nombre o número.</p>`;
    }
}

btn.addEventListener('click', () => realizarBusqueda());

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        realizarBusqueda();
    }
});


// --- 2. LÓGICA PARA FILTRAR POKÉMON POR TIPO (Tarjetas oscuras) ---
const typeButtons = document.querySelectorAll('.type-badge');
const tipoResultado = document.getElementById('tipo-resultado');

typeButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const tipoSeleccionado = button.getAttribute('data-type');
        tipoResultado.innerHTML = `<p>Cargando Pokémon de tipo ${button.textContent}...</p>`;

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/type/${tipoSeleccionado}`);
            const data = await response.json();
            
            const pokemonList = data.pokemon.slice(0, 12);
            tipoResultado.innerHTML = '';
            
            for (const p of pokemonList) {
                const pokeRes = await fetch(p.pokemon.url);
                const pokeData = await pokeRes.json();

                const card = document.createElement('div');
                card.style.cssText = "background: #121212; padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid #7f1d1d; transition: transform 0.2s; display: flex; flex-direction: column; align-items: center; width: 95px;";
                
                card.innerHTML = `
                    <img src="${pokeData.sprites.front_default}" alt="${p.pokemon.name}" style="width: 55px; height: 55px; image-rendering: pixelated;">
                    <span style="font-size: 0.75rem; font-weight: 600; text-transform: capitalize; margin-top: 6px; color: #f8fafc;">${p.pokemon.name}</span>
                `;

                card.onmouseover = () => card.style.transform = "scale(1.05)";
                card.onmouseout = () => card.style.transform = "scale(1)";

                card.addEventListener('click', () => {
                    realizarBusqueda(p.pokemon.name);
                });

                tipoResultado.appendChild(card);
            }

        } catch (error) {
            tipoResultado.innerHTML = `<p style="color: #f87171;">Error al cargar los Pokémon de este tipo.</p>`;
        }
    });
});


// --- 3. LÓGICA DE THREE.JS CON POKÉBOLA Y ORBITCONTROLS ---
const container = document.getElementById('three-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const sphereGroup = new THREE.Group();

const topGeometry = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const topMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
const topMesh = new THREE.Mesh(topGeometry, topMaterial);

const bottomGeometry = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
const bottomMaterial = new THREE.MeshBasicMaterial({ color: 0xf7f7f7 });
const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);

const centerGeometry = new THREE.CylinderGeometry(1.21, 1.21, 0.12, 32);
const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);

const buttonOuterGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
const buttonOuterMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const buttonOuter = new THREE.Mesh(buttonOuterGeo, buttonOuterMat);
buttonOuter.rotation.x = Math.PI / 2;
buttonOuter.position.set(0, 0, 1.2);

const buttonInnerGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.18, 32);
const buttonInnerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const buttonInner = new THREE.Mesh(buttonInnerGeo, buttonInnerMat);
buttonInner.rotation.x = Math.PI / 2;
buttonInner.position.set(0, 0, 1.22);

sphereGroup.add(topMesh);
sphereGroup.add(bottomMesh);
sphereGroup.add(centerMesh);
sphereGroup.add(buttonOuter);
sphereGroup.add(buttonInner);

scene.add(sphereGroup);

camera.position.z = 3.5;

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});