import jsPDF from "jspdf";

export const generarPDF = (animal, adoptante, fechaAdopcion, observaciones) => {
  const doc = new jsPDF();

  const leftX = 20;
  const rightX = 100;
  let yStart = 60;

  // Logo
  const imgProps = {
    imageData: '/logo/pawshelt.png',
    x: 160,
    y: 10,
    width: 40,
    height: 40,
  };

  // Encabezado
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Pawshelt - Confirmación de Adopción", leftX, 40);

  // Logo
  if (doc.addImage) {
    try {
      doc.addImage(imgProps.imageData, "PNG", imgProps.x, imgProps.y, imgProps.width, imgProps.height);
    } catch {
      // Ignorar si no se carga logo
    }
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    "El adoptante se compromete a proporcionar los cuidados necesarios, alimentación adecuada, atención veterinaria y un entorno seguro para la mascota adoptada, garantizando así su bienestar y calidad de vida.",
    leftX,
    yStart,
    { maxWidth: 170 }
  );

  yStart += 20;

  // Secciones datos
  doc.setFont("helvetica", "bold");
  doc.text("Datos de la mascota:", leftX, yStart);
  doc.text("Datos del adoptante:", rightX, yStart);

  yStart += 10;

  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${animal?.nombre || "N/A"}`, leftX + 2, yStart);
  doc.text(`Raza: ${animal?.raza || "N/A"}`, leftX + 2, yStart + 8);

  const edadTexto = animal?.edadCantidad
    ? animal.unidadEdad.toLowerCase() === "meses"
      ? `${animal.edadCantidad} Meses`
      : `${animal.edadCantidad} Años`
    : "N/A";

  const sexoTexto = animal?.sexo
    ? animal.sexo.toUpperCase() === "HEMBRA"
      ? "Hembra"
      : "Macho"
    : "N/A";

  doc.text(`Sexo: ${sexoTexto}`, leftX + 2, yStart + 16);
  doc.text(`Edad: ${edadTexto}`, leftX + 2, yStart + 24);
  doc.text(`Nombre: ${adoptante?.nombre || "N/A"}`, rightX, yStart);
  doc.text(`Teléfono: ${adoptante?.telefono || "N/A"}`, rightX, yStart + 8);
  doc.text(`Email: ${adoptante?.email || "N/A"}`, rightX, yStart + 16);
  doc.text(`Dirección: ${adoptante?.direccion || "N/A"}`, rightX, yStart + 24);

  yStart += 50;

  // Observaciones solo si tiene contenido
  if (observaciones && observaciones.trim() !== "") {
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", leftX, yStart);
    yStart += 10;
    doc.setFont("helvetica", "normal");
    doc.text(observaciones, leftX + 2, yStart, { maxWidth: 170 });
    yStart += 15;
  } else {
    yStart += 15;  // un pequeño espacio si no hay observaciones
  }

  // Fecha centrada antes de firmas
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

  yStart += 30;

  // Líneas de firma
  doc.line(leftX, yStart, leftX + 70, yStart);
  doc.line(rightX + 15, yStart, rightX + 85, yStart); // movido 15 px a la derecha

  yStart += 8;

  // Nombres centrados debajo de líneas
  doc.setFont("helvetica", "normal");

  // Centro para representante
  const leftCenter = leftX + 35;  // mitad de 70

  // Centro para adoptante (línea movida +15, ancho 70)
  const rightCenter = rightX + 15 + 35;

  doc.text("Representante de PawShelt", leftCenter, yStart, { align: "center" });
  doc.text(`${adoptante?.nombre || "N/A"}`, rightCenter, yStart, { align: "center" });


  yStart += 20;

  // Texto agradecimiento debajo de las firmas
  doc.text(
    `Gracias por darle una nueva oportunidad y un hogar lleno de amor a ${animal?.nombre}.`,
    leftX,
    yStart,
    { maxWidth: 170 }
  );

  // Abrir PDF en nueva pestaña
  window.open(doc.output("bloburl"), "_blank");
};
