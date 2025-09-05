const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");

async function generarPDF(datos, outputPath) {
    return new Promise(async(resolve, reject) => {
        try {
            const doc = new PDFDocument({ autoFirstPage: false });

            const contenidoAltura = 550; // Calcula según el contenido
            doc.addPage({
                size: [156, contenidoAltura], // ancho fijo, altura dinámica
                margin: 3
            });

            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const supplier = datos["cac:AccountingSupplierParty"]?.[0]?.["cac:Party"]?.[0] || {};
            const supplierseller = datos["cac:SellerSupplierParty"]?.[0]?.["cac:Party"]?.[0] || {};

            const nombrePropietario = supplier["cac:PartyLegalEntity"]?.[0]?.["cbc:RegistrationName"]?.[0] || "";
            const ruc = supplier["cac:PartyIdentification"]?.[0]?.["cbc:ID"]?.[0]?._ || "";
            const direccion = supplierseller["cac:PostalAddress"]?.[0]?.["cac:AddressLine"]?.[0]?.["cbc:Line"]?.[0] || "";
            const direccion1 = supplier["cac:PartyLegalEntity"]?.[0]?.["cac:RegistrationAddress"]?.[0]?.["cac:AddressLine"]?.[0]?.["cbc:Line"]?.[0] || "";
            const departamento = supplier["cac:PartyLegalEntity"]?.[0]?.["cac:RegistrationAddress"]?.[0]?.["cbc:CountrySubentity"]?.[0] || "";
            const ciudad = supplier["cac:PartyLegalEntity"]?.[0]?.["cac:RegistrationAddress"]?.[0]?.["cbc:CityName"]?.[0] || "";
            const distrito = supplier["cac:PartyLegalEntity"]?.[0]?.["cac:RegistrationAddress"]?.[0]?.["cbc:District"]?.[0] || "";
            // Logo
            if (fs.existsSync("Logo_hostal.png")) {
                const pageWidth = doc.page.width; // Ancho de la página
                const logoWidth = 150; // Ajusta el ancho del logo
                const x = (pageWidth - logoWidth) / 2; // Centro en X
                doc.image("Logo_hostal.png", x, 20, { width: logoWidth });
            }

            // Encabezado
            doc.moveDown(6); // espacio antes de lo siguiente
            // Ahora lo mostramos en el PDF
            doc.fontSize(8);
            doc.font("Courier");
            doc.text(` ${nombrePropietario}`, { align: "center" });
            doc.text(`R.U.C. ${ruc}`, { align: "center" });
            doc.text(` ${direccion1} ${departamento}-${ciudad}-${distrito}`, { align: "center" });
            doc.text(`TELEF: 980165339 - 957465847`, { align: "center" });
            doc.moveDown(1);
            // Separador
            doc.moveTo(5, doc.y + 2)      // margen izquierdo
                .lineTo(150, doc.y + 2)     // ancho ticket - margen derecho
                .stroke();

            doc.moveDown(2); // espacio antes de lo siguiente

            doc.x = 10;  // margen izquierdo

            // Tipo de documento y datos del cliente
            const tipoDocumento = datos['cbc:InvoiceTypeCode']?.[0]?._ || "";

            if (tipoDocumento === "01") {
                // FACTURA
                doc.fontSize(9);
                doc.font("Courier-Bold").text(`FACTURA ELECTRÓNICA`, { align: "center" });
                doc.fontSize(8);
                doc.text(`${datos['cbc:ID']?.[0] || ""}`, { align: "center" });

                doc.moveDown(1);
                doc.font("Courier");
                // doc.text(`Fecha: ${datos['cbc:IssueDate']?.[0] || ""}`, { align: "center" });
                // doc.text(`Hora: ${datos['cbc:IssueTime']?.[0] || ""}`, { align: "center" });
                let y = doc.y;

                doc.text(` ${datos['cbc:IssueDate']?.[0] || ""}`, 10, y);
                doc.text(` ${datos['cbc:IssueTime']?.[0] || ""}`, 90, y);

                // Título en negrita
                doc.font("Courier-Bold")
                    .text(`Razón Social:`, 10, y + 10, { align: "center" });

                // Contenido normal
                doc.font("Courier")
                    .text(` ${datos['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0]?.['cac:PartyLegalEntity']?.[0]?.['cbc:RegistrationName']?.[0] || ""},`, 10, y + 18, { align: "center" });

                let y1 = doc.y;

                let rucTexto = `RUC: ${datos['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0]?.['cac:PartyIdentification']?.[0]?.['cbc:ID']?.[0]?._ || ""}`;

                // Texto completo en una sola línea, centrado
                doc.font("Courier-Bold")
                    .text(rucTexto, 10, y1 + 2, { align: "center" });

            } else if (tipoDocumento === "03") {
                // BOLETA
                doc.fontSize(9);
                doc.font("Courier-Bold").text(`BOLETA DE VENTA ELECTRÓNICA`, { align: "center" });
                doc.fontSize(7);
                doc.text(` ${datos['cbc:ID']?.[0] || ""}`, { align: "center" });

                doc.moveDown(1);
                doc.font("Courier");
                const y = doc.y;
                doc.fontSize(8);
                doc.text(` ${datos['cbc:IssueDate']?.[0] || ""}`, 10, y);
                doc.text(` ${datos['cbc:IssueTime']?.[0] || ""}`, 90, y);

                // Título en negrita
                doc.font("Courier-Bold")
                    .text(`Cliente :`, 10, y + 10, { align: "center" });

                // Contenido normal
                doc.font("Courier")
                    .text(` ${datos['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0]?.['cac:PartyLegalEntity']?.[0]?.['cbc:RegistrationName']?.[0] || ""}`, 10, y + 20, { align: "center" });

                let y1 = doc.y;

                let dniTexto = `DNI: ${datos['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0]?.['cac:PartyIdentification']?.[0]?.['cbc:ID']?.[0]?._ || ""}`;

                // Texto completo en una sola línea, centrado
                doc.font("Courier-Bold")
                    .text(dniTexto, 10, y1 + 2, { align: "center" });
            }

            doc.moveDown(1);
            // Separador
            doc.moveTo(5, doc.y + 2)      // margen izquierdo
                .lineTo(150, doc.y + 2)     // ancho ticket - margen derecho
                .stroke();

            doc.moveDown(1); // espacio antes de lo siguiente


            // Datos principales del XML
            doc.fontSize(8);
            doc.font("Courier");

            // Línea de detalle
            if (datos["cac:InvoiceLine"]) {
                let y = doc.y;
                doc.text("CANT", 4, y);
                doc.text("PROD/SERV", 35, y);
                doc.text("PRECIO", 120, y);

                // Separador
                doc.moveTo(5, doc.y + 2)      // margen izquierdo
                    .lineTo(150, doc.y + 2)     // ancho ticket - margen derecho
                    .stroke();
                doc.moveDown(1);
                doc.x = 4;
                // Iterar los items
                datos["cac:InvoiceLine"].forEach((line, i) => {
                    const descripcion = line["cac:Item"]?.[0]["cbc:Description"]?.[0] || "Producto";
                    const cantidad = line["cbc:InvoicedQuantity"]?.[0]?._ || "0";
                    const precioUnit = line["cac:Price"]?.[0]["cbc:PriceAmount"]?.[0]?._ || "0";

                    // cada texto en su columna
                    let filaY = doc.y;
                    doc.text(cantidad, 4, filaY, { width: 25, align: "left" });      // columna CANT
                    doc.text(descripcion, 35, filaY, { width: 70, align: "left" });   // columna PRODUCTO
                    doc.text(`${(precioUnit * 1.18 * cantidad).toFixed(2)}`, { align: "right" }, filaY, { width: 40 }); // columna PRECIO
                    doc.moveDown(2);
                });

            }
            doc.x = 10;
            //doc.moveDown(2);

            // Separador
            doc.moveTo(5, doc.y + 2)      // margen izquierdo
                .lineTo(150, doc.y + 2)     // ancho ticket - margen derecho
                .stroke();
            doc.moveDown(1);

            // Información de subtotal
            if (datos["cac:TaxTotal"]?.[0]) {
                let y = doc.y;
                const SubTotal = datos["cac:TaxTotal"][0]["cac:TaxSubtotal"]?.[0]["cbc:TaxableAmount"]?.[0]?._ || "0";
                doc.text("SUBTOTAL:", 60, y);  // etiqueta alineada a la izquierda
                doc.text(" S/", 100, y);  // etiqueta alineada a la izquierda
                doc.text(` ${parseFloat(SubTotal).toFixed(2)}`, { align: "right" }, y); // precio alineado en X=120
            }

            // Información de impuestos
            if (datos["cac:TaxTotal"]?.[0]) {
                let y = doc.y;
                const tax = datos["cac:TaxTotal"][0]["cbc:TaxAmount"]?.[0]?._ || "0";
                doc.text("IGV 18%:", 60, y);
                doc.text(" S/", 100, y);  // etiqueta alineada a la izquierda
                doc.text(` ${parseFloat(tax).toFixed(2)}`, { align: "right" }, y); // precio alineado en X=120

            }

            // Información total
            if (datos["cac:LegalMonetaryTotal"]?.[0]) {
                let y = doc.y;
                const total = datos["cac:LegalMonetaryTotal"][0]["cbc:PayableAmount"]?.[0]?._ || "0";
                doc.text("TOTAL:", 60, y, { bold: true });
                doc.text(" S/", 100, y);  // etiqueta alineada a la izquierda
                doc.text(` ${parseFloat(total).toFixed(2)}`, { align: "right" }, y, { bold: true });
            }
            doc.x = 10;
            doc.moveDown(2);
            doc.text(`Moneda: ${datos['cbc:DocumentCurrencyCode']?.[0]?._ || ""}`);


            // QR con ID de la factura
            const qrData = await QRCode.toDataURL(datos['cbc:ID']?.[0] || "FACTURA");

            const startY = doc.y; // posición actual antes del QR
            const pageWidth = doc.page.width; // Ancho de la página
            const qrWidth = 80; // Ajusta el ancho del logo
            const x = (pageWidth - qrWidth) / 2; // Centro en X
            // Dibuja QR en X=200, Y=startY
            doc.image(qrData, x, startY, { fit: [80, 80] });

            doc.moveDown(10);
            doc.text(`GRACIAS POR SU VISITA`, { align: "center" });
            doc.end();

            stream.on("finish", resolve);
            stream.on("error", reject);
        }
        catch (error) {
            reject(error);
        }

    });
}
module.exports = { generarPDF };
