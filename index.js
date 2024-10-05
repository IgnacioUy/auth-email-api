require('dotenv').config(); // Cargar variables de entorno del archivo .env
const express = require('express');
const cors = require('cors'); // Importar cors
const sendgrid = require('@sendgrid/mail');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken para generar el token

// Configurar la API Key de SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// Habilitar CORS para permitir solicitudes desde visiona.pe, wecast.cl y localhost
app.use(cors({
  origin: ['https://visiona.pe', 'https://wecast.cl', 'http://localhost:3000'], // Añadir los dominios permitidos
  methods: ['GET', 'POST', 'OPTIONS'], // Asegurar que los métodos correctos están permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Permitir headers necesarios
}));

// Limitar el tamaño de la solicitud a 10KB
app.use(express.json({ limit: '10kb' }));

// Endpoint para enviar el correo de autenticación
app.post('/api/send-auth-email', async (req, res) => {
  const { email, pais } = req.body;

  console.log(`Pais recibido: ${pais}`); // Log para verificar el valor de pais

  // Definir el remitente según el país y generar la URL de redirección correcta
  let senderEmail;
  let redirectUrl;

  if (pais.toLowerCase() === "chile") {
    senderEmail = "hola@wecast.cl";
  } else if (pais.toLowerCase() === "perú" || pais.toLowerCase() === "peru") {
    senderEmail = "hola@visiona.pe";
  } else {
    return res.status(400).json({ success: false, message: 'País no soportado' });
  }

  // Log para verificar el remitente que se está usando
  console.log(`Enviando desde: ${senderEmail}, País: ${pais}`);

  // Generar un token usando jsonwebtoken
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // El token expira en 1 hora

  // Incluir el token en el enlace de redirección
  redirectUrl = `${pais.toLowerCase() === "chile" ? "https://wecast.cl/admin" : "https://visiona.pe/admin"}?email=${email}&token=${token}`;

  // Definir el contenido del correo
  const msg = {
    to: email,
    from: {
      email: senderEmail,
      name: pais.toLowerCase() === "chile" ? "Wecast" : "Visiona" // Nombre del remitente según el país
    },
    subject: 'Autenticación de tu cuenta',
    text: `Hola!\n\nPor favor haz click en el siguiente enlace para iniciar sesión: ${redirectUrl}`,
    html: `<p>Hola,</p><p>Haz click en el siguiente enlace para iniciar sesión:</p><a href="${redirectUrl}">Iniciar sesión</a>`,
  };
  
  try {
    // Enviar el correo usando SendGrid
    await sendgrid.send(msg);
    res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ success: false, message: 'Error enviando correo' });
  }
});

// Iniciar el servidor en el puerto 3000 o el puerto disponible
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
