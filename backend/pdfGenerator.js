const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");

/**
 * ==================================================
 * CONVERTIR ENTERO A LETRAS
 * ==================================================
 */
function convertirEnteroALetras(numero) {

    if (numero === 0) {
        return "CERO";
    }

    if (numero < 0) {
        return `MENOS ${convertirEnteroALetras(Math.abs(numero))}`;
    }

    const unidades = [
        "",
        "UNO",
        "DOS",
        "TRES",
        "CUATRO",
        "CINCO",
        "SEIS",
        "SIETE",
        "OCHO",
        "NUEVE"
    ];

    const especiales = [
        "DIEZ",
        "ONCE",
        "DOCE",
        "TRECE",
        "CATORCE",
        "QUINCE",
        "DIECISÉIS",
        "DIECISIETE",
        "DIECIOCHO",
        "DIECINUEVE"
    ];

    const decenas = [
        "",
        "",
        "VEINTE",
        "TREINTA",
        "CUARENTA",
        "CINCUENTA",
        "SESENTA",
        "SETENTA",
        "OCHENTA",
        "NOVENTA"
    ];

    const centenas = [
        "",
        "CIENTO",
        "DOSCIENTOS",
        "TRESCIENTOS",
        "CUATROCIENTOS",
        "QUINIENTOS",
        "SEISCIENTOS",
        "SETECIENTOS",
        "OCHOCIENTOS",
        "NOVECIENTOS"
    ];


    /**
     * ----------------------------------------------
     * 0 - 99
     * ----------------------------------------------
     */
    function convertirMenor100(n) {

        if (n < 10) {
            return unidades[n];
        }

        if (n < 20) {
            return especiales[n - 10];
        }

        if (n < 30) {

            if (n === 20) {
                return "VEINTE";
            }

            return `VEINTI${unidades[n - 20].toLowerCase()}`
                .toUpperCase();
        }

        const decena = Math.floor(n / 10);
        const unidad = n % 10;

        if (unidad === 0) {
            return decenas[decena];
        }

        return `${decenas[decena]} Y ${unidades[unidad]}`;
    }


    /**
     * ----------------------------------------------
     * 0 - 999
     * ----------------------------------------------
     */
    function convertirMenor1000(n) {

        if (n < 100) {
            return convertirMenor100(n);
        }

        if (n === 100) {
            return "CIEN";
        }

        const centena = Math.floor(n / 100);
        const resto = n % 100;

        if (resto === 0) {
            return centenas[centena];
        }

        return `${centenas[centena]} ${convertirMenor100(resto)}`;
    }


    /**
     * ----------------------------------------------
     * ENTEROS GRANDES
     * ----------------------------------------------
     */
    function convertir(n) {

        if (n < 1000) {
            return convertirMenor1000(n);
        }


        // MIL
        if (n < 1000000) {

            const miles = Math.floor(n / 1000);
            const resto = n % 1000;

            let resultado;

            if (miles === 1) {
                resultado = "MIL";
            } else {
                resultado =
                    `${convertirMenor1000(miles)} MIL`;
            }

            if (resto > 0) {
                resultado +=
                    ` ${convertirMenor1000(resto)}`;
            }

            return resultado;
        }


        // MILLONES
        if (n < 1000000000) {

            const millones =
                Math.floor(n / 1000000);

            const resto =
                n % 1000000;

            let resultado;

            if (millones === 1) {
                resultado = "UN MILLÓN";
            } else {
                resultado =
                    `${convertir(millones)} MILLONES`;
            }

            if (resto > 0) {

                if (resto < 1000) {
                    resultado +=
                        ` ${convertirMenor1000(resto)}`;
                } else {
                    resultado +=
                        ` ${convertir(resto)}`;
                }
            }

            return resultado;
        }


        // MIL MILLONES
        if (n < 1000000000000) {

            const milesMillones =
                Math.floor(n / 1000000000);

            const resto =
                n % 1000000000;

            let resultado;

            if (milesMillones === 1) {
                resultado = "MIL MILLONES";
            } else {
                resultado =
                    `${convertir(milesMillones)} MIL MILLONES`;
            }

            if (resto > 0) {
                resultado +=
                    ` ${convertir(resto)}`;
            }

            return resultado;
        }


        return "MONTO DEMASIADO GRANDE";
    }


    return convertir(numero);
}

/**
 * ==================================================
 * NÚMERO A LETRAS
 * ==================================================
 * Ejemplo:
 * 60       -> SESENTA CON 00/100 SOLES
 * 125.50   -> CIENTO VEINTICINCO CON 50/100 SOLES
 * 1250     -> MIL DOSCIENTOS CINCUENTA CON 00/100 SOLES
 */
