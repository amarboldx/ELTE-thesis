package Thesis.RMS.Application.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptDTO {
    private Long id;
    private Long orderId;
    private LocalDateTime issuedAt;
    private double totalAmount;
    private double tipAmount;
    private double finalAmount;
}