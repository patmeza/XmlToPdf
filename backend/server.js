const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const { generarPDF } = require("./pdfGenerator");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../frontend/public")));

app.use(cors());
app.use(express.json());

// Configuración de subida de archivos
const upload = multer({ dest: "archivosXml/" });

app.post("/upload", upload.single("xmlFile"), async (req, res) => {
    try {
        const filePath = req.file.path;

        // Leer XML
        const xmlData = fs.readFileSync(filePath);
        const parser = new xml2js.Parser();
        parser.parseString(xmlData, async (err, result) => {
            if (err) throw err;

            const invoice = result["Invoice"];
            const pdfPath = path.join(__dirname, "archivosXml", "ticket.pdf");

            await generarPDF(invoice, pdfPath);

            res.download(pdfPath, "ticket.pdf", () => {
                fs.unlinkSync(filePath); // Borra XML temporal
                fs.unlinkSync(pdfPath);  // Borra PDF temporal
            });
        });
    } catch (error) {
        res.status(500).send("Error al procesar el archivo");
    }
});



app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
