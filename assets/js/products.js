const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbnEh19rwIV-ksZZBaez6Ma_XpGtSYEkz_NSOLOvrczFTkQMdn7MB4rSPDLhTBazGXfOavA4c2zq4z/pub?output=csv';

window.products = [];

// Función para imágenes
const imgAPI = (ruta) => {
    if (!ruta) return 'assets/img/placeholder.jpg';
    if (ruta.startsWith('http')) return ruta;
    const dominio = 'https://hijo-prodigo.vercel.app/'; 
    return `https://wsrv.nl/?url=${dominio}${ruta}&output=webp&q=80`;
};

function cargarProductos() {
    // AVISO 1: Si falta la librería
    if (typeof Papa === 'undefined') {
        alert("ERROR: Falta PapaParse en el HTML. Revisá los scripts.");
        return;
    }

    Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            // AVISO 2: Éxito
            console.log("Datos crudos:", results.data);

            window.products = results.data
                .filter(row => row.id) // Ignorar filas vacías
                .map(row => ({
                    id: row.id,
                    name: row.name,
                    price: Number(row.price), // Aseguramos que sea número
                    image: imgAPI(row.image),
                    category: row.category,
                    stock: {
                        S: row.stock_s || 0,
                        M: row.stock_m || 0,
                        L: row.stock_l || 0,
                        XL: row.stock_xl || 0
                    }
                }));
            if (typeof renderShop === 'function') renderShop();
            if (typeof loadProductDetail === 'function') loadProductDetail();
        },
        error: function(err) {
            // AVISO 3: Falló la conexión
            alert("Error al leer el Excel. Google no responde.");
        }
    });
}

cargarProductos();

