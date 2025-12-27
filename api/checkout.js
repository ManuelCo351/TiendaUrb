import { MercadoPagoConfig, Preference } from 'mercadopago';

// 1. CONFIGURACIÓN: CAMBIÁ ESTOS NÚMEROS A TU GUSTO
const ENVIO_COSTO_FIJO = 8000;      // Cuánto cobrás el envío si NO es gratis (ej: $8.000)
const ENVIO_GRATIS_DESDE = 120000;  // A partir de cuánto el envío es $0
const MONTO_MAYORISTA = 500000;     // A partir de cuánto aplicás descuento mayorista
const DESCUENTO_MAYORISTA = 25;     // 25% de descuento para mayoristas
const DESCUENTO_EXTRA_EVENTO = 0;   // Poné 10, 20, etc. si querés hacer un descuento general hoy (Hot Sale)

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items } = req.body;

    try {
      // A. CALCULAMOS EL TOTAL DEL CARRITO PRIMERO
      let totalCarrito = 0;
      items.forEach(item => {
        totalCarrito += Number(item.price) * Number(item.quantity);
      });

      // B. APLICAMOS LÓGICA DE DESCUENTOS
      let porcentajeDescuento = 0;

      // 1. ¿Es mayorista?
      if (totalCarrito >= MONTO_MAYORISTA) {
        porcentajeDescuento = DESCUENTO_MAYORISTA;
      } 
      // 2. ¿Hay un evento especial (Hot Sale) configurado arriba?
      else if (DESCUENTO_EXTRA_EVENTO > 0) {
        porcentajeDescuento = DESCUENTO_EXTRA_EVENTO;
      }

      // C. PROCESAMOS LOS PRODUCTOS CON EL PRECIO FINAL
      const itemsProcesados = items.map(producto => {
        let precioFinal = Number(producto.price);
        
        // Si hay descuento, lo aplicamos al precio unitario
        if (porcentajeDescuento > 0) {
          precioFinal = precioFinal - (precioFinal * (porcentajeDescuento / 100));
        }

        return {
          id: producto.id.toString(),
          title: producto.name,
          quantity: Number(producto.quantity),
          currency_id: 'ARS',
          unit_price: precioFinal,
          picture_url: `https://hijo-prodigo.vercel.app/${producto.image}`
        };
      });

      // D. CALCULAMOS EL ENVÍO
      // Si el total original supera el límite, costo 0. Si no, costo fijo.
      // (Ojo: Si es mayorista, asumimos envío gratis también o podés cambiar la lógica)
      let costoEnvio = ENVIO_COSTO_FIJO;
      
      if (totalCarrito >= ENVIO_GRATIS_DESDE) {
        costoEnvio = 0;
      }

      // E. CREAMOS LA PREFERENCIA
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: itemsProcesados,
          
          // ACÁ SE AGREGA EL COSTO DE ENVÍO
          shipments: {
            cost: costoEnvio,
            mode: 'not_specified', // Pide dirección obligatoria
          },

          back_urls: {
            success: "https://tienda-urb.vercel.app",
            failure: "https://tienda-urb.vercel.app",
            pending: "https://tienda-urb.vercel.app"
          },
          auto_return: "approved",
          // Esto sirve para que en el resumen de MP diga "Descuento aplicado" si hubo
          statement_descriptor: "TIENDA URB",
        }
      });

      res.status(200).json({ id: result.id });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la preferencia' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
      }

