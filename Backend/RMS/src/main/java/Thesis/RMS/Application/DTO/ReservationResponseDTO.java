package Thesis.RMS.Application.DTO;

import Thesis.RMS.Domain.Enums.ReservationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationResponseDTO {
    private Long id;
    private Long tableId;
    private String customerName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ReservationStatus status;
}