function numeroALetras(numero) {
    if (numero === null || numero === undefined || numero === "") {
        return "CERO CON 00/100 SOLES";
    }

    numero = Number(numero);

    if (isNaN(numero)) {
        return "CERO CON 00/100 SOLES";
    }

    // Evitar problemas de precisión con decimales
    numero = Math.round((numero + Number.EPSILON) * 100) / 100;

    const entero = Math.floor(numero);
    const centimos = Math.round((numero - entero) * 100);

    const letras = convertirEnteroALetras(entero);

    return `${letras} CON ${String(centimos).padStart(2, "0")}/100 SOLES`;
}

async function generarPDF(datos, outputPath) {
    return new Promise(async (resolve, reject) => {
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
            const direccion1 =
                "Esquina PROLG. JORGE CHAVEZ CON CAJATAMBO";
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

                /**
                 * ==================================================
                 * FECHA Y HORA DE EMISIÓN
                 * ==================================================
                 */

                let yActual = doc.y + 2;

                doc.fontSize(8);

                // Encabezados
                doc.text(
                    "FECHA EMISIÓN",
                    10,
                    yActual
                );

                doc.text(
                    "HORA",
                    105,
                    yActual
                );

                // Valores
                const fechaEmision =
                    datos["cbc:IssueDate"]?.[0] || "";

                const horaEmision =
                    (
                        datos["cbc:IssueTime"]?.[0] ||
                        ""
                    ).split(".")[0];

                doc.text(
                    fechaEmision,
                    20,
                    yActual + 12
                );

                doc.text(
                    horaEmision,
                    95,
                    yActual + 12
                );


                /**
                 * ==================================================
                 * RAZÓN SOCIAL
                 * ==================================================
                 */

                yActual += 25;

                doc.font("Courier-Bold")
                    .text(
                        "RAZÓN SOCIAL:",
                        10,
                        yActual,
                        {
                            align: "center"
                        }
                    );

                const razonSocial =
                    datos[
                    "cac:AccountingCustomerParty"
                    ]?.[0]?.[
                    "cac:Party"
                    ]?.[0]?.[
                    "cac:PartyLegalEntity"
                    ]?.[0]?.[
                    "cbc:RegistrationName"
                    ]?.[0] || "";

                yActual += 10;

                doc.font("Courier-Bold")
                    .text(
                        ` ${razonSocial}`,
                        10,
                        yActual,
                        {
                            align: "center"
                        }
                    );


                /**
                 * ==================================================
                 * RUC
                 * ==================================================
                 */

                const ruc =
                    datos[
                        "cac:AccountingCustomerParty"
                    ]?.[0]?.[
                        "cac:Party"
                    ]?.[0]?.[
                        "cac:PartyIdentification"
                    ]?.[0]?.[
                        "cbc:ID"
                    ]?.[0]?._ || "";

                if (ruc) {

                    yActual += 16;

                    doc.font("Courier-Bold")
                        .text(
                            `RUC: ${ruc}`,
                            10,
                            yActual,
                            {
                                align: "center"
                            }
                        );
                }


                // Actualizamos cursor
                doc.y = yActual + 20;

            } else if (tipoDocumento === "03") {
                // BOLETA
                doc.fontSize(9);
                doc.font("Courier-Bold").text(`BOLETA DE VENTA ELECTRÓNICA`, { align: "center" });
                doc.fontSize(7);
                doc.text(` ${datos['cbc:ID']?.[0] || ""}`, { align: "center" });

                doc.moveDown(1);

                /**
                 * ==================================================
                 * FECHA Y HORA DE EMISIÓN
                 * ==================================================
                 */

                let yActual = doc.y + 2;

                doc.fontSize(8);

                // Encabezados
                doc.text(
                    "FECHA EMISIÓN",
                    10,
                    yActual
                );

                doc.text(
                    "HORA",
                    105,
                    yActual
                );

                // Valores
                const fechaEmision =
                    datos["cbc:IssueDate"]?.[0] || "";

                const horaEmision =
                    (
                        datos["cbc:IssueTime"]?.[0] ||
                        ""
                    ).split(".")[0];

                doc.text(
                    fechaEmision,
                    20,
                    yActual + 12
                );

                doc.text(
                    horaEmision,
                    95,
                    yActual + 12
                );


                /**
                 * ==================================================
                 * CLIENTE
                 * ==================================================
                 */

                yActual += 25;

                doc.font("Courier-Bold")
                    .text(
                        "CLIENTE:",
                        10,
                        yActual,
                        {
                            align: "center"
                        }
                    );


                /**
                 * ==================================================
                 * NOMBRE CLIENTE
                 * ==================================================
                 */

                const nombreCliente =
                    datos[
                    "cac:AccountingCustomerParty"
                    ]?.[0]?.[
                    "cac:Party"
                    ]?.[0]?.[
                    "cac:PartyLegalEntity"
                    ]?.[0]?.[
                    "cbc:RegistrationName"
                    ]?.[0] || "";

                if (nombreCliente) {

                    yActual += 10;

                    doc.font("Courier-Bold")
                        .text(
                            ` ${nombreCliente}`,
                            10,
                            yActual,
                            {
                                align: "center"
                            }
                        );
                }


                /**
                 * ==================================================
                 * DOCUMENTO CLIENTE
                 * ==================================================
                 */

                const cliente =
                    datosReservaPDF?.cliente;

                const tipoDocumentoCliente =
                    cliente?.tipo_documento || "";

                const etiquetaDocumento =
                    tipoDocumentoCliente === "DNI"
                        ? "DNI"
                        : tipoDocumentoCliente === "PAS"
                            ? "PASAPORTE"
                            : tipoDocumentoCliente === "CE"
                                ? "CARNET DE EXTRANJERÍA"
                                : tipoDocumentoCliente;

                const numeroDocumento =
                    cliente?.numero_documento || "";

                if (numeroDocumento) {

                    yActual += 16;

                    doc.font("Courier-Bold")
                        .text(
                            `${etiquetaDocumento}: ${numeroDocumento}`,
                            10,
                            yActual,
                            {
                                align: "center"
                            }
                        );
                }

                doc.y = yActual + 5;
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
                doc.text("DESCRIPCIÓN", 35, y);
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
            const moneda =
                datos["cbc:DocumentCurrencyCode"]?.[0]?._ || "";

            const montoTotal =
                datos[
                    "cac:LegalMonetaryTotal"
                ][0][
                    "cbc:PayableAmount"
                ]?.[0]?._ ||
                "0";

            // Convertir monto a letras
            const montoEnLetras =
                numeroALetras(parseFloat(montoTotal));

            doc.text(
                `MONEDA: ${moneda}`,
                10,
                doc.y
            );

            doc.text(
                `SON: ${montoEnLetras}`,
                10,
                doc.y
            );

            doc.x = 7;


            // QR con ID de la factura
            const qrData = await QRCode.toDataURL(datos['cbc:ID']?.[0] || "FACTURA");

            const startY = doc.y; // posición actual antes del QR
            const pageWidth = doc.page.width; // Ancho de la página
            const qrWidth = 80; // Ajusta el ancho del logo
            const x = (pageWidth - qrWidth) / 2; // Centro en X
            // Dibuja QR en X=200, Y=startY
            doc.image(qrData, x, startY, { fit: [80, 80] });

            doc.moveDown(10);


            /**
             * ==================================================
             * REPRESENTACIÓN IMPRESA
             * ==================================================
             */

            doc.fontSize(8);
            //doc.font("Courier");

            const nombreTipoDocumento =
                tipoDocumento === "01"
                    ? "FACTURA DE VENTA ELECTRÓNICA"
                    : tipoDocumento === "03"
                        ? "BOLETA DE VENTA ELECTRÓNICA"
                        : "COMPROBANTE DE PAGO ELECTRÓNICO";

            doc.text(
                ` ${nombreTipoDocumento} - CPE`,
                {
                    align: "center",
                    width: 146
                }
            );

            const resolucion =
                // representacion.resolucion ||
                "034-005-0005315";

            if (resolucion) {

                doc.moveDown(0.3);

                doc.text(
                    "Autorizado mediante Resolución de Intendencia",
                    {
                        align: "center",
                        width: 146
                    }
                );

                doc.text(
                    `N° ${resolucion}`,
                    {
                        align: "center",
                        width: 146
                    }
                );
            }

            doc.text(`GRACIAS POR SU VISITA`, { align: "center" });

            /**
             * Información sobre reservas.
             */
            doc.moveDown(0.3);

            doc.fontSize(7);

            doc.text(
                "¿Desea realizar una reserva?",
                {
                    align: "center",
                    width: 146
                }
            );

            doc.text(
                "Comuníquese al 980165339 WhatsApp o llamada para más información.",
                {
                    align: "center",
                    width: 146
                }
            );
            

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
