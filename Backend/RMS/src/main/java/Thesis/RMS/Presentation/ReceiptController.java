package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.ReceiptDTO;
import Thesis.RMS.Application.UseCases.ReceiptPdfService;
import Thesis.RMS.Application.UseCases.ReceiptUseCases;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/receipts")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReceiptController {

    private final ReceiptPdfService receiptPdfService;
    private final ReceiptUseCases receiptUseCases;


    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    public ResponseEntity<byte[]> getReceiptPdf(@PathVariable Long id) {
        byte[] pdfBytes = receiptPdfService.generateReceiptPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "inline", "receipt-" + id + ".pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/save")
    public ResponseEntity<ReceiptDTO> saveReceipt(@RequestBody ReceiptDTO dto) {
        return ResponseEntity.ok(receiptUseCases.saveReceipt(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptDTO> getReceiptById(@PathVariable Long id) {
        return ResponseEntity.ok(receiptUseCases.getReceiptById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ReceiptDTO> getReceiptByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(receiptUseCases.getReceiptByOrderId(orderId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    public ResponseEntity<List<ReceiptDTO>> getAllReceipts() {
        return ResponseEntity.ok(receiptUseCases.getAllReceipts());
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<ReceiptDTO>> getReceiptsByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(receiptUseCases.getReceiptsByStaffId(staffId));
    }

    @GetMapping("/between")
    public ResponseEntity<List<ReceiptDTO>> getBetween(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end
    ) {
        return ResponseEntity.ok(receiptUseCases.getReceiptsIssuedBetween(start, end));
    }
}