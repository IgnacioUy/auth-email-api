require("dotenv").config(); // Cargar variables de entorno del archivo .env
const express = require("express");
const cors = require("cors"); // Importar cors
const sendgrid = require("@sendgrid/mail");

// Configurar la API Key de SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// // Habilitar CORS para permitir solicitudes desde visiona.pe, wecast.cl y localhost
// app.use(
//   cors({
//     origin: [
//       "https://visiona.pe",
//       "https://wecast.cl",
//       "http://localhost:3000",
//     ],
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // Permitir credenciales
//   })
// );

// // Limitar el tamaño de la solicitud a 10KB
// app.use(express.json({ limit: "10kb" }));

app.get("/", function (req, res) {
  res.send("GET request to the homepage");
});

// Endpoint para enviar el correo de autenticación
app.post("/api/send-auth-email", async (req, res) => {
  const { email, pais } = req.body;

  console.log(`Pais recibido: ${pais}`); // Log para verificar el valor de pais

  // Definir el remitente según el país
  let senderEmail;

  if (pais.toLowerCase() === "chile") {
    senderEmail = "hola@wecast.cl";
  } else if (pais.toLowerCase() === "perú" || pais.toLowerCase() === "peru") {
    senderEmail = "hola@visiona.pe";
  } else {
    return res
      .status(400)
      .json({ success: false, message: "País no soportado" });
  }

  // Configurar la URL de redirección basada en el entorno
  const isLocalhost = process.env.NODE_ENV === "development";
  console.log(`Entorno: ${isLocalhost ? "localhost" : "producción"}`);
  console.log(`País recibido: ${pais}`);

  const redirectUrl = `${
    pais.toLowerCase() === "chile"
      ? isLocalhost
        ? "http://localhost:3000/admin"
        : "https://wecast.cl/admin"
      : isLocalhost
      ? "http://localhost:3000/admin"
      : "https://visiona.pe/admin"
  }?email=${email}`;

  console.log(`Redirect URL: ${redirectUrl}`);

  // Log para verificar el remitente que se está usando
  console.log(`Enviando desde: ${senderEmail}, País: ${pais}`);

  // Definir el contenido del correo
  const msg = {
    to: email,
    from: {
      email: senderEmail,
      name: pais.toLowerCase() === "chile" ? "Wecast" : "Visiona", // Nombre del remitente según el país
    },
    subject: "Autenticación de tu cuenta",
    text: `Hola!\n\nPor favor haz click en el siguiente enlace para iniciar sesión: ${redirectUrl}`,
    html: `<p>Hola,</p><p>Haz click en el siguiente enlace para iniciar sesión:</p><a href="${redirectUrl}">Iniciar sesión</a>`,
  };

  try {
    // Enviar el correo usando SendGrid
    await sendgrid.send(msg);
    res
      .status(200)
      .json({ success: true, message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ success: false, message: "Error enviando correo" });
  }
});

app.get("/api/test", function (req, res) {
  res.send("test de test");
});

// Iniciar el servidor en el puerto 3000 o el puerto disponible
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
