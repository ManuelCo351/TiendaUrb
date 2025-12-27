const { MercadoPagoConfig, Preference } = require('mercadopago');

const ENVIO_COSTO_FIJO = 8000;
const ENVIO_GRATIS_DESDE = 1;
const MONTO_MAYORISTA = 500000;
const DESCUENTO_MAYORISTA = 25;
const DESCUENTO_EXTRA_EVENTO = 0;

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { items } = req.body;
      // IMPORTANTE: Necesitamos saber tu URL para que MP nos avise.
      // Vercel suele darla en el 'host', si no, pone tu dominio manual abajo.
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const deployUrl = `${protocol}://${host}`; 

      // A. CALCULAMOS TOTAL
      let totalCarrito = 0;
      items.forEach(item => {
        totalCarrito += Number(item.price) * Number(item.quantity);
      });

      // B. DESCUENTOS
      let porcentajeDescuento = 0;
      if (totalCarrito >= MONTO_MAYORISTA) porcentajeDescuento = DESCUENTO_MAYORISTA;
      else if (DESCUENTO_EXTRA_EVENTO > 0) porcentajeDescuento = DESCUENTO_EXTRA_EVENTO;

      // C. PROCESAMOS PRODUCTOS
      const itemsProcesados = items.map(producto => {
        let precioFinal = Number(producto.price);
        if (porcentajeDescuento > 0) {
          precioFinal = precioFinal - (precioFinal * (porcentajeDescuento / 100));
        }

        // TRUCO: Metemos el talle en el título para leerlo después en el Webhook
        // Ej: "Hoodie Cosecha ###M"
        return {
          id: producto.id.toString(),
          title: `${producto.name} ###${producto.size}`, 
          quantity: Number(producto.quantity),
          currency_id: 'ARS',
          unit_price: precioFinal,
          picture_url: `https://tienda-urb.vercel.app/${producto.image}`
        };
      });

      // D. ENVÍO
      let costoEnvio = ENVIO_COSTO_FIJO;
      if (totalCarrito >= ENVIO_GRATIS_DESDE) costoEnvio = 0;

      // E. CREAR PREFERENCIA
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: itemsProcesados,
          shipments: { cost: costoEnvio, mode: 'not_specified' },
          back_urls: {
            success: `${deployUrl}/`,
            failure: `${deployUrl}/`,
            pending: `${deployUrl}/`
          },
          auto_return: "approved",
          statement_descriptor: "TIENDA URB",
          // ACÁ ESTÁ LA MAGIA: Le decimos a MP que nos avise a este archivo
          notification_url: `${deployUrl}/api/webhook`
        }
      });

      res.status(200).json({ id: result.id });
      
    } catch (error) {
      console.error("Error MP:", error);
      res.status(500).json({ error: 'Error al crear la preferencia' });
    }
  } else {
    res.status(405).send(`Method ${req.method} Not Allowed`);
  }
};
