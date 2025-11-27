package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Domain.Model.Receipt;
import Thesis.RMS.Domain.Model.Order;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Repository.ReceiptRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReceiptPdfService {

    private final ReceiptRepository receiptRepository;

    private static final float RECEIPT_WIDTH = 220f;
    private static final float RECEIPT_HEIGHT = 600f;

    @Transactional(readOnly = true)
    public byte[] generateReceiptPdf(Long receiptId) {
        Receipt receipt = receiptRepository.findById(receiptId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Receipt with ID " + receiptId + " not found"));

        Order order = receipt.getOrder();
        if (order == null) {
            throw new IllegalStateException("Receipt has no associated order");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Rectangle pageSize = new Rectangle(RECEIPT_WIDTH, RECEIPT_HEIGHT);
        Document document = new Document(pageSize, 10, 10, 10, 10);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 10, Font.BOLD);
            Font normalFont = new Font(Font.COURIER, 8, Font.NORMAL);
            Font boldFont = new Font(Font.COURIER, 8, Font.BOLD);

            Paragraph header = new Paragraph("SMART RESTAURANT\nRECEIPT", titleFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            document.add(new Paragraph(" ", normalFont)); // spacer

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            document.add(new Paragraph("Receipt ID: " + receipt.getId(), normalFont));
            document.add(new Paragraph("Order ID  : " + order.getId(), normalFont));
            document.add(new Paragraph("Table     : " + order.getTableData().getTableNumber(), normalFont));
            document.add(new Paragraph("Issued at : " + receipt.getIssuedAt().format(dtf), normalFont));

            if (order.getStaff() != null) {
                document.add(new Paragraph("Waiter    : " + order.getStaff().getName(), normalFont));
            }

            document.add(new Paragraph("--------------------------------", normalFont));

            PdfPTable itemsTable = new PdfPTable(2);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{3f, 1f}); // description, price

            com.lowagie.text.pdf.PdfPCell itemHeader =
                    new com.lowagie.text.pdf.PdfPCell(new Phrase("Item", boldFont));
            itemHeader.setBorder(Rectangle.NO_BORDER);
            itemsTable.addCell(itemHeader);

            com.lowagie.text.pdf.PdfPCell priceHeader =
                    new com.lowagie.text.pdf.PdfPCell(new Phrase("Price", boldFont));
            priceHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            priceHeader.setBorder(Rectangle.NO_BORDER);
            itemsTable.addCell(priceHeader);

            for (Item item : order.getItems()) {
                com.lowagie.text.pdf.PdfPCell itemCell =
                        new com.lowagie.text.pdf.PdfPCell(new Phrase(item.getName(), normalFont));
                itemCell.setBorder(Rectangle.NO_BORDER);
                itemsTable.addCell(itemCell);

                com.lowagie.text.pdf.PdfPCell priceCell =
                        new com.lowagie.text.pdf.PdfPCell(new Phrase(
                                String.format("%.2f", item.getPrice()), normalFont));
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                priceCell.setBorder(Rectangle.NO_BORDER);
                itemsTable.addCell(priceCell);
            }

            document.add(itemsTable);

            document.add(new Paragraph("--------------------------------", normalFont));

            document.add(new Paragraph(
                    String.format("Subtotal : %.2f", receipt.getTotalAmount()),
                    boldFont));
            document.add(new Paragraph(
                    String.format("Tip      : %.2f", receipt.getTipAmount()),
                    boldFont));
            document.add(new Paragraph(
                    String.format("Total    : %.2f", receipt.getFinalAmount()),
                    boldFont));

            document.add(new Paragraph("--------------------------------", normalFont));
            Paragraph footer = new Paragraph("Thank you for your visit!", normalFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (DocumentException e) {
            throw new RuntimeException("Error generating receipt PDF", e);
        } finally {
            document.close();
        }

        return baos.toByteArray();
    }
}
