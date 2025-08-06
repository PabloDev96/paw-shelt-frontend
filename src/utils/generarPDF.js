import jsPDF from "jspdf";

export const generarPDF = (animal, adoptante, fechaAdopcion, observaciones) => {
  const doc = new jsPDF();

  const leftX = 20;
  const rightX = 100;  // Más a la izquierda para alinear adoptante y mascota
  let yStart = 60;     // Subido de 30 a 50 para dejar espacio al logo

  // Logo
  const imgProps = {
    imageData: '/logo/pawshelt.png', // Ajusta ruta si es necesario
    x: 160,
    y: 10,
    width: 40,
    height: 40,
  };

  // Encabezado
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Pawshelt - Confirmación de Adopción", leftX, 40); // También subido un poco el título

  // Logo
  if (doc.addImage) {
    try {
      doc.addImage(imgProps.imageData, "PNG", imgProps.x, imgProps.y, imgProps.width, imgProps.height);
    } catch {
      // No hacer nada si no puede cargar el logo
    }
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    "El adoptante se compromete a proporcionar los cuidados necesarios, alimentación adecuada, atención veterinaria y un entorno seguro y amoroso para la mascota adoptada, garantizando así su bienestar y calidad de vida.",
    leftX,
    yStart,
    { maxWidth: 170 }
  );

  yStart += 20;

  // Títulos de secciones (misma línea)
  doc.setFont("helvetica", "bold");
  doc.text("Datos de la mascota:", leftX, yStart);
  doc.text("Datos del adoptante:", rightX, yStart);

  yStart += 10;

  // Datos mascota
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${animal?.nombre || "N/A"}`, leftX + 2, yStart);
  doc.text(`Raza: ${animal?.raza || "N/A"}`, leftX + 2, yStart + 8);
  doc.text(`Sexo: ${animal?.sexo || "N/A"}`, leftX + 2, yStart + 16);
  doc.text(
    `Edad: ${animal?.edadCantidad ? animal.edadCantidad + " " + animal.unidadEdad : "N/A"}`,
    leftX + 2,
    yStart + 24
  );

  // Datos adoptante - alineados verticalmente y un poco más a la izquierda
  doc.text(`Nombre: ${adoptante?.nombre || "N/A"}`, rightX, yStart);
  doc.text(`Teléfono: ${adoptante?.telefono || "N/A"}`, rightX, yStart + 8);
  doc.text(`Email: ${adoptante?.email || "N/A"}`, rightX, yStart + 16);
  doc.text(`Dirección: ${adoptante?.direccion || "N/A"}`, rightX, yStart + 24);

  yStart += 50;

  // Observaciones
  doc.setFont("helvetica", "bold");
  doc.text("Observaciones:", leftX, yStart);
  yStart += 10;
  doc.setFont("helvetica", "normal");
  doc.text(observaciones || "Ninguna", leftX + 2, yStart, { maxWidth: 170 });

  yStart += 40;

  // Firmas
  doc.setFont("helvetica", "bold");
  doc.text("Firma del adoptante:", leftX, yStart);
  doc.text("Firma de Pawshelt:", rightX, yStart);

  yStart += 30;

  // Líneas de firma
  doc.line(leftX, yStart, leftX + 70, yStart);
  doc.line(rightX, yStart, rightX + 70, yStart);

  yStart += 30;

  // Fecha abajo centrada
  const fechaStr = fechaAdopcion.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.text(
    `En Oviedo a ${fechaStr}`,
    doc.internal.pageSize.getWidth() / 2,
    yStart,
    { align: "center" }
  );

  yStart += 20;

  // Texto agradecimiento justo debajo de la fecha
  doc.setFont("helvetica", "normal");
  doc.text(
    "Gracias por darle una nueva oportunidad y un hogar lleno de amor a esta mascota.",
    leftX,
    yStart,
    { maxWidth: 170 }
  );

  // Abrir PDF en nueva pestaña
  window.open(doc.output("bloburl"), "_blank");
};
