import jsPDF from "jspdf";

export function generarPDF(animal, adoptante, fechaAdopcion, observaciones) {
  const doc = new jsPDF();

  // Cargar el logo desde public (asegúrate que la ruta sea correcta)
  const img = new Image();
  img.src = "/logo/pawshelt.png";

  img.onload = () => {
    doc.addImage(img, "PNG", 15, 10, 50, 25);

    doc.setFontSize(18);
    doc.text("Pawshelt - Confirmación de Adopción", 70, 25);

    doc.setFontSize(12);
    doc.text(`Fecha de adopción: ${fechaAdopcion.toLocaleDateString()}`, 15, 50);

    doc.text(`Mascota adoptada: ${animal.nombre}`, 15, 60);
    doc.text(`Raza: ${animal.raza}`, 15, 70);

    doc.text(`Adoptante: ${adoptante.nombre}`, 15, 90);
    doc.text(`Teléfono: ${adoptante.telefono}`, 15, 100);
    doc.text(`Email: ${adoptante.email}`, 15, 110);

    doc.text(`Observaciones:`, 15, 130);
    doc.text(observaciones || "Ninguna", 15, 140);

    doc.text("Gracias por dar una segunda oportunidad a estos peludos!", 15, 170);

    const filename = `Adopcion_${animal.nombre}_${fechaAdopcion.toLocaleDateString().replace(/\//g, "_")}.pdf`;
    doc.save(filename);
  };

  img.onerror = () => {
    alert("Error al cargar el logo para el PDF.");
  };
}
