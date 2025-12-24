document.addEventListener("DOMContentLoaded", () => {
    
    /* ==============================================
       1. VARIABLES & SELECTORES
       ============================================== */
    const header = document.querySelector(".main-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const navWrapper = document.querySelector(".nav-wrapper");
    const body = document.body;

    /* ==============================================
       2. MENÚ MÓVIL (Abrir / Cerrar)
       ============================================== */
    menuToggle.addEventListener("click", () => {
        // Alternamos la clase 'mobile-menu-open' en el header
        header.classList.toggle("mobile-menu-open");
        
        // Bloqueamos el scroll del body si el menú está abierto
        if (header.classList.contains("mobile-menu-open")) {
            body.style.overflow = "hidden";
        } else {
            body.style.overflow = "auto";
        }
    });

    // Cerrar menú al tocar un link (UX importante)
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            header.classList.remove("mobile-menu-open");
            body.style.overflow = "auto";
        });
    });

    /* ==============================================
       3. EFECTO SCROLL EN HEADER
       ============================================== */
    window.addEventListener("scroll", () => {
        // Si bajamos más de 50px, agregamos la clase .scrolled
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    /* ==============================================
       4. ANIMACIONES DE ENTRADA (Scroll Reveal)
       ============================================== */
    // Configuramos el "Ojo" del navegador (Intersection Observer)
    const observerOptions = {
        threshold: 0.1, // Se activa cuando se ve el 10% del elemento
        rootMargin: "0px 0px -50px 0px" // Margen inferior para que active un poco antes
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Agregamos la clase .active para que el CSS haga la transición
                entry.target.classList.add("active");
                // Dejamos de observar para que no se repita la animación
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Buscamos todos los elementos que tengan la clase .reveal-text
    const hiddenElements = document.querySelectorAll(".reveal-text");
    hiddenElements.forEach(el => observer.observe(el));
});

