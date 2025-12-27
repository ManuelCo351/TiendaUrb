/* ==============================================
   LÓGICA DEL CARRITO - VERSIÓN COMPLETA
   (Incluye: Renderizado, Descuentos Visuales, MP y WhatsApp)
   ============================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. CARGA DE DATOS Y CONSTANTES
    let cart = JSON.parse(localStorage.getItem("hijoProdigoCart")) || [];
    
    // --- REGLAS DE NEGOCIO (Igual que en el servidor) ---
    const ENVIO_COSTO_FIJO = 8000;
    const ENVIO_GRATIS_DESDE = 120000;
    const MONTO_MAYORISTA = 500000;
    const DESCUENTO_MAYORISTA = 0.25; // 25%

    // Elementos del DOM
    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartItemsContainer = document.getElementById("cart-items-container");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const cartCountHeader = document.getElementById("cart-count-header");
    const cartBadges = document.querySelectorAll(".cart-badge");
    const checkoutBtn = document.getElementById("checkout-btn");
    const whatsappBtn = document.getElementById("whatsapp-btn"); // Nuevo botón
    const shippingNote = document.querySelector(".shipping-note"); // Texto chiquito del envío

    // 2. FUNCIONES DE INTERFAZ (Abrir/Cerrar)
    const openCart = () => {
        cartDrawer.classList.add("active");
        cartOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    const closeCart = () => {
        cartDrawer.classList.remove("active");
        cartOverlay.classList.remove("active");
        document.body.style.overflow = "auto";
    };

    document.querySelectorAll(".cart-wrapper button, #cart-btn button").forEach(b => b.onclick = openCart);
    if(document.getElementById("close-cart-btn")) document.getElementById("close-cart-btn").onclick = closeCart;
    if(document.getElementById("continue-shopping")) document.getElementById("continue-shopping").onclick = closeCart;
    if(cartOverlay) cartOverlay.onclick = closeCart;

    // 3. RENDERIZADO INTELIGENTE (Con descuentos visuales)
    window.renderCart = function() {
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = "";
        let subtotal = 0; // Precio puro de productos
        let totalItems = 0;

        // A. Dibujar productos
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-msg">Tu bolsa está vacía 😔</p>`;
            shippingNote.innerText = "Gastos de envío e impuestos calculados en el pago.";
            shippingNote.style.color = "#666";
        } else {
            cart.forEach((item, index) => {
                subtotal += item.price * item.quantity;
                totalItems += item.quantity;

                cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <span class="item-variant">Talle: ${item.size}</span>
                        <div class="item-controls">
                            <div class="qty-control">
                                <button onclick="updateQty(${index}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQty(${index}, 1)">+</button>
                            </div>
                            <button class="remove-btn" onclick="removeItem(${index})">Eliminar</button>
                        </div>
                    </div>
                    <div style="font-weight: 600;">$${(item.price * item.quantity).toLocaleString('es-AR')}</div>
                </div>`;
            });
        }

        // B. Calcular Totales y Mensajes (Lógica visual)
        let totalFinal = subtotal;

        // 1. Lógica Mayorista
        if (subtotal >= MONTO_MAYORISTA) {
            // Aplicar descuento
            const descuento = subtotal * DESCUENTO_MAYORISTA;
            totalFinal = subtotal - descuento;
            
            if(shippingNote) {
                shippingNote.innerHTML = `🎉 <b>DESCUENTO MAYORISTA APLICADO (-25%)</b>`;
                shippingNote.style.color = "#2ecc71"; // Verde
            }
        } 
        // 2. Lógica Envío Gratis (Si no es mayorista)
        else if (subtotal >= ENVIO_GRATIS_DESDE) {
            if(shippingNote) {
                shippingNote.innerHTML = `🚚 Tenés <b>ENVÍO GRATIS</b> a todo el país.`;
                shippingNote.style.color = "#2ecc71"; // Verde
            }
        } 
        // 3. Lógica Envío con Costo
        else if (subtotal > 0) {
            const falta = ENVIO_GRATIS_DESDE - subtotal;
            if(shippingNote) {
                shippingNote.innerHTML = `Faltan <b>$${falta.toLocaleString('es-AR')}</b> para envío gratis (Costo actual: $${ENVIO_COSTO_FIJO})`;
                shippingNote.style.color = "#666";
            }
        }

        // C. Actualizar Textos
        if(cartTotalPrice) cartTotalPrice.textContent = `$ ${totalFinal.toLocaleString('es-AR')}`;
        if(cartCountHeader) cartCountHeader.textContent = totalItems;
        cartBadges.forEach(badge => badge.textContent = totalItems);
        localStorage.setItem("hijoProdigoCart", JSON.stringify(cart));
    };

    // 4. FUNCIONES DE ACCIÓN
    window.updateQty = (index, change) => {
        if (cart[index].quantity + change > 0) cart[index].quantity += change;
        renderCart();
    };

    window.removeItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    window.addToCart = (productObj) => {
        const idx = cart.findIndex(i => i.id === productObj.id && i.size === productObj.size);
        idx > -1 ? cart[idx].quantity += productObj.quantity : cart.push(productObj);
        renderCart();
        openCart();
    };

    // 5. MERCADO PAGO (Botón Negro)
    if (typeof MercadoPago !== 'undefined') {
        const mp = new MercadoPago('APP_USR-68bd50d1-4a4f-4568-93cd-02ad055366eb', { locale: 'es-AR' });
       
        if(checkoutBtn) {
            checkoutBtn.onclick = async () => {
                if (cart.length === 0) return alert("Bolsa vacía");
                checkoutBtn.innerText = "PROCESANDO...";
                try {
                    const res = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: cart })
                    });
                    const data = await res.json();
                    if (data.id) mp.checkout({ preference: { id: data.id }, autoOpen: true });
                } catch (e) { alert("Error al conectar con Mercado Pago"); }
                checkoutBtn.innerText = "INICIAR COMPRA";
            };
        }
    }

    // 6. WHATSAPP (Botón Verde - A Convenir)
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            if (cart.length === 0) return alert("El carrito está vacío");

            let mensaje = "¡Hola Tienda Urb! 👋 Quiero coordinar este pedido (A convenir/Efectivo):\n\n";
            let totalEstimado = 0;

            cart.forEach(item => {
                const sub = item.price * item.quantity;
                totalEstimado += sub;
                mensaje += `- ${item.name} (${item.size}) x${item.quantity}: $${sub}\n`;
            });

            // Agregamos lógica visual al mensaje de WhatsApp también
            if (totalEstimado >= MONTO_MAYORISTA) {
                totalEstimado = totalEstimado * (1 - DESCUENTO_MAYORISTA);
                mensaje += `\n*APLICA DESCUENTO MAYORISTA (-25%)*`;
            }

            mensaje += `\n*TOTAL FINAL: $${totalEstimado.toLocaleString('es-AR')}*\n`;
            mensaje += "\nMis datos para el envío/retiro son:";

            const telefono = "5492975373508"; // Tu número
            window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
        };
    }

    renderCart(); // Carga inicial
});
                         
