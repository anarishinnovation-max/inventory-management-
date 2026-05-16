import { jsPDF } from "jspdf";
import prisma from "./prisma";
import { format } from "date-fns";

export const DocumentService = {
  /**
   * Generates a PDF invoice for a Dispatch Order.
   */
  async generateInvoice(dispatchId: string) {
    const order = await prisma.dispatchOrder.findUnique({
      where: { id: dispatchId },
      include: {
        customer: true,
        company: true,
        items: {
          include: { item: true }
        }
      }
    });

    if (!order) throw new Error("Order not found");

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", margin, y);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 150, y);
    y += 10;
    doc.text(`Date: ${format(order.orderDate, "dd MMM yyyy")}`, 150, y);
    y += 10;

    // Company Info
    doc.setFontSize(12);
    doc.text(order.company.name, margin, y);
    y += 15;

    // Bill To
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("BILL TO:", margin, y);
    doc.setTextColor(0);
    y += 5;
    doc.setFontSize(12);
    doc.text(order.customer.name, margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(order.customer.address || "No Address Provided", margin, y);
    doc.text(order.customer.contact || "", margin, y + 5);
    y += 20;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, 170, 8, "F");
    doc.setFontSize(10);
    doc.text("Item / SKU", margin + 2, y + 6);
    doc.text("Qty", margin + 80, y + 6);
    doc.text("Price", margin + 110, y + 6);
    doc.text("Total", margin + 140, y + 6);
    y += 15;

    let grandTotal = 0;

    // Items
    for (const line of order.items) {
      const lineTotal = Number(line.quantity) * Number(line.sellingPrice);
      grandTotal += lineTotal;

      doc.text(`${line.item.name} (${line.item.sku})`, margin, y);
      doc.text(line.quantity.toString(), margin + 80, y);
      doc.text(line.sellingPrice.toString(), margin + 110, y);
      doc.text(lineTotal.toFixed(2), margin + 140, y);
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    // Footer / Totals
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin + 100, y, margin + 170, y);
    y += 10;
    doc.setFontSize(14);
    doc.text("Grand Total:", margin + 100, y);
    doc.text(`$${grandTotal.toFixed(2)}`, margin + 140, y);

    return doc.output("arraybuffer");
  },

  /**
   * Generates a PDF Purchase Order.
   */
  async generatePurchaseOrder(poId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        company: true,
        items: {
          include: { item: true }
        }
      }
    });

    if (!po) throw new Error("Purchase Order not found");

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.text("PURCHASE ORDER", margin, y);
    doc.setFontSize(10);
    doc.text(`PO #: ${po.id.slice(0, 8).toUpperCase()}`, 150, y);
    y += 10;
    doc.text(`Date: ${format(po.orderDate, "dd MMM yyyy")}`, 150, y);
    y += 10;

    // Company Info
    doc.setFontSize(12);
    doc.text(po.company.name, margin, y);
    y += 15;

    // Vendor Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("VENDOR:", margin, y);
    doc.setTextColor(0);
    y += 5;
    doc.setFontSize(12);
    doc.text(po.vendor.name, margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(po.vendor.email || "", margin, y);
    doc.text(po.vendor.contact || "", margin, y + 5);
    y += 20;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, 170, 8, "F");
    doc.setFontSize(10);
    doc.text("Item / SKU", margin + 2, y + 6);
    doc.text("Qty Ordered", margin + 80, y + 6);
    doc.text("Cost", margin + 115, y + 6);
    doc.text("Total", margin + 145, y + 6);
    y += 15;

    let grandTotal = 0;

    // Items
    for (const line of po.items) {
      const lineTotal = Number(line.quantityOrdered) * Number(line.costPrice);
      grandTotal += lineTotal;

      doc.text(`${line.item.name} (${line.item.sku})`, margin, y);
      doc.text(line.quantityOrdered.toString(), margin + 80, y);
      doc.text(line.costPrice.toString(), margin + 115, y);
      doc.text(lineTotal.toFixed(2), margin + 145, y);
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    // Totals
    y += 10;
    doc.line(margin + 100, y, margin + 170, y);
    y += 10;
    doc.setFontSize(14);
    doc.text("Total Amount:", margin + 100, y);
    doc.text(`$${grandTotal.toFixed(2)}`, margin + 140, y);

    return doc.output("arraybuffer");
  }
};
